/**
 * ============================================================================
 *  Apps Script — đẩy data.json cho trang teamqamcvn.com/newbie/
 *  (dựa trên assets/apps_script_template.gs của skill sheet-to-dashboard)
 *
 *  Đọc 2 tab của Google Sheet "Newbie & CSAT":
 *    - "1. Overall" : bảng theo dõi lộ trình / headcount từng khóa (K...),
 *                     do con người cập nhật thủ công mỗi tuần.
 *    - "2. Raw"     : log CSAT theo từng lượt case / agent / ngày, cột
 *                     "New Outline" = "Yes" đánh dấu case thuộc các khóa
 *                     Newbie đang theo lộ trình mới (join với "1. Overall"
 *                     qua cột "Batch" = "Khóa Newbie").
 *
 *  CÀI ĐẶT (1 lần cho project Apps Script này):
 *   1) Mở Extensions > Apps Script từ chính Google Sheet Newbie & CSAT.
 *   2) Dán file này vào, KHÔNG sửa gì ngoài phần CONFIG nếu tên tab của bạn
 *      khác đi.
 *   3) ⚙️ Project Settings > Script Properties > thêm GITHUB_TOKEN = <token>
 *      (Fine-grained token, quyền Contents: Read & write trên repo tqamcvn/MCVN).
 *      KHÔNG dán token vào code, KHÔNG gửi token cho ai kể cả Claude.
 *   4) Chạy hàm `setup` một lần (Allow quyền) -> tạo trigger 30' + đẩy lần đầu.
 *  Ép đẩy ngay sau khi sửa Sheet: chạy tay hàm `refreshAndPush`.
 *  Kiểm tra: teamqamcvn.com/newbie/data.json (chờ Pages build ~1-3 phút).
 * ============================================================================
 */

/* ===================== CONFIG ===================== */
const SPREADSHEET_ID = '1Yvh4aAR2gGVLNL6Dfws5Gg0RdR1pPLOhrAQ0qanlrHM';
const SHEET_OVERALL   = '1. Overall';
const SHEET_RAW       = '2. Raw';
const GH_OWNER  = 'tqamcvn';
const GH_REPO   = 'MCVN';
const GH_BRANCH = 'ChatLogPartime';
const GH_PATH   = 'newbie/data.json';
const TZ        = 'Asia/Ho_Chi_Minh';

// Benchmark CSAT theo Queue + Kênh (dùng để tính passRate & badge Đạt/Thiếu target)
const CSAT_TARGETS = {
  'Seller|Call': 92, 'Buyer|Call': 93,
  'Seller|Chat': 78, 'Buyer|Chat': 70
};
// Số ngày gần nhất dùng để tính các chỉ số "hiện tại" (CSAT theo agent/kênh,
// contribute rating, xu hướng daily/monthly) — khớp ghi chú "Tính 61 ngày"
// trên tab Raw. Bảng CSAT theo tuần (Tuần 1..8) KHÔNG áp dụng cửa sổ này vì
// cần toàn bộ lịch sử của khóa.
const ROLLING_WINDOW_DAYS = 61;

function buildPayload_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const cohorts = readOverall_(ss);
  applyRawToCohorts_(ss, cohorts);

  const cohortList = Object.keys(cohorts)
    .sort()
    .map(function (id) { return finalizeCohort_(cohorts[id]); });

  const now = new Date();
  return {
    lastUpdated:     Utilities.formatDate(now, TZ, "yyyy-MM-dd'T'HH:mm:ssXXX"),
    lastUpdatedText: Utilities.formatDate(now, TZ, 'HH:mm - dd/MM/yyyy'),
    cohorts:  cohortList,
    agents:   globalAgents_,
    trend:    globalTrend_,
    queueChannel: globalQueueChannel_
  };
}

/* ---- 1) Đọc tab "1. Overall" -> map cohorts theo Khóa Newbie ---- */
function readOverall_(ss) {
  const sh = ss.getSheetByName(SHEET_OVERALL);
  if (!sh) throw new Error('Không tìm thấy tab "' + SHEET_OVERALL + '"');
  const vals = sh.getDataRange().getValues();
  const head = findHeaderRow_(vals, ['Khóa Newbie', 'Que']);
  const headerRow = vals[head];
  const idx = headerIndex_(headerRow);
  const col = function (name) { return idx[normHeader_(name)]; };

  const cWeek = [];
  for (let w = 1; w <= 8; w++) cWeek.push(col('W' + w));

  const cohorts = {};
  for (let i = head + 1; i < vals.length; i++) {
    const r = vals[i];
    const id = String(r[col('khóa newbie')] || '').trim();
    if (!id) continue;

    const currentStatus = String(r[col('current status')] || '').trim();
    const phaseCode = String(r[col('phase hiện tại')] || '').trim();
    const curWeekText = String(r[col('tuần hiện tại')] || '').trim();
    const curWeekNum = curWeekText ? (parseInt(curWeekText.replace(/[^0-9]/g, ''), 10) || 0) : 0;

    // 3 nhóm số cuối hàng, LUÔN ở 9 cột cuối theo đúng thứ tự cố định trong
    // sheet: Current(Total,Chat,Call) | First stage(Total,Chat,Call) | Quit(Total,Chat,Call)
    const n = r.length;
    const curHC   = toNum_(r[n - 9]);
    const rawHC   = toNum_(r[n - 6]);
    const quitHC  = toNum_(r[n - 3]);
    const attritionRate = rawHC > 0 ? Math.round((quitHC / rawHC) * 1000) / 10 : 0;

    // endDate: ngày cuối cùng tìm thấy giữa "Ghi chú lộ trình" và "Current status"
    // (bao gồm các cột Train/Golive/End date theo từng Phase — hoặc ngày kết
    // thúc probation được ghi trực tiếp với các khóa cũ).
    let endDate = '';
    const scanStart = col('ghi chú lộ trình') + 1;
    const scanEnd = col('current status');
    for (let c = scanStart; c < scanEnd; c++) {
      if (r[c] instanceof Date) endDate = fmtDate_(r[c]);
    }

    const isDone = /done/i.test(currentStatus);
    const status = isDone ? 'Done probation' : (phaseCode.replace(/\s+/g, '') + currentStatus.replace(/\s+/g, ''));
    const phase = phaseCode ? ('Phase ' + phaseCode.replace(/[^0-9]/g, '')) : (isDone ? '' : phaseCode);

    cohorts[id] = {
      id: id,
      trainer: String(r[col('chat')] || '').trim(),   // cột "Chat" = QA/Trainer PIC
      lead:    String(r[col('call')] || '').trim(),   // cột "Call" = Teamlead
      queue:   String(r[col('que')] || '').trim(),
      note:    String(r[col('ghi chú lộ trình')] || '').trim(),
      status: status,
      phase: phase,
      isDone: isDone,
      curWeekNum: curWeekNum,
      endDate: endDate,
      rawHC: rawHC, quitHC: quitHC, curHC: curHC,
      attritionRate: attritionRate,
      // "Tuần hiện tại" của khóa <-> report_week thật trên tab Raw, dùng để dựng csatWeeks[]
      weekCodes: cWeek.map(function (c) { return String(r[c] || '').trim(); }),
      csatWeeks: [null, null, null, null, null, null, null, null],
      csatChat: null, csatCall: null, csatOther: null,
      goodCases: 0, avgCases: 0, badCases: 0, totalCases: 0,
      passRate: 0
    };
  }
  return cohorts;
}

/* ---- 2) Đọc tab "2. Raw", join theo Batch, tính các chỉ số ---- */
var globalAgents_ = [];
var globalTrend_ = { daily: { labels: [], values: [] }, monthly: { labels: [], values: [] } };
var globalQueueChannel_ = {};

function applyRawToCohorts_(ss, cohorts) {
  const sh = ss.getSheetByName(SHEET_RAW);
  if (!sh) throw new Error('Không tìm thấy tab "' + SHEET_RAW + '"');
  const vals = sh.getDataRange().getValues();
  const head = findHeaderRow_(vals, ['agent_email', 'good_cnt']);
  const headerRow = vals[head];
  const idx = headerIndex_(headerRow);
  const col = function (name) { return idx[normHeader_(name)]; };
  const channelCols = colAll_(headerRow, 'channel_name');
  // Cột channel_name THỨ 2 (nếu có) là bản đã chuẩn hoá Chat/Internet Call/Other channel.
  const colChannelNorm = channelCols.length > 1 ? channelCols[1] : channelCols[0];
  const colNewOutline = idx[normHeader_('New Outline')];

  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - ROLLING_WINDOW_DAYS);

  // key = batch|weekCode -> {good,bad}
  const weekAgg = {};
  // key = batch|channelBucket -> {good,bad}
  const channelAgg = {};
  // key = batch -> {good,avg,bad}
  const contributeAgg = {};
  // key = email|channelBucket -> {name,batch,queueType,channel,good,avg,bad,lastDate}
  const agentAgg = {};
  // key = day (dd/MM) -> {good,bad}
  const dailyAgg = {};
  // key = ym -> {good,bad}
  const monthlyAgg = {};
  // key = cohortQueue|channelBucket(Chat/Call only) -> {good,bad}
  const queueChannelAgg = {};

  for (let i = head + 1; i < vals.length; i++) {
    const r = vals[i];
    const email = String(r[col('agent_email')] || '').trim().toLowerCase();
    if (!email) continue;

    const isNewOutline = colNewOutline !== undefined
      ? /^yes$/i.test(String(r[colNewOutline] || '').trim())
      : true;
    if (!isNewOutline) continue;

    const batch = String(r[col('batch')] || '').trim();
    const cohort = cohorts[batch];
    if (!cohort) continue; // chỉ giữ case thuộc khóa có trong "1. Overall"

    const good = toNum_(r[col('good_cnt')]);
    const avg  = toNum_(r[col('avg_cnt')]);
    const bad  = toNum_(r[col('bad_cnt')]);

    const reportDateRaw = r[col('report_date')];
    const reportDate = reportDateRaw instanceof Date ? reportDateRaw : null;
    const reportWeekRaw = r[col('report_week')];
    const weekCode = weekLabel_(reportWeekRaw instanceof Date ? reportWeekRaw : reportDateRaw);

    const rawChannel = String(r[channelCols[0]] || '').trim();
    const normChannel = String(r[colChannelNorm] || rawChannel || '').trim();
    const channelBucket = normChannel === 'Chat' ? 'Chat'
      : normChannel === 'Internet Call' ? 'Internet Call'
      : 'Other channel';

    // -- 1) Ma trận CSAT theo tuần lộ trình của khóa (toàn bộ lịch sử, không giới hạn 61 ngày) --
    const wKey = batch + '|' + weekCode;
    if (!weekAgg[wKey]) weekAgg[wKey] = { good: 0, bad: 0 };
    weekAgg[wKey].good += good; weekAgg[wKey].bad += bad;

    // Các chỉ số "hiện tại" chỉ tính trong cửa sổ rolling window
    const inWindow = !reportDate || reportDate >= windowStart;
    if (!inWindow) continue;

    // -- 2) CSAT theo kênh / khóa --
    const cKey = batch + '|' + channelBucket;
    if (!channelAgg[cKey]) channelAgg[cKey] = { good: 0, bad: 0 };
    channelAgg[cKey].good += good; channelAgg[cKey].bad += bad;

    // -- 3) Contribute rating / khóa --
    if (!contributeAgg[batch]) contributeAgg[batch] = { good: 0, avg: 0, bad: 0 };
    contributeAgg[batch].good += good; contributeAgg[batch].avg += avg; contributeAgg[batch].bad += bad;

    // -- 4) Chi tiết theo agent + kênh --
    const aKey = email + '|' + channelBucket;
    if (!agentAgg[aKey]) {
      agentAgg[aKey] = {
        name: String(r[col('agent_name')] || '').trim().replace(/^\d+\.\s*/, ''),
        email: email,
        cohort: batch,
        qa: cohort.trainer,
        lead: cohort.lead,
        queue: String(r[col('shopee_user_type')] || '').trim() || cohort.queue,
        channel: channelBucket,
        good: 0, avg: 0, bad: 0,
        lastDate: null
      };
    }
    agentAgg[aKey].good += good; agentAgg[aKey].avg += avg; agentAgg[aKey].bad += bad;
    if (reportDate && (!agentAgg[aKey].lastDate || reportDate > agentAgg[aKey].lastDate)) {
      agentAgg[aKey].lastDate = reportDate;
    }

    // -- 5) Xu hướng daily / monthly (toàn bộ các khóa gộp lại) --
    if (reportDate) {
      const dKey = Utilities.formatDate(reportDate, TZ, 'dd/MM');
      if (!dailyAgg[dKey]) dailyAgg[dKey] = { good: 0, bad: 0, sortKey: reportDate.getTime() };
      dailyAgg[dKey].good += good; dailyAgg[dKey].bad += bad;
    }
    const ymKey = ymFromDate_(r[col('report_month')] || reportDateRaw);
    if (!monthlyAgg[ymKey]) monthlyAgg[ymKey] = { good: 0, bad: 0 };
    monthlyAgg[ymKey].good += good; monthlyAgg[ymKey].bad += bad;

    // -- 6) Ma trận Queue(của khóa) x Kênh (chỉ Chat/Call) --
    if (channelBucket === 'Chat' || channelBucket === 'Internet Call') {
      const qKey = cohort.queue + '|' + channelBucket;
      if (!queueChannelAgg[qKey]) queueChannelAgg[qKey] = { good: 0, bad: 0 };
      queueChannelAgg[qKey].good += good; queueChannelAgg[qKey].bad += bad;
    }
  }

  // ---- Gán ngược vào cohorts ----
  Object.keys(cohorts).forEach(function (id) {
    const c = cohorts[id];
    c.weekCodes.forEach(function (wCode, i) {
      if (!wCode) return;
      const agg = weekAgg[id + '|' + wCode];
      if (agg && (agg.good + agg.bad) > 0) {
        c.csatWeeks[i] = Math.round((agg.good / (agg.good + agg.bad)) * 1000) / 10;
      }
    });

    const chat = channelAgg[id + '|Chat'];
    const call = channelAgg[id + '|Internet Call'];
    const other = channelAgg[id + '|Other channel'];
    c.csatChat = pct_(chat);
    c.csatCall = pct_(call);
    c.csatOther = pct_(other);

    const contrib = contributeAgg[id] || { good: 0, avg: 0, bad: 0 };
    c.goodCases = contrib.good; c.avgCases = contrib.avg; c.badCases = contrib.bad;
    c.totalCases = contrib.good + contrib.avg + contrib.bad;
  });

  // ---- Danh sách agent (dùng luôn để tính passRate theo khóa) ----
  const agents = Object.keys(agentAgg).map(function (k) { return agentAgg[k]; });
  agents.forEach(function (a) {
    a.csat = pct_(a);
    a.count = a.good + a.bad;
  });
  globalAgents_ = agents
    .filter(function (a) { return a.count > 0; })
    .map(function (a) {
      return {
        name: a.name, cohort: a.cohort, qa: a.qa, lead: a.lead,
        queue: a.queue, channel: a.channel,
        count: a.count, csat: a.csat,
        date: a.lastDate ? fmtDate_(a.lastDate) : ''
      };
    });

  Object.keys(cohorts).forEach(function (id) {
    const rows = agents.filter(function (a) { return a.cohort === id && a.count > 0; });
    if (!rows.length) { cohorts[id].passRate = 0; return; }
    let passed = 0;
    rows.forEach(function (a) {
      const target = CSAT_TARGETS[a.queue + '|' + (a.channel === 'Internet Call' ? 'Call' : a.channel)];
      if (target === undefined || a.csat >= target) passed++;
    });
    cohorts[id].passRate = Math.round((passed / rows.length) * 1000) / 10;
  });

  // ---- Trend daily/monthly ----
  const dailyKeys = Object.keys(dailyAgg).sort(function (a, b) { return dailyAgg[a].sortKey - dailyAgg[b].sortKey; }).slice(-7);
  globalTrend_.daily.labels = dailyKeys;
  globalTrend_.daily.values = dailyKeys.map(function (k) { return pct_(dailyAgg[k]); });

  const monthKeys = Object.keys(monthlyAgg).sort().slice(-6);
  globalTrend_.monthly.labels = monthKeys;
  globalTrend_.monthly.values = monthKeys.map(function (k) { return pct_(monthlyAgg[k]); });

  // ---- Queue x Channel matrix ----
  const qc = {};
  Object.keys(queueChannelAgg).forEach(function (key) {
    const parts = key.split('|');
    const queue = parts[0], channel = parts[1];
    if (!qc[queue]) qc[queue] = { chat: null, call: null };
    const val = pct_(queueChannelAgg[key]);
    if (channel === 'Chat') qc[queue].chat = val; else qc[queue].call = val;
  });
  globalQueueChannel_ = qc;
}

function finalizeCohort_(c) {
  return {
    id: c.id, trainer: c.trainer, lead: c.lead, queue: c.queue,
    status: c.status, phase: c.phase, isDone: c.isDone,
    curWeekNum: c.curWeekNum, endDate: c.endDate,
    rawHC: c.rawHC, quitHC: c.quitHC, curHC: c.curHC, attritionRate: c.attritionRate,
    passRate: c.passRate,
    csatWeeks: c.csatWeeks, csatChat: c.csatChat, csatCall: c.csatCall, csatOther: c.csatOther,
    goodCases: c.goodCases, avgCases: c.avgCases, badCases: c.badCases, totalCases: c.totalCases
  };
}

function pct_(agg) {
  if (!agg || (agg.good + agg.bad) <= 0) return null;
  return Math.round((agg.good / (agg.good + agg.bad)) * 1000) / 10;
}

function colAll_(headerRow, name) {
  const key = normHeader_(name);
  const out = [];
  headerRow.forEach(function (h, i) { if (normHeader_(h) === key) out.push(i); });
  return out;
}
/* ===================== HẾT PHẦN CẦN ĐỔI ===================== */


/* ===================== GIỮ NGUYÊN (theo template của skill) ===================== */

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
  if (current !== null && current === json) return false; // không đổi -> khỏi commit

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

function headerIndex_(headerRow) {
  const idx = {};
  headerRow.forEach(function (h, i) { const k = normHeader_(h); if (k && !(k in idx)) idx[k] = i; });
  return idx;
}

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

function ymFromDate_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyy-MM');
  const s = String(v || '').trim();
  const m = s.match(/(\d{4})[-/](\d{1,2})/);
  return m ? (m[1] + '-' + ('0' + m[2]).slice(-2)) : s.slice(0, 7);
}

/** "W" & WEEKNUM(date, 2) — giống Google Sheets: tuần bắt đầu Thứ 2. Vd "W31". */
function weekLabel_(v) {
  let d = v;
  if (!(d instanceof Date)) {
    const s = String(v || '').trim();
    const m = s.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (!m) return '';
    d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const year = Number(Utilities.formatDate(d, TZ, 'yyyy'));
  const doy  = Number(Utilities.formatDate(d, TZ, 'D'));
  const jan1u = Number(Utilities.formatDate(new Date(year, 0, 1), TZ, 'u')); // 1=T2..7=CN
  return 'W' + (Math.floor((doy + (jan1u - 1) - 1) / 7) + 1);
}
