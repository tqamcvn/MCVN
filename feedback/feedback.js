'use strict';
const $ = id => document.getElementById(id);
const db = window.supabase.createClient(feedbackConfig.url, feedbackConfig.key);
let user, rows = [], votes = [], files = [], timer, draftKey, sending = false, draftId;
const maxBody = 10000;
document.body.classList.toggle('dark', new URLSearchParams(location.search).get('theme') === 'dark');
function message(text) { $('notice').textContent = text; }
function node(tag, text, cls) { const el = document.createElement(tag); el.textContent = text; if (cls) el.className = cls; return el; }
function draft() { return {id:draftId,title:$('title').value,body:$('body').value,kind:document.querySelector('[name=kind]:checked').value,files:files.map(f=>f.name)}; }
function saveDraft() {
  clearTimeout(timer);
  if (!draftKey || sending) return;
  try { localStorage.setItem(draftKey, JSON.stringify(draft())); $('draft-status').textContent = 'Đã lưu bản nháp trên thiết bị này · ' + new Date().toLocaleTimeString('vi-VN'); }
  catch { $('draft-status').textContent = 'Không lưu được bản nháp trên thiết bị. Hãy sao chép nội dung trước khi rời trang.'; }
}
function countBody() {
  const length = Array.from($('body').value).length;
  $('counter').textContent = length.toLocaleString('vi-VN') + ' / 10.000 ký tự';
  $('body').setCustomValidity(length > maxBody ? 'Nội dung vượt 10.000 ký tự. Bản nháp vẫn được giữ nguyên.' : '');
}
function restore() {
  try {
    const raw = localStorage.getItem(draftKey); if (!raw) return;
    const data = JSON.parse(raw);
    if (typeof data.title !== 'string' || typeof data.body !== 'string') throw new Error('draft');
    draftId = typeof data.id === 'string' ? data.id : draftId;
    $('title').value = data.title; $('body').value = data.body;
    document.querySelector('[name=kind][value="' + (data.kind === 'Lỗi' ? 'Lỗi' : 'Đề xuất') + '"]').checked = true;
    $('draft-status').textContent = 'Đã khôi phục bản nháp.' + (data.files?.length ? ' Vui lòng chọn lại ảnh: ' + data.files.join(', ') : '');
  } catch { $('draft-status').textContent = 'Không đọc được bản nháp đã lưu. Hãy giữ trang này mở khi soạn phản hồi.'; }
  countBody();
}
$('form').addEventListener('input', e => { if(e.target.type === 'file') return; countBody(); $('draft-status').textContent = 'Đang lưu bản nháp…'; clearTimeout(timer); timer = setTimeout(saveDraft,2000); });
window.addEventListener('pagehide',saveDraft);
window.addEventListener('beforeunload',saveDraft);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState === 'hidden') saveDraft();});
function closeComposer(){if(sending)return;saveDraft();$('composer').close();}
$('close').onclick = $('cancel').onclick = closeComposer;
$('composer').addEventListener('cancel',e=>{e.preventDefault();closeComposer();});
$('write').onclick=()=>$('composer').showModal();
$('detail-close').onclick=()=>$('detail').close();
$('filter-toggle').onclick=()=>{const open = $('filters').hidden; $('filters').hidden=!open; $('filter-toggle').setAttribute('aria-expanded',String(open));};
const filterIds=['type-filter','status-filter','owner-filter','sort'];
filterIds.forEach(id=>$(id).onchange=render);
$('search').oninput=render;
$('reset').onclick=()=>{filterIds.forEach(id=>$(id).selectedIndex=0);$('search').value='';render();};
function render(){
  const q=$('search').value.toLocaleLowerCase('vi').trim();
  const tally=id=>votes.filter(v=>v.feedback_id===id).length;
  const mine=id=>votes.some(v=>v.feedback_id===id && v.user_id===user.id);
  const filtered=rows.filter(r=>(!q||(r.title+' '+r.body).toLocaleLowerCase('vi').includes(q))&&(!$('type-filter').value||r.kind===$('type-filter').value)&&(!$('status-filter').value||r.status===$('status-filter').value)&&(!$('owner-filter').value||r.author_id===user.id));
  filtered.sort((a,b)=>$('sort').value==='votes'?tally(b.id)-tally(a.id)||new Date(b.created_at)-new Date(a.created_at):$('sort').value==='old'?new Date(a.created_at)-new Date(b.created_at):new Date(b.created_at)-new Date(a.created_at));
  $('chips').replaceChildren();
  filterIds.forEach(id=>{const select=$(id);if(select.selectedIndex || id==='sort'){const chip=node('button',select.options[select.selectedIndex].text+(select.selectedIndex?' ×':''));chip.onclick=()=>{if(select.selectedIndex){select.selectedIndex=0;render();}else{$('filters').hidden=false;$('filter-toggle').setAttribute('aria-expanded','true');select.focus();}};$('chips').append(chip);}});
  $('count').textContent=filtered.length+' phản hồi';$('list').replaceChildren();
  if(!filtered.length){$('list').append(node('div',rows.length?'Không có phản hồi phù hợp với bộ lọc.':'Chưa có phản hồi. Chia sẻ góp ý đầu tiên của bạn.','empty'));return;}
  filtered.forEach(r=>{
    const card=node('article','','card'), vote=node('button','⌃\n'+tally(r.id),'vote');vote.setAttribute('aria-pressed',String(mine(r.id)));vote.setAttribute('aria-label',(mine(r.id)?'Bỏ bình chọn: ':'Bình chọn: ')+r.title);
    vote.onclick=async()=>{vote.disabled=true;try{const result=mine(r.id)?await db.from('feedback_votes').delete().eq('feedback_id',r.id).eq('user_id',user.id):await db.from('feedback_votes').insert({feedback_id:r.id,user_id:user.id});if(result.error)throw result.error;await load();}catch{message('Chưa lưu được bình chọn. Vui lòng thử lại.');vote.disabled=false;}};
    const content=node('div','','card-content'),meta=node('div','','meta'),date=node('time',new Date(r.created_at).toLocaleDateString('en-GB'));date.dateTime=r.created_at;meta.append(date,node('span',r.kind,'badge'),node('span',r.status,'badge status'));
    const title=node('button',r.title,'title-button');title.onclick=()=>showDetail(r);content.append(meta,title,node('p',r.body,'excerpt'));if(r.attachments?.length)content.append(node('p','⌁ '+r.attachments.length+' đính kèm','muted'));card.append(vote,content);$('list').append(card);
  });
}
async function showDetail(r){$('detail-title').textContent=r.title;$('detail-meta').textContent=r.kind+' · '+r.status+' · '+new Date(r.created_at).toLocaleDateString('en-GB');$('detail-body').textContent=r.body;$('detail-files').replaceChildren();(r.attachments||[]).forEach(f=>{const a=node('button',f.name);a.onclick=async()=>{a.disabled=true;const {data,error}=await db.storage.from('feedback-attachments').createSignedUrl(f.path,60);a.disabled=false;if(error){a.textContent='Không tải được ảnh. Nhấn để thử lại.';return;}const link=node('a',f.name);link.href=data.signedUrl;link.target='_blank';link.rel='noopener';a.replaceWith(link);link.click();};$('detail-files').append(a);});$('detail').showModal();}
async function load(){
  const [a,b]=await Promise.all([db.from('feedback').select('*').order('created_at',{ascending:false}),db.from('feedback_votes').select('*')]);
  if(a.error||b.error)throw a.error||b.error;
  rows=a.data;votes=b.data;message('');render();
}
function renderFiles(){ $('file-list').replaceChildren();files.forEach((file,i)=>{const li=node('li',file.name+' · '+(file.size/1024/1024).toFixed(1)+' MB'),remove=node('button','×');remove.type='button';remove.setAttribute('aria-label','Bỏ '+file.name);remove.onclick=()=>{files.splice(i,1);renderFiles();saveDraft();};li.append(remove);$('file-list').append(li);}); }
$('files').onchange=()=>{const incoming=Array.from($('files').files);$('files').value='';if(files.length+incoming.length>3||incoming.some(f=>f.size>5*1024*1024||!['image/png','image/jpeg','image/webp'].includes(f.type))){$('form-error').textContent='Chọn tối đa 3 ảnh PNG, JPG hoặc WebP, mỗi ảnh không quá 5 MB.';return;}files.push(...incoming);$('form-error').textContent='';renderFiles();saveDraft();};
$('form').onsubmit=async e=>{
  e.preventDefault();if(sending||!user)return;
  if(!$('title').value.trim()||!$('body').value.trim()){$('form-error').textContent='Vui lòng nhập tiêu đề và nội dung.';return;}
  countBody();if(!$('form').reportValidity())return;
  saveDraft();sending=true;Array.from($('form').elements).forEach(el=>el.disabled=true);$('submit').textContent='Đang gửi…';$('form-error').textContent='';
  try {
    // Stable ID makes a retry safe when the server committed but the response was lost.
    const existing=await db.from('feedback').select('id').eq('id',draftId).maybeSingle();if(existing.error)throw existing.error;
    if(!existing.data){
      const attachments=[];
      for(let i=0;i<files.length;i++){const file=files[i],path=user.id+'/'+draftId+'/'+i+'-'+crypto.randomUUID();const uploaded=await db.storage.from('feedback-attachments').upload(path,file);if(uploaded.error)throw uploaded.error;attachments.push({name:file.name,path});}
      const result=await db.from('feedback').insert({id:draftId,author_id:user.id,title:$('title').value.trim(),body:$('body').value.trim(),kind:document.querySelector('[name=kind]:checked').value,attachments});if(result.error)throw result.error;
    }
    clearTimeout(timer);try{localStorage.removeItem(draftKey);}catch{}
    $('form').reset();files=[];renderFiles();draftId=crypto.randomUUID();countBody();$('draft-status').textContent='';$('composer').close();
    try{await load();message('Đã gửi phản hồi. Cảm ơn bạn đã đóng góp!');}catch{message('Đã gửi thành công. Tải lại trang để cập nhật danh sách.');}
  }catch{$('form-error').textContent='Chưa gửi được phản hồi. Nội dung và bản nháp vẫn được giữ lại. Vui lòng thử lại.';}
  finally{sending=false;Array.from($('form').elements).forEach(el=>el.disabled=false);$('submit').textContent='Gửi phản hồi';}
};
(async()=>{try{const {data,error}=await db.auth.getUser();if(error||!data.user){message('Vui lòng đăng nhập dashboard để xem và gửi phản hồi.');$('list').replaceChildren();return;}user=data.user;draftKey='tqa.feedback.draft.v1.'+user.id;draftId=crypto.randomUUID();restore();$('write').disabled=false;await load();}catch{message('Không tải được feedback. Kiểm tra kết nối hoặc cấu hình dữ liệu.');$('list').replaceChildren();}})();
