const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async()=>{
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1100,height:900}});
await page.route('https://feedback.test/**',route=>{let name=new URL(route.request().url()).pathname.split('/').pop()||'index.html';route.fulfill({body:fs.readFileSync(path.join(__dirname,'../feedback',name)),contentType:name.endsWith('css')?'text/css':name.endsWith('js')?'text/javascript':'text/html'});});
await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'text/javascript',body:`window.testRows=[];window.failSubmit=false;window.supabase={createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'test-user'}}})},from(table){let id;return {select(){return this},order:async()=>({data:window.testRows}),eq(k,v){id=v;return this},maybeSingle:async()=>({data:window.testRows.find(r=>r.id===id)||null}),then(resolve){resolve({data:table==='feedback'?window.testRows:[]})},insert:async row=>{if(window.failSubmit)return {error:'offline'};window.testRows.push({...row,status:'Đang xem xét',created_at:new Date().toISOString()});return {}},delete(){return this}}}})};` }));
const assert=(v,m)=>{if(!v)throw new Error(m)};
await page.goto('https://feedback.test/');await page.locator('#write').click();await page.locator('#title').fill('Kiểm thử bản nháp');await page.locator('#body').fill('Nội dung '.repeat(150));await page.waitForTimeout(2200);
assert((await page.locator('#counter').innerText()).includes('1.350'),'counter');await page.reload();await page.locator('#write').click();assert((await page.locator('#body').inputValue()).length===1350,'restore after reload');
// Synthetic clipboard payloads exercise the same paste event used by Ctrl+V.
async function pastePayload(type='image/png',size=12){return page.evaluate(({type,size})=>{const data=new DataTransfer();if(type==='text/plain')data.setData('text/plain','ordinary text');else data.items.add(new File([new Uint8Array(size)],'pasted.png',{type}));const event=new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true});document.getElementById('body').dispatchEvent(event);return event.defaultPrevented;},{type,size});}
assert(await pastePayload(),'image paste handled');
assert(await page.locator('#file-list li').count()===1,'pasted attachment visible');
assert((await page.locator('#body').inputValue()).length===1350,'image paste preserves body');
assert(!(await pastePayload('text/plain')),'text paste not intercepted');
await pastePayload();await pastePayload();await pastePayload();
assert(await page.locator('#file-list li').count()===3,'three-image limit');
await page.locator('#file-list button').first().click();
await pastePayload('image/png',5*1024*1024+1);
assert(await page.locator('#file-list li').count()===2,'oversized paste rejected');
await pastePayload('image/gif');assert(await page.locator('#file-list li').count()===2,'unsupported type rejected');
while(await page.locator('#file-list button').count())await page.locator('#file-list button').first().click();
await page.locator('#body').fill('Lưu ngay khi đóng');await page.locator('#close').click();await page.reload();await page.locator('#write').click();assert(await page.locator('#body').inputValue()==='Lưu ngay khi đóng','close flush');
await page.evaluate(()=>window.failSubmit=true);await page.locator('#submit').click();await page.locator('#form-error').filter({hasText:'Chưa gửi được'}).waitFor();assert(await page.locator('#body').inputValue()==='Lưu ngay khi đóng','failed submit retains content');
await page.evaluate(()=>window.failSubmit=false);await page.locator('#submit').click();await page.locator('.card').waitFor();assert(await page.evaluate(()=>localStorage.getItem('tqa.feedback.draft.v1.test-user'))===null,'successful submit clears draft');
await page.locator('#filter-toggle').click();await page.locator('#type-filter').selectOption('Lỗi');assert((await page.locator('#list').innerText()).includes('Không có'),'type filter');await page.locator('#reset').click();await page.locator('.title-button').click();assert(await page.locator('#detail-body').innerText()==='Lưu ngay khi đóng','detail');await page.locator('#detail-close').click();
await page.locator('#write').click();await page.locator('#body').fill('a'.repeat(10001));assert(await page.locator('#body').evaluate(el=>!el.checkValidity()),'over-limit validation without truncation');await page.screenshot({path:path.join(require('os').tmpdir(),'feedback-desktop.png'),fullPage:true});
await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(require('os').tmpdir(),'feedback-mobile.png'),fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile overflow');
console.log('PASS: image paste, text paste, attachment count/size/type limits, counter, debounce, reload restoration, close flush, failed/successful submission, filters, detail, length validation, mobile overflow');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

