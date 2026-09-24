/**
 * ============================================================================
 *  Apps Script — đẩy data.json cho khối "CSAT của bạn" ở Tổng quan CSAT
 *  (dashboard.html đọc teamqamcvn.com/csat-agent/data.json, tìm dòng theo
 *   email / tên của user đang đăng nhập để so với MCVN Overall).
 *  Dựa trên assets/apps_script_template.gs của skill sheet-to-dashboard.
 *
 *  Nguồn: Google Sheet CSAT theo agent (tab gid=680802481):
 *    - Dòng header có "Agent name" / "Agent email" / ... / "Rating" / "CSAT" x N
 *    - Dòng ngay trên header: nhãn tuần W39, W38, ... (mới nhất bên trái)
 *    - Phía trên nữa: ngày đầu tuần 9/21/2026, 9/14/2026, ...
 *    Lưu ý: tab dùng ô "Choose channel / Choose team" = "*" để lấy toàn bộ.
 *
 *  CÀI ĐẶT (1 lần cho project Apps Script này):
 *   1) Mở Extensions > Apps Script từ chính Google Sheet CSAT agent
 *      (hoặc project độc lập — chỉ cần quyền đọc sheet).
 *   2) Dán file này vào, chỉ sửa phần CONFIG nếu cần.
 *   3) ⚙️ Project Settings > Script Properties > thêm GITHUB_TOKEN = <token>
 *      (Fine-grained token, quyền Contents: Read & write trên repo tqamcvn/MCVN).
 *      KHÔNG dán token vào code, KHÔNG gửi token cho ai kể cả Claude.
 *   4) Chạy hàm `setup` một lần (Allow quyền) -> tạo trigger 30' + đẩy lần đầu.
 *  Ép đẩy ngay: chạy tay hàm `refreshAndPush`.
 *  Kiểm tra: teamqamcvn.com/csat-agent/data.json (chờ Pages build ~1-3 phút).
 * ============================================================================
 */

/* ===================== CONFIG ===================== */
const SPREADSHEET_ID = '1NrKWbj6Fd42RgkYMZv0bUgPsUM6oWtdDQn5gb6mAEQ0';
const SHEET_GID      = 680802481;           // tab CSAT theo agent (gid trong URL)
const LATEST_COL     = 11;                  // cột K = CSAT tuần mới nhất (1-based)
const GH_OWNER  = 'tqamcvn';
const GH_REPO   = 'MCVN';
const GH_BRANCH = 'main';                   // branch GitHub Pages phục vụ teamqamcvn.com
const GH_PATH   = 'csat-agent/data.json';
const TZ        = 'Asia/Ho_Chi_Minh';
// QA phụ trách agent: lấy từ Agent List mà trang CS Performance đã đẩy sẵn (public, cùng repo).
const QA_MAP_URL = 'https://teamqamcvn.com/cs-performance/data.json';
const SKIP_TEAM  = /^DP(\.|\s|$)/i;     // bỏ team DP (DP, DP.TL, DP.Sen)

function buildPayload_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheets().filter(function (s) { return s.getSheetId() === SHEET_GID; })[0];
  if (!sh) throw new Error('Không tìm thấy tab gid=' + SHEET_GID);
  const vals = sh.getDataRange().getValues();

  const head = findHeaderRow_(vals, ['Agent name', 'Agent email']);
  const hdr  = vals[head];
  const idx  = headerIndex_(hdr);
  const cName  = idx[normHeader_('Agent name')];
  const cEmail = idx[normHeader_('Agent email')];
  const cBpo   = idx[normHeader_('BPO')];
  const cRate  = idx[normHeader_('Rating')];

  // Tuần mới nhất LUÔN là cột K; các tuần cũ hơn là các cột "CSAT" liền kề bên phải.
  // Nhãn tuần (W39...) lấy ở dòng ngay trên header.
  const weekRow = head > 0 ? vals[head - 1] : [];
  const weekCols = [];
  for (let c = LATEST_COL - 1; c < hdr.length; c++) {
    if (c > LATEST_COL - 1 && normHeader_(hdr[c]) !== 'csat') break;
    const wk = String(weekRow[c] || '').trim().toUpperCase();
    weekCols.push({ col: c, week: /^W\d+$/.test(wk) ? wk : ('W?' + (c + 1)), start: weekStart_(vals, head, c) });
  }
  const firstCsat = weekCols[0].col;

  const qaMap = loadQaMap_();
  const agents = [];
  for (let i = head + 1; i < vals.length; i++) {
    const r = vals[i];
    const email = String(r[cEmail] || '').trim().toLowerCase();
    if (email.indexOf('@') < 0) continue;
    if (cBpo !== undefined && SKIP_TEAM.test(String(r[cBpo] || '').trim())) continue;

    // Nhãn cột thông tin của tab bị lệch so với nội dung -> nhận diện theo giá trị.
    let channel = '', seniority = '';
    for (let c = cEmail + 1; c < firstCsat; c++) {
      const v = String(r[c] || '').trim();
      if (!channel && /call|chat|case|email|multi|ccs|night/i.test(v)) channel = v;
      if (!seniority && /month|year/i.test(v)) seniority = v;
    }

    agents.push({
      email:     email,
      name:      String(r[cName] || '').trim(),
      team:      cBpo !== undefined ? String(r[cBpo] || '').trim() : '',
      channel:   channel,
      seniority: seniority,
      ratings:   cRate !== undefined ? toNum_(r[cRate]) : 0,
      qa:        (qaMap[email] || {}).qa || '',
      qaEmail:   (qaMap[email] || {}).qaEmail || '',
      csat:      weekCols.map(function (w) { return toPct_(r[w.col]); })   // cùng thứ tự với weeks[]
    });
  }

  const now = new Date();
  return {
    lastUpdated:     Utilities.formatDate(now, TZ, "yyyy-MM-dd'T'HH:mm:ssXXX"),
    lastUpdatedText: Utilities.formatDate(now, TZ, 'HH:mm - dd/MM/yyyy'),
    weeks:           weekCols.map(function (w) { return w.week; }),    // mới nhất trước
    weekStart:       weekCols.map(function (w) { return w.start; }),
    counts:          { agents: agents.length },
    agents:          agents
  };
}

/** email agent -> {qa, qaEmail}. Lỗi tải -> {} (vẫn đẩy CSAT, chỉ thiếu cột QA). */
function loadQaMap_() {
  const map = {};
  try {
    const res = UrlFetchApp.fetch(QA_MAP_URL + '?t=' + Date.now(), { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error('HTTP ' + res.getResponseCode());
    (JSON.parse(res.getContentText()).agents || []).forEach(function (a) {
      const em = String(a.email || '').trim().toLowerCase();
      if (em && a.qaEmail) map[em] = { qa: String(a.qa || '').trim(), qaEmail: String(a.qaEmail).trim().toLowerCase() };
    });
  } catch (err) {
    Logger.log('Không tải được QA map: ' + err);
  }
  return map;
}

/** Ngày đầu tuần: ô Date gần nhất phía trên dòng nhãn tuần, cùng cột. */
function weekStart_(vals, head, c) {
  for (let r = head - 2; r >= 0; r--) {
    if (vals[r][c] instanceof Date) return fmtDate_(vals[r][c]);
  }
  return '';
}

/** Ô % -> tỉ lệ 0..1 (làm tròn 4 số). Ô trống -> null. */
function toPct_(v) {
  if (v === '' || v === null || v === undefined) return null;
  let n;
  if (typeof v === 'number') n = v;
  else {
    const s = String(v).trim();
    if (!s || s === '-') return null;
    n = Number(s.replace(/[%, ]/g, ''));
    if (isNaN(n)) return null;
    if (/%/.test(s) || n > 1) n = n / 100;
  }
  return Math.round(n * 10000) / 10000;
}
/* ===================== HẾT PHẦN CẦN ĐỔI ===================== */


/* ===================== GIỮ NGUYÊN ===================== */

/** Chạy 1 lần: tạo trigger 30' + đẩy lần đầu. */
function setup() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'refreshAndPush') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('refreshAndPush').timeBased().everyMinutes(30).create();
  refreshAndPush();
  Logger.log('Setup xong: trigger 30 phút + data.json đã đẩy.');
}

/** Trigger 30' gọi hàm này (cũng chạy tay được để đẩy ngay). */
function refreshAndPush() {
  const json = JSON.stringify(buildPayload_());
  Logger.log(pushToGitHub_(json) ? 'Đã đẩy data.json mới.' : 'Data không đổi, bỏ qua commit.');
}

/** (Tuỳ chọn) Web app xem/đẩy thủ công khi bạn đang đăng nhập Google. */
function doGet(e) {
  try {
    const json = JSON.stringify(buildPayload_());
    if (e && e.parameter && e.parameter.push === '1') pushToGitHub_(json);
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: String(err && err.message || err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/** PUT <GH_PATH> lên repo qua GitHub API. Chỉ commit khi nội dung đổi. */
function pushToGitHub_(json) {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) throw new Error('Thiếu GITHUB_TOKEN trong Script Properties.');
  const api = 'https://api.github.com/repos/' + GH_OWNER + '/' + GH_REPO + '/contents/' + GH_PATH;
  const headers = {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'apps-script-' + GH_REPO
  };

  let sha = null, current = null;
  const g = UrlFetchApp.fetch(api + '?ref=' + encodeURIComponent(GH_BRANCH),
    { method: 'get', headers: headers, muteHttpExceptions: true });
  if (g.getResponseCode() === 200) {
    const j = JSON.parse(g.getContentText());
    sha = j.sha;
    if (j.content) current = Utilities.newBlob(Utilities.base64Decode(String(j.content).replace(/\n/g, ''))).getDataAsString('UTF-8');
  }
  // So sánh bỏ qua mốc thời gian -> không commit khi số liệu không đổi.
  const strip = function (s) { return s.replace(/"lastUpdated(Text)?":"[^"]*",?/g, ''); };
  if (current !== null && strip(current) === strip(json)) return false;

  const body = {
    message: (GH_PATH.split('/')[0] || 'page') + ' data auto-update ' + Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd'T'HH:mm:ss"),
    content: Utilities.base64Encode(json, Utilities.Charset.UTF_8),
    branch: GH_BRANCH
  };
  if (sha) body.sha = sha;

  const put = UrlFetchApp.fetch(api, {
    method: 'put', contentType: 'application/json', headers: headers,
    payload: JSON.stringify(body), muteHttpExceptions: true
  });
  const code = put.getResponseCode();
  if (code < 200 || code >= 300) throw new Error('GitHub PUT ' + code + ': ' + put.getContentText().slice(0, 400));
  return true;
}

/* ---- helpers đọc sheet ---- */
function normHeader_(s) { return String(s).trim().toLowerCase().replace(/\s+/g, ' '); }

/** Map tên cột -> index; giữ lần xuất hiện ĐẦU TIÊN (an toàn khi có cột trùng tên). */
function headerIndex_(headerRow) {
  const idx = {};
  headerRow.forEach(function (h, i) { const k = normHeader_(h); if (k && !(k in idx)) idx[k] = i; });
  return idx;
}

/** Dò dòng header trong 12 dòng đầu (nhiều tab có dòng phụ phía trên header thật). */
function findHeaderRow_(values, mustHave) {
  const need = mustHave.map(normHeader_);
  for (let r = 0; r < Math.min(values.length, 12); r++) {
    const set = {};
    values[r].forEach(function (v) { set[normHeader_(v)] = true; });
    if (need.every(function (n) { return set[n]; })) return r;
  }
  return 0;
}

function toNum_(v) {
  if (v === '' || v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  const n = Number(String(v).replace(/[, ]/g, ''));
  return isNaN(n) ? 0 : n;
}

function fmtDate_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'dd/MM/yyyy');
  return String(v || '').trim();
}
