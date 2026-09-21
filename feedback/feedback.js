'use strict';
const $ = id => document.getElementById(id);
const db = window.supabase.createClient(feedbackConfig.url, feedbackConfig.key);
let user, rows = [], votes = [], files = [], timer, draftKey, sending = false, draftId;
let people = new Map(), isManager = false, selectedFeedback = null, detailVersion = 0, imageVersion = 0;
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
    $('draft-status').textContent = 'Đã khôi phục bản nháp.' + (data.files?.length ? ' Vui lòng dán lại ảnh: ' + data.files.join(', ') : '');
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
    const content=node('div','','card-content'),meta=node('div','','meta'),date=node('time',new Date(r.created_at).toLocaleDateString('en-GB'));date.dateTime=r.created_at;meta.append(person(r.author_id),date,node('span',r.kind,'badge'),node('span',r.status,'badge status'));
    const title=node('button',r.title,'title-button');title.onclick=()=>showDetail(r);content.append(meta,title,node('p',r.body,'excerpt'));if(r.attachments?.length)content.append(node('p','⌁ '+r.attachments.length+' đính kèm','muted'));card.append(vote,content);$('list').append(card);
  });
}
function person(id){
  const p=people.get(id)||{display_name:'Thành viên',avatar_url:''};
  const wrap=node('span','','person'),avatar=node('span',p.display_name.trim().split(/\s+/).slice(-2).map(x=>x[0]).join('').toUpperCase(),'avatar');
  if(/^https:\/\//i.test(p.avatar_url)||/^data:image\/(png|jpeg|webp);base64,/i.test(p.avatar_url)){
    const img=document.createElement('img');img.alt='';img.src=p.avatar_url;img.referrerPolicy='no-referrer';img.onerror=()=>img.remove();avatar.append(img);
  }
  wrap.append(avatar,node('span',p.display_name));return wrap;
}
$('image-close').onclick=()=>{$('image-dialog').close();};
$('image-dialog').addEventListener('close',()=>{imageVersion++;$('image-full').removeAttribute('src');});
async function openImage(file){
  const version=++imageVersion;$('image-title').textContent=file.name;$('image-full').removeAttribute('src');$('image-full').alt=file.name;$('image-message').textContent='Đang tải ảnh…';$('image-dialog').showModal();
  try{const {data,error}=await db.storage.from('feedback-attachments').createSignedUrl(file.path,300);if(error)throw error;if(version!==imageVersion)return;
    $('image-full').onload=()=>{if(version===imageVersion)$('image-message').textContent='';};
    $('image-full').onerror=()=>{if(version===imageVersion)$('image-message').textContent='Không tải được ảnh. Đóng và thử lại.';};
    $('image-full').src=data.signedUrl;
  }catch{if(version===imageVersion)$('image-message').textContent='Không tải được ảnh. Đóng và thử lại.';}
}
async function showDetail(r){
  const version=++detailVersion;selectedFeedback=r;$('detail-title').textContent=r.title;
  $('detail-meta').replaceChildren(person(r.author_id),node('span',' · '+r.kind+' · '+r.status+' · '+new Date(r.created_at).toLocaleDateString('en-GB')));
  $('detail-body').textContent=r.body;$('detail-files').replaceChildren();
  (r.attachments||[]).forEach(f=>{const button=node('button','▧ '+f.name);button.onclick=()=>openImage(f);$('detail-files').append(button);});
  $('manager-actions').hidden=!isManager;$('reply-form').hidden=!isManager;$('detail-error').textContent='';
  renderTask(r);loadExperience(r,version);
  $('reply-body').value='';try{$('reply-body').value=sessionStorage.getItem('feedback.reply.'+user.id+'.'+r.id)||'';}catch{}
  $('replies').textContent='Đang tải phản hồi…';if(!$('detail').open)$('detail').showModal();
  try{const result=await db.from('feedback_replies').select('*').eq('feedback_id',r.id).order('created_at');if(result.error)throw result.error;if(version!==detailVersion)return;
    $('replies').replaceChildren();if(!result.data.length)$('replies').textContent='Chưa có phản hồi từ MNG.';
    result.data.forEach(reply=>{const box=node('article','','reply');box.append(person(reply.author_id),node('time',new Date(reply.created_at).toLocaleString('vi-VN'),'muted'),node('p',reply.body));$('replies').append(box);});
  }catch{if(version===detailVersion)$('replies').textContent='Không tải được phản hồi. Đóng và mở lại để thử lại.';}
}
$('reply-body').oninput=()=>{try{sessionStorage.setItem('feedback.reply.'+user.id+'.'+selectedFeedback.id,$('reply-body').value);}catch{}};
async function setStatus(status){
  if(!isManager||!selectedFeedback)return;const id=selectedFeedback.id;
  $('task-status').disabled=true;
  try{const result=await db.rpc('feedback_set_status',{target_id:id,new_status:status});if(result.error)throw result.error;await load();if(selectedFeedback.id===id){selectedFeedback=rows.find(r=>r.id===id);$('detail-meta').replaceChildren(person(selectedFeedback.author_id),node('span',' · '+selectedFeedback.kind+' · '+status));renderTask(selectedFeedback);loadExperience(selectedFeedback,detailVersion);$('detail-error').textContent='Đã cập nhật: '+status;}}
  catch{$('detail-error').textContent='Chưa cập nhật được trạng thái. Vui lòng thử lại.';}
  finally{$('task-status').disabled=false;$('task-status').value=['Đã nhận','Đang thực hiện','Hoàn thành'].includes(selectedFeedback.status)?selectedFeedback.status:'';}
}
$('task-status').onchange=()=>{if($('task-status').value)setStatus($('task-status').value);};
$('reply-form').onsubmit=async e=>{
  e.preventDefault();const body=$('reply-body').value.trim();if(!isManager||!body||!selectedFeedback)return;
  const id=selectedFeedback.id;$('reply-submit').disabled=true;
  try{const result=await db.from('feedback_replies').insert({feedback_id:id,author_id:user.id,body});if(result.error)throw result.error;try{sessionStorage.removeItem('feedback.reply.'+user.id+'.'+id);}catch{}await load();if(selectedFeedback.id===id)await showDetail(rows.find(r=>r.id===id));}
  catch{$('detail-error').textContent='Chưa gửi được phản hồi. Nội dung vẫn được giữ lại.';}
  finally{$('reply-submit').disabled=false;}
};
async function load(){
  const [a,b,p,m]=await Promise.all([db.from('feedback').select('*').order('created_at',{ascending:false}),db.from('feedback_votes').select('*'),db.rpc('feedback_people'),db.rpc('feedback_is_manager')]);
  if(a.error||b.error||p.error||m.error)throw a.error||b.error||p.error||m.error;
  rows=a.data;votes=b.data;people=new Map(p.data.map(p=>[p.id,p]));isManager=m.data===true;message('');render();await loadNotifications();
}
let previewUrls=[];
function renderFiles(){
  previewUrls.forEach(url=>URL.revokeObjectURL(url));previewUrls=[];
  $('file-list').replaceChildren();
  files.forEach((file,i)=>{
    const li=node('li','','image-preview'),img=document.createElement('img');
    const url=URL.createObjectURL(file);previewUrls.push(url);img.src=url;img.alt='Ảnh đã dán: '+file.name;
    const caption=node('div','','image-caption'),name=node('span',file.name+' · '+(file.size/1024/1024).toFixed(1)+' MB');
    const remove=node('button','×');remove.type='button';remove.setAttribute('aria-label','Bỏ '+file.name);
    remove.onclick=()=>{if(sending)return;files.splice(i,1);renderFiles();saveDraft();};
    caption.append(name,remove);li.append(img,caption);$('file-list').append(li);
  });
}
function addFiles(incoming){
  if(sending || !incoming.length) return;
  if(files.length+incoming.length>3||incoming.some(f=>f.size>5*1024*1024||!['image/png','image/jpeg','image/webp'].includes(f.type))){
    $('form-error').textContent='Chọn tối đa 3 ảnh PNG, JPG hoặc WebP, mỗi ảnh không quá 5 MB.';
    return;
  }
  files.push(...incoming);$('form-error').textContent='';renderFiles();saveDraft();
}
// Handle the user's paste directly; no clipboard permission or background reads.
document.addEventListener('paste',e=>{
  if(!$('composer').open || sending || !e.clipboardData) return;
  const incoming=Array.from(e.clipboardData.items || [])
    .filter(item=>item.kind==='file' && item.type.startsWith('image/'))
    .map(item=>item.getAsFile()).filter(Boolean);
  if(!incoming.length) return; // Preserve ordinary text paste.
  e.preventDefault();
  addFiles(incoming);
});
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

function renderTask(r){
  const steps=['Đang xem xét','Đã nhận','Đang thực hiện','Hoàn thành'];const current=steps.indexOf(r.status);
  $('task-progress').replaceChildren(...steps.map((step,i)=>{const li=node('li',(i<=current?'✓ ':'')+step,i===current?'current':i<current?'done':'');if(i===current)li.setAttribute('aria-current','step');return li;}));
  $('task-status').value=steps.slice(1).includes(r.status)?r.status:'';
}
async function loadNotifications(){
 try{const result=await db.from('feedback_notifications').select('*').order('created_at',{ascending:false}).limit(50);if(result.error)throw result.error;
 $('inbox').hidden=!result.data.length;$('unread-count').textContent=result.data.filter(n=>!n.read_at).length+' chưa đọc';$('notification-list').replaceChildren();
 result.data.forEach(n=>{const done=n.status==='Hoàn thành';const text=n.actor_name+(n.kind==='reply'?' đã phản hồi':done?' đã hoàn thành yêu cầu':' đã cập nhật: '+n.status);const button=node('button','','notification '+(n.read_at?'':'unread'));button.append(node('strong',text),node('span',rows.find(r=>r.id===n.feedback_id)?.title||'Feedback'),node('small',done?'Mời bạn đánh giá trải nghiệm sau khi xử lý.':new Date(n.created_at).toLocaleString('vi-VN')));
 button.onclick=async()=>{try{await load();const r=rows.find(r=>r.id===n.feedback_id);if(!r)return;await showDetail(r);const read=await db.rpc('feedback_read_notification',{notification_id:n.id});if(read.error)throw read.error;await loadNotifications();window.parent.postMessage({type:'feedback-notifications-changed'},location.origin);}catch{message('Không mở được thông báo. Vui lòng thử lại.');}};$('notification-list').append(button);});
 }catch{ /* Keep feedback usable if the notification request is temporarily unavailable. */ }
}
async function loadExperience(r,version){
 $('experience').hidden=r.status!=='Hoàn thành'||r.author_id!==user.id;$('experience-form').hidden=true;if($('experience').hidden)return;
 $('experience-message').textContent='Đang tải đánh giá…';
 try{const result=await db.from('feedback_experiences').select('*').eq('feedback_id',r.id).maybeSingle();if(result.error)throw result.error;if(version!==detailVersion)return;
 if(result.data){$('experience-message').textContent='Cảm ơn bạn đã đánh giá '+result.data.rating+'/5. '+result.data.comment;}
 else{$('experience-message').textContent='MNG đã hoàn thành yêu cầu. Bạn hãy đánh giá trải nghiệm để đội ngũ cải thiện nhé.';$('experience-form').hidden=false;$('experience-form').reset();}
 }catch{if(version===detailVersion)$('experience-message').textContent='Chưa tải được đánh giá. Hãy đóng và mở lại feedback.';}
}
$('experience-form').onsubmit=async e=>{e.preventDefault();const r=selectedFeedback;$('experience-submit').disabled=true;try{const result=await db.from('feedback_experiences').insert({feedback_id:r.id,author_id:user.id,rating:Number($('experience-rating').value),comment:$('experience-comment').value.trim()});if(result.error)throw result.error;await loadExperience(r,detailVersion);}catch{$('experience-message').textContent='Chưa gửi được đánh giá. Vui lòng thử lại.';}finally{$('experience-submit').disabled=false;}};
setInterval(()=>{if(user&&!document.hidden)loadNotifications();},30000);
