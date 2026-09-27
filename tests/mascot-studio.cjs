// Run with Playwright available on NODE_PATH. Uses local fixtures, never paid APIs.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const mock=`
const mock={user:{id:'account-a',email:'a@shopee.com'},choice:null,records:[],quota:false,saveFail:false,invocations:0};window.mock=mock;
const sb={
 auth:{getUser:async()=>({data:{user:mock.user}}),onAuthStateChange:fn=>{mock.authChanged=fn}},
 from:table=>{
  const query={select:()=>query,eq:()=>query,order:()=>query,limit:async()=>({data:mock.records,error:null}),maybeSingle:async()=>({data:table==='mascot_preferences'?(mock.choice?{choice:mock.choice}:null):mock.records[0],error:null}),upsert:async row=>{if(mock.saveFail)return {error:{}};mock.choice=row.choice;return {error:null}}};return query;
 },
 storage:{from:()=>({download:async()=>{const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1536;const ctx=canvas.getContext('2d');for(let r=0;r<6;r++)for(let c=0;c<3;c++){ctx.fillStyle='#65a5c0';ctx.fillRect(Math.round(c*1024/3)+80,r*256+30,160,190);}return {data:await new Promise(resolve=>canvas.toBlob(resolve)),error:null};}})},
 functions:{invoke:async(name,{body})=>{mock.invocations++;if(mock.quota)return {error:{context:{json:async()=>({error:'Bạn đã dùng 3 lượt tạo trong 24 giờ.'})}}};const item={id:'mascot-test',name:body.get('name'),sheet_path:'account-a/test.png'};mock.records=[item];return {data:{id:item.id}};}}
};`;
const original=fs.readFileSync(path.join(root,'dashboard.html'),'utf8');
const fixture=original.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace('</body>',`<style>body{visibility:visible!important}.settings-view{display:flex!important;justify-content:center}.sidebar{display:none!important}</style><script>${mock}</script><script src="/lantern-companion/lantern.js" defer></script><script type="module" src="/lantern-companion/mascot-studio.mjs"></script></body>`);
(async()=>{
 const server=http.createServer((req,res)=>{const requested=new URL(req.url,'http://local').pathname;if(requested==='/'){res.setHeader('Content-Type','text/html');res.end(fixture);return;}const file=path.resolve(root,'.'+requested);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':'application/octet-stream');res.end(fs.readFileSync(file));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1100,height:900}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('Browser:',e.message)});
  page.setDefaultTimeout(10000);
  await page.route('https://**/*',route=>route.abort());
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.waitForFunction(()=>!document.querySelector('#ms-generate').disabled);
  await page.fill('#ms-name','Bé Mây');await page.click('#ms-generate');assert.match(await page.locator('#ms-status').textContent(),/Nhập mô tả/);
  await page.fill('#ms-description','A friendly otter');await page.click('#ms-generate');await page.waitForFunction(()=>!document.querySelector('#ms-preview').hidden);
  assert.equal(await page.locator('#ms-preview-name').textContent(),'Bé Mây');
  assert.equal(await page.evaluate(()=>window.mock.invocations),1);
  await page.click('#ms-expression');assert.match(await page.locator('#ms-character').getAttribute('style'),/background-position/);
  await page.click('#ms-use');await page.waitForFunction(()=>window.LanternCompanion.getMascot()==='mascot-test');assert.equal(await page.evaluate(()=>window.mock.choice),'mascot-test');
  await page.evaluate(()=>mock.saveFail=true);await page.click('[data-mascot-choice][value=fox]');await page.waitForFunction(()=>document.querySelector('#ms-status').textContent.includes('Chưa lưu'));assert.equal(await page.evaluate(()=>window.LanternCompanion.getMascot()),'mascot-test');
  await page.evaluate(()=>{mock.saveFail=false;mock.quota=true});await page.click('#ms-generate');await page.waitForFunction(()=>document.querySelector('#ms-status').textContent.includes('3 lượt'));
  await page.locator('#ms-title').scrollIntoViewIfNeeded();
  const artifact=process.env.MASCOT_SCREENSHOT;if(artifact)await page.screenshot({path:artifact,fullPage:true});
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.querySelector('#ms-form').getBoundingClientRect().right>innerWidth),false);
  await page.evaluate(()=>mock.authChanged('SIGNED_OUT',null));assert.equal(await page.locator('#ms-generate').isDisabled(),true);assert.equal(await page.evaluate(()=>window.LanternCompanion.getMascot()),'lantern');assert.equal(await page.locator('#ms-library').textContent(),'');
  assert.deepEqual(errors,[]);console.log('PASS: required input, generated preview, expression, saved choice, failed-save rollback, quota, mobile layout, sign-out cleanup, no browser errors');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
