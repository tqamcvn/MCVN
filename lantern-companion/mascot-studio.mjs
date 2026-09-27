import { buildSheets } from './mascot-sheets.mjs';

const container = document.getElementById('companion-settings');
const studio = document.createElement('section');
studio.className = 'mascot-studio';
studio.setAttribute('aria-labelledby','ms-title');
studio.innerHTML = `
  <h3 id="ms-title">Tạo mascot của bạn</h3>
  <p>Một người bạn nhỏ mang phong cách riêng. Mô tả nhân vật hoặc chọn ảnh để AI vẽ thành mascot.</p>
  <form id="ms-form">
    <div class="ms-fields">
      <div><label for="ms-name">Tên mascot</label><input class="stg-input" id="ms-name" maxlength="40" required placeholder="Ví dụ: Bé Mây" autocomplete="off"></div>
      <div><label for="ms-style">Phong cách</label><select class="stg-input" id="ms-style"><option value="chibi">Chibi dễ thương</option><option value="pixel">Pixel art</option><option value="riso">Riso</option><option value="clay">Đất sét 3D</option></select></div>
    </div>
    <label for="ms-description">Bạn muốn nhân vật như thế nào?</label>
    <textarea class="stg-input" id="ms-description" maxlength="600" placeholder="Một bé rái cá lông nâu chocolate, đeo khăn vàng, tính cách vui vẻ"></textarea>
    <label for="ms-photo">Ảnh tham chiếu <span style="font-weight:400">(không bắt buộc)</span></label>
    <input class="stg-input" id="ms-photo" type="file" accept="image/png,image/jpeg,image/webp" aria-describedby="ms-photo-note">
    <p class="ms-note" id="ms-photo-note">PNG, JPG hoặc WebP, tối đa 4 MB. Ảnh được gửi đến OpenAI để vẽ và không lưu vào thư viện mascot.</p>
    <img class="ms-reference" id="ms-reference" alt="Ảnh tham chiếu đã chọn" hidden>
    <button class="stg-btn" id="ms-clear-photo" type="button" hidden>Bỏ ảnh</button>
    <div class="ms-actions"><button class="stg-btn" id="ms-generate" type="submit" disabled>Tạo mascot</button></div>
    <p class="ms-note">Tối đa 3 lượt / 24 giờ, gồm cả lượt AI không tạo được ảnh. Mascot chỉ lưu cho tài khoản của bạn.</p>
  </form>
  <p class="ms-status" id="ms-status" role="status" aria-live="polite">Đang tải thư viện mascot…</p>
  <div class="ms-preview" id="ms-preview" hidden>
    <span class="ms-character" id="ms-character" role="img" aria-label="Xem trước mascot"></span>
    <strong id="ms-preview-name"></strong>
    <div class="ms-actions" style="justify-content:center"><button class="stg-btn" id="ms-direction" type="button">Đổi hướng</button><button class="stg-btn" id="ms-expression" type="button">Biểu cảm</button><button class="stg-btn" id="ms-use" type="button">Dùng mascot này</button></div>
  </div>
  <div class="ms-library" id="ms-library" aria-label="Mascot đã tạo"></div>`;
container?.append(studio);
const el = id => studio.querySelector('#ms-' + id);
let user = null, client, busy = false, preview = null, referenceURL = '', generation = 0, savedChoice = 'lantern';
const cache = new Map();
function status(text, error = false) { el('status').textContent = text; el('status').dataset.error = String(error); }
function lock(value) { busy = value; studio.setAttribute('aria-busy',String(value)); studio.querySelectorAll('button, input, textarea, select').forEach(node => { node.disabled = value || !user; }); container?.querySelectorAll('[data-mascot-choice]').forEach(node=>{node.disabled=value;}); }
function clearCache() { for (const item of cache.values()) { URL.revokeObjectURL(item.directions); URL.revokeObjectURL(item.reactions); } cache.clear(); preview = null; el('preview').hidden = true; el('library').replaceChildren(); }
function clearPhoto() { if(referenceURL) URL.revokeObjectURL(referenceURL); referenceURL=''; el('photo').value=''; el('reference').removeAttribute('src'); el('reference').hidden=true; el('clear-photo').hidden=true; }
el('clear-photo').onclick = clearPhoto;
el('photo').onchange = () => {
  const file = el('photo').files[0];
  if (!file) return clearPhoto();
  if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 4*1024*1024) { clearPhoto(); return status('Chọn ảnh PNG, JPG hoặc WebP dưới 4 MB.',true); }
  if(referenceURL) URL.revokeObjectURL(referenceURL);
  referenceURL=URL.createObjectURL(file); el('reference').src=referenceURL; el('reference').hidden=false; el('clear-photo').hidden=false;
};
async function prepare(record) {
  if(cache.has(record.id)) return cache.get(record.id);
  const epoch=generation;
  const { data, error } = await client.storage.from('user-mascots').download(record.sheet_path);
  if(error) throw new Error('Chưa tải được ảnh mascot. Kiểm tra kết nối rồi thử lại.');
  const sheets=await buildSheets(data);
  if(epoch!==generation) throw new Error('Tài khoản đã thay đổi.');
  const item={id:record.id,name:record.name,directions:URL.createObjectURL(sheets.directions),reactions:URL.createObjectURL(sheets.reactions)};
  cache.set(record.id,item); return item;
}
function showPreview(item) { preview=item; el('preview').hidden=false; el('preview-name').textContent=item.name; el('character').style.backgroundImage=`url("${item.directions}")`; el('character').style.backgroundPosition='50% 50%'; }
let directionIndex=4, reactionIndex=0;
el('direction').onclick = () => { if(!preview)return; directionIndex=(directionIndex+1)%9; el('character').style.backgroundImage=`url("${preview.directions}")`; el('character').style.backgroundPosition=`${directionIndex%3*50}% ${Math.floor(directionIndex/3)*50}%`; };
el('expression').onclick = () => { if(!preview)return; reactionIndex=(reactionIndex+1)%9; el('character').style.backgroundImage=`url("${preview.reactions}")`; el('character').style.backgroundPosition=`${reactionIndex%3*50}% ${Math.floor(reactionIndex/3)*50}%`; };
async function saveChoice(choice) {
  const { error } = await client.from('mascot_preferences').upsert({user_id:user.id,choice});
  if(error) throw new Error('Chưa lưu được lựa chọn. Vui lòng thử lại.');
  savedChoice=choice;
}
el('use').onclick = async () => {
  if(!preview||busy||!user)return;
  const item=preview,epoch=generation;lock(true);
  try { await saveChoice(item.id); if(epoch!==generation)return; window.LanternCompanion.selectCustomMascot(item); status(`Đã dùng ${item.name}. Lựa chọn đã lưu vào tài khoản.`); }
  catch(error){status(error.message,true);} finally{lock(false);}
};
async function loadLibrary() {
  const epoch=generation;
  const {data,error}=await client.from('mascot_creations').select('id,name,sheet_path').eq('status','ready').order('created_at',{ascending:false}).limit(30);
  if(error) throw new Error('Tính năng mascot cá nhân đang chờ cấu hình máy chủ. Bạn vẫn có thể chọn mascot có sẵn.');
  if(epoch!==generation)return;
  el('library').replaceChildren();
  for(const record of data){
    const button=document.createElement('button');button.type='button';button.textContent=record.name;button.setAttribute('aria-label','Xem mascot '+record.name);
    button.onclick=async()=>{if(busy)return;lock(true);status('Đang tải và căn chỉnh mascot…');try{showPreview(await prepare(record));status('Xem thử các hướng và biểu cảm trước khi dùng.');}catch(error){status(error.message,true);}finally{lock(false);}};
    el('library').append(button);
  }
  return data;
}
el('form').onsubmit=async(event)=>{
  event.preventDefault();if(busy||!user)return;
  const description=el('description').value.trim(),photo=el('photo').files[0];
  if(!description&&!photo)return status('Nhập mô tả hoặc chọn ảnh tham chiếu nhé.',true);
  if(!el('name').value.trim())return status('Đặt tên cho mascot nhé.',true);
  const form=new FormData();form.set('name',el('name').value.trim());form.set('description',description);form.set('style',el('style').value);if(photo)form.set('photo',photo);
  const epoch=generation;lock(true);status('AI đang vẽ mascot. Bạn có thể đóng phần Cài đặt, hãy giữ trang này mở.');el('generate').textContent='Đang vẽ…';
  try{
    const {data,error}=await client.functions.invoke('mascot-create',{body:form});
    if(epoch!==generation)return;
    if(error){let message='Chưa kết nối được dịch vụ tạo ảnh. Nếu yêu cầu đã gửi, kiểm tra thư viện trước khi tạo lại.';try{message=(await error.context.json()).error||message;}catch{}throw new Error(message);}
    if(data?.error)throw new Error(data.error);
    const records=await loadLibrary(),record=records?.find(item=>item.id===data.id);
    if(!record)throw new Error('Ảnh đã tạo nhưng chưa tải được thư viện. Hãy tải lại trang để kiểm tra.');
    showPreview(await prepare(record));clearPhoto();status('Mascot đã sẵn sàng. Xem thử rồi bấm “Dùng mascot này”.');
  }catch(error){if(epoch===generation)status(error.message,true);}finally{if(epoch===generation){lock(false);el('generate').textContent='Tạo mascot';}}
};
async function initialize(){
  client=sb;
  const {data:{user:account},error}=await client.auth.getUser();
  if(error||!account){status('Đăng nhập để tạo và lưu mascot của bạn.');lock(false);return;}
  user=account;lock(true);
  client.auth.onAuthStateChange((event,session)=>{
    if(!session||session.user.id!==user?.id){generation++;user=null;window.LanternCompanion.selectMascot('lantern',false);clearCache();clearPhoto();lock(false);status('Tài khoản đã thay đổi. Tải lại trang để tiếp tục.');}
  });
  const epoch=generation;
  try{
    const records=await loadLibrary();
    if(epoch!==generation)return;
    const {data:preference,error:prefError}=await client.from('mascot_preferences').select('choice').eq('user_id',user.id).maybeSingle();
    if(epoch!==generation)return;
    if(prefError)throw new Error('Chưa tải được lựa chọn mascot.');
    savedChoice=preference?.choice||window.LanternCompanion.getMascot();
    if(preference){
      if(!window.LanternCompanion.selectMascot(savedChoice,false)){
        let record=records.find(item=>item.id===savedChoice);
        if(!record){const result=await client.from('mascot_creations').select('id,name,sheet_path').eq('id',savedChoice).eq('status','ready').maybeSingle();record=result.data;}
        if(record)window.LanternCompanion.selectCustomMascot(await prepare(record));
      }
    }
    status(records.length?'Chọn mascot đã tạo hoặc vẽ một người bạn mới.':'Mascot đầu tiên của bạn bắt đầu từ một ý tưởng.');
  }catch(error){status(error.message,true);}finally{lock(false);}
}
container?.querySelectorAll('[data-mascot-choice]').forEach(input=>input.addEventListener('change',async()=>{
  if(!input.checked||!user)return;
  const previous=savedChoice;
  lock(true);
  try{await saveChoice(input.value);}catch(error){if(cache.has(previous))window.LanternCompanion.selectCustomMascot(cache.get(previous));else window.LanternCompanion.selectMascot(previous,false);status(error.message,true);}finally{lock(false);}
}));
if(container){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();}
