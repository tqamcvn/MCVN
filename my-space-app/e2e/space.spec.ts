import {test,expect,type Download} from '@playwright/test';
import {readFile} from 'node:fs/promises';
async function downloaded(file:Download){return readFile((await file.path())!);}
test('write: autosave, search, safe import, backup, focus and reload',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page).toHaveURL(/\/write\//);
 await page.getByRole('button',{name:'New document',exact:true}).click();
 await page.getByRole('textbox',{name:'Document title',exact:true}).fill('Ideas brainstorm');
 await page.getByRole('textbox',{name:'Document body'}).fill('A calm place for a new idea.');
 await expect(page.getByText('Saved in this browser',{exact:true})).toBeVisible();
 await page.reload();await expect(page.getByRole('textbox',{name:'Document body'})).toHaveText('A calm place for a new idea.');
 await page.getByRole('textbox',{name:'Search documents'}).fill('calm');await expect(page.locator('.library-item')).toHaveCount(1);
 await page.getByRole('button',{name:'Toggle focus mode'}).click();await expect(page.locator('.library')).toBeHidden();
 await page.getByRole('button',{name:'Toggle focus mode'}).click();
 const promise=page.waitForEvent('download');await page.getByRole('button',{name:'Backup',exact:true}).click();const data=JSON.parse((await downloaded(await promise)).toString());expect(data.format).toBe('my-space-backup');expect(data.documents[0].text).toContain('calm');
 await page.locator('input[type=file]').setInputFiles({name:'damaged.json',mimeType:'application/json',buffer:Buffer.from('{"format":"my-space-backup","version":99}')});await expect(page.getByRole('status')).toContainText('Import rejected');
 await page.locator('input[type=file]').setInputFiles({name:'safe.md',mimeType:'text/plain',buffer:Buffer.from('<script>alert(1)</script>\n# Literal heading')});await expect(page.getByRole('textbox',{name:'Document body'})).toContainText('<script>');expect(errors).toEqual([]);
 await page.screenshot({path:'test-results/write.png'});
});
test('Create: draw, native snapshot persistence, export and validated reimport',async({page})=>{
 const remote:string[]=[];page.on('request',r=>{if(!/^(data:|(blob:)?http:\/\/127\.0\.0\.1:3000)/.test(r.url()))remote.push(r.url());});
 await page.goto('/create/');await page.getByRole('button',{name:'New board',exact:true}).click();await page.locator('.tlui-toolbar').first().waitFor();
 await page.getByRole('textbox',{name:'Board title'}).fill('Ideas Board');
 const canvas=page.locator('.tl-canvas');await canvas.click({position:{x:350,y:240}});await page.keyboard.press('d');await page.mouse.move(680,320);await page.mouse.down();await page.mouse.move(850,450,{steps:15});await page.mouse.move(1030,330,{steps:15});await page.mouse.up();
 await expect.poll(()=>page.locator('.tl-shape').count()).toBeGreaterThan(0);
 const promise=page.waitForEvent('download');await page.getByRole('button',{name:'Export JSON'}).click();const raw=await downloaded(await promise);const exported=JSON.parse(raw.toString());expect(exported.format).toBe('my-space-board');expect(Object.values(exported.board.snapshot.document.store).some((r:unknown)=>(r as {typeName:string}).typeName==='shape')).toBe(true);
 // Route change flushes the debounce immediately.
 await page.getByRole('link',{name:'Write',exact:true}).click();await page.getByRole('link',{name:'Create',exact:true}).click();await expect(page.locator('.tl-shape')).not.toHaveCount(0);
 await page.reload();await expect(page.locator('.tl-shape')).not.toHaveCount(0);
 await page.locator('input[type=file]').setInputFiles({name:'board.json',mimeType:'application/json',buffer:raw});await expect(page.locator('.library-item')).toHaveCount(2);await expect(page.locator('.tl-shape')).not.toHaveCount(0);
 expect(remote).toEqual([]);await page.screenshot({path:'test-results/create.png'});
});
test('Frame: local image, sizing, PNG export and mobile layout',async({page})=>{
 await page.goto('/frame/');const image=await page.screenshot();await page.locator('input[type=file]').setInputFiles({name:'screenshot.png',mimeType:'image/png',buffer:image});await expect(page.locator('canvas')).toBeVisible();
 await page.getByRole('button',{name:'16:9',exact:true}).click();await page.getByRole('textbox',{name:'Watermark'}).fill('MCVN');
 const promise=page.waitForEvent('download');await page.getByRole('button',{name:'Download PNG'}).click();const png=await downloaded(await promise);expect(png.readUInt32BE(16)).toBe(1600);expect(png.readUInt32BE(20)).toBe(900);
 await page.screenshot({path:'test-results/frame.png'});
 await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/frame-mobile.png',fullPage:true});
});
test('Work: local focus timer and discipline with no third-party requests',async({page})=>{
 await page.clock.install();const remote:string[]=[];page.on('request',r=>{if(!/^(data:|(blob:)?http:\/\/127\.0\.0\.1:3000)/.test(r.url()))remote.push(r.url());});
 await page.goto('/work/');await expect(page.getByRole('timer')).toHaveText('45:00');await expect(page.getByRole('region',{name:'Tasks'})).toHaveCount(0);
 await page.getByRole('button',{name:'25 min'}).click();await expect(page.getByRole('timer')).toHaveText('25:00');
 await page.getByRole('button',{name:'Start timer'}).click();await page.clock.fastForward('10:00');await expect(page.getByRole('timer')).toHaveText('15:00');
 await page.getByRole('tab',{name:'Short break'}).click();await expect(page.getByRole('alertdialog')).toContainText('Abandon');await page.getByRole('button',{name:'Keep going'}).click();
 await page.clock.fastForward('15:01');await expect(page.locator('.focus-notice')).toContainText('Focus session complete');
 await expect(page.getByRole('region',{name:'Discipline'}).getByText('1/4')).toBeVisible();await expect(page.getByRole('region',{name:'Discipline'})).toContainText('25minutes today');
 await page.reload();await expect(page.getByRole('region',{name:'Discipline'}).getByText('1/4')).toBeVisible();
 expect(remote).toEqual([]);await page.screenshot({path:'test-results/work.png'});
 await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/work-mobile.png',fullPage:true});
});
test('Work: background presets, suggested fit, custom size and upload persist locally',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/work/');
 await page.getByRole('button',{name:'Background',exact:true}).click();const panel=page.getByRole('dialog',{name:'Background'});
 await panel.getByRole('button',{name:'Ocean'}).click();await expect(panel.locator('.bg-suggest')).toContainText('Suggested');
 const bg=page.locator('.focus-bg');await expect(bg).toHaveAttribute('style',/bg-ocean\.jpg/);
 await panel.getByRole('button',{name:'Custom size'}).click();await panel.getByRole('slider',{name:'Picture size'}).fill('150');await panel.getByRole('button',{name:'Bottom right'}).click();
 await expect(bg).toHaveAttribute('style',/background-size: 150% auto/);await expect(bg).toHaveAttribute('style',/background-position: 100% 100%/);
 await page.reload();await expect(page.locator('.focus-bg')).toHaveAttribute('style',/150% auto/);
 await page.getByRole('button',{name:'Background',exact:true}).click();
 const tiny=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEklEQVR4nGNgYGD4z8DAwMDAAAAN/wH/1ZzZ1QAAAABJRU5ErkJggg==','base64');
 await panel.locator('input[type=file]').setInputFiles({name:'pattern.png',mimeType:'image/png',buffer:tiny});
 await expect(panel.getByRole('button',{name:'Your image',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.focus-bg')).toHaveAttribute('style',/data:image/);await expect(panel.getByRole('button',{name:/^Tile/})).toHaveAttribute('aria-pressed','true');
 await page.screenshot({path:'test-results/work-background.png'});
 await page.reload();await expect(page.locator('.focus-bg')).toHaveAttribute('style',/data:image/);
 await page.getByRole('button',{name:'Background',exact:true}).click();await panel.getByRole('button',{name:'None'}).click();await expect(page.locator('.focus-bg')).toHaveCount(0);
});
test('Work: abandoning a session is recorded and music loads only after play',async({page})=>{
 let youtube=0;await page.route('https://www.youtube-nocookie.com/**',route=>{youtube++;return route.fulfill({contentType:'text/html',body:'<p>music</p>'});});
 await page.goto('/work/');await page.getByRole('button',{name:'Start timer'}).click();await page.getByRole('button',{name:'Reset timer'}).click();await page.getByRole('button',{name:'Abandon session'}).click();
 await expect(page.getByRole('region',{name:'Discipline'})).toContainText('0 completed · 1 abandoned');await expect(page.getByRole('timer')).toHaveText('45:00');
 expect(youtube).toBe(0);await page.getByRole('button',{name:'Play music'}).click();await expect(page.frameLocator('iframe[title="Focus music"]').getByText('music')).toBeVisible();expect(youtube).toBe(1);
 await page.getByRole('textbox',{name:'YouTube link'}).fill('https://evil.example/x');await page.getByRole('button',{name:'Play',exact:true}).click();await expect(page.getByRole('region',{name:'Music'}).getByRole('alert')).toContainText('YouTube');
});
test('Challenge and last mode persist without content requests',async({page})=>{
 await page.goto('/challenge/');await page.getByRole('button',{name:'Mark complete'}).click();await page.reload();await expect(page.getByRole('button',{name:'Completed today'})).toHaveAttribute('aria-pressed','true');await page.goto('/');await expect(page).toHaveURL(/\/challenge\//);await page.screenshot({path:'test-results/challenge.png'});
});
test('Storage failure keeps editable state across routes and immediate backup',async({page})=>{
 await page.addInitScript(()=>{IDBFactory.prototype.open=()=>{throw new DOMException('Storage blocked','SecurityError');};});
 await page.goto('/write/');await expect(page.locator('.storage-alert')).toContainText('unavailable');await page.getByRole('button',{name:'New document',exact:true}).click();await page.getByRole('textbox',{name:'Document title',exact:true}).fill('Do not lose this');await page.getByRole('textbox',{name:'Document body'}).fill('Still here without storage.');
 await page.getByRole('link',{name:'Challenge',exact:true}).click();await page.getByRole('link',{name:'Write',exact:true}).click();await expect(page.getByRole('textbox',{name:'Document body'})).toHaveText('Still here without storage.');
 const promise=page.waitForEvent('download');await page.getByRole('button',{name:'Export now'}).click();const data=JSON.parse((await downloaded(await promise)).toString());expect(data.documents[0].title).toBe('Do not lose this');expect(data.documents[0].text).toContain('Still here');
});
