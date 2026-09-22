/* Dashboard waiting game. Observes same-origin tools without changing auth or requests. */
(() => {
  'use strict';
  const frame = document.getElementById('tool-frame');
  const main = document.querySelector('main');
  if (!frame || !main) return;
  const panel = document.createElement('section');
  panel.id = 'snake-wait'; panel.hidden = true;
  panel.setAttribute('aria-label', 'Rắn ăn mistake trong lúc chờ');
  panel.innerHTML = `<div class="sw-card"><div class="sw-top"><span class="sw-pill" role="status" id="sw-status"></span><span>MINI BREAK · QA</span></div><h2>Ăn mistake, chờ một chút!</h2><p><strong id="sw-player"></strong> ơi, dọn sạch mistake trong lúc trang chuẩn bị nhé.</p><canvas width="600" height="400" tabindex="0" aria-label="Game rắn ăn mồi mistake. Dùng phím mũi tên hoặc WASD."></canvas><div class="sw-actions"><button class="sw-primary" id="sw-play">Chơi ngay</button><button id="sw-retry">Tải lại trang</button><button id="sw-dismiss">Xem trang</button><div class="sw-pad" aria-label="Điều khiển rắn"><button data-dir="up" aria-label="Lên">↑</button><button data-dir="left" aria-label="Trái">←</button><button data-dir="down" aria-label="Xuống">↓</button><button data-dir="right" aria-label="Phải">→</button></div></div><p class="sw-foot"><span id="sw-score" aria-live="polite">0 mistake</span> · Phím mũi tên / WASD · Space tạm dừng. Trang sẵn sàng sẽ tự mở.</p></div>`;
  main.appendChild(panel);
  const $ = id => document.getElementById(id);
  const canvas = panel.querySelector('canvas'), ctx = canvas.getContext('2d');
  let mode = '', expected = '', dismissed = false, homeBusy = false;
  let gameTimer = 0, snake, food, direction, queued, score, playing = false, dead = false;
  let startedAt = 0, previousFocus = null, stableSince = 0, loaded = false, hardTimer = 0;
  let mo = null, lastMut = 0, mutCount = 0, loadAt = 0;
  const vectors = {up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  function name() { const n = $('sidebar-name')?.textContent.trim(); return n && n !== '—' ? n : 'Bạn'; }
  function placeFood() {
    const free=[];
    for(let y=1;y<19;y++) for(let x=1;x<29;x++) if(!snake.some(p=>p.x===x&&p.y===y)) free.push({x,y});
    if(!free.length){playing=false;dead=true;return;}
    food=free[Math.floor(Math.random()*free.length)];
  }
  function reset(){snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10},{x:7,y:10}];direction='right';queued='right';score=0;dead=false;placeFood();$('sw-score').textContent='0 mistake';draw();}
  function label(text,x,y,color){ctx.font='bold 13px Arial';const w=Math.min(570,ctx.measureText(text).width+16);x=Math.max(w/2+4,Math.min(596-w/2,x));ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x-w/2,y-17,w,23,7);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(text,x,y,560);}
  function draw(){
    ctx.fillStyle='#f3f7f1';ctx.fillRect(0,0,600,400);
    ctx.fillStyle='#dce6d8';for(let x=10;x<600;x+=20)for(let y=10;y<400;y+=20){ctx.beginPath();ctx.arc(x,y,1,0,Math.PI*2);ctx.fill();}
    snake.forEach((p,i)=>{ctx.fillStyle=i===0?'#547b55':'#90ae7e';ctx.beginPath();ctx.roundRect(p.x*20+1,p.y*20+1,18,18,i===0?7:5);ctx.fill();});
    const h=snake[0],v=vectors[direction];ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(h.x*20+10+v[0]*4-v[1]*4,h.y*20+10+v[1]*4+v[0]*4,3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#e89174';ctx.beginPath();ctx.arc(food.x*20+10,food.y*20+10,8,0,Math.PI*2);ctx.fill();
    label('mistake',food.x*20+10,food.y*20-4,'#c8795d');label(name(),h.x*20+10,Math.max(22,h.y*20-6),'#547b55');
    if(dead){ctx.fillStyle='#f3f7f1e8';ctx.fillRect(95,155,410,75);ctx.fillStyle='#456444';ctx.font='bold 21px Arial';ctx.textAlign='center';ctx.fillText('Thử lại, ăn thêm mistake nhé!',300,198);}
  }
  function stop(){clearInterval(gameTimer);gameTimer=0;playing=false;}
  function tick(){if(!playing||document.hidden||panel.hidden)return;direction=queued;const v=vectors[direction],head={x:(snake[0].x+v[0]+30)%30,y:(snake[0].y+v[1]+20)%20};const eat=head.x===food.x&&head.y===food.y;
    if(snake.slice(0,eat?snake.length:-1).some(p=>p.x===head.x&&p.y===head.y)){dead=true;stop();$('sw-play').textContent='Chơi lại';draw();return;}
    snake.unshift(head);if(eat){score++;$('sw-score').textContent=score+' mistake';placeFood();}else snake.pop();draw();}
  function play(){if(dead)reset();if(playing){stop();$('sw-play').textContent='Tiếp tục';return;}playing=true;gameTimer=setInterval(tick,135);$('sw-play').textContent='Tạm dừng';}
  function steer(dir){if(vectors[dir][0]!==-vectors[direction][0]||vectors[dir][1]!==-vectors[direction][1])queued=dir;if(!playing&&!dead)play();}
  $('sw-play').onclick=()=>{play();canvas.focus();};
  panel.querySelectorAll('[data-dir]').forEach(b=>b.onclick=()=>steer(b.dataset.dir));
  panel.addEventListener('keydown',e=>{const dir={ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right'}[e.key];if(dir){e.preventDefault();steer(dir);}else if(e.code==='Space'&&e.target===canvas){e.preventDefault();play();}});
  let touch=null;canvas.addEventListener('pointerdown',e=>{touch=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointerup',e=>{if(!touch)return;const dx=e.clientX-touch[0],dy=e.clientY-touch[1];touch=null;if(Math.max(Math.abs(dx),Math.abs(dy))>12)steer(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));});
  function hide(){clearTimeout(hardTimer);if(panel.hidden)return;const focused=panel.contains(document.activeElement);panel.hidden=true;stop();if(focused)(previousFocus?.isConnected?previousFocus:$('tool-reload'))?.focus();}
  function show(status){if(dismissed)return;$('sw-status').textContent=status;$('sw-player').textContent=name();if(panel.hidden){previousFocus=document.activeElement;panel.hidden=false;$('sw-play').textContent='Chơi ngay';reset();}}
  function visible(el){return !!el && el.getClientRects().length>0 && getComputedStyle(el).visibility!=='hidden' && getComputedStyle(el).display!=='none';}
  function inspect(){
    if(!mode){hide();return;}
    if(!navigator.onLine){show('Mất kết nối · Chơi trong lúc chờ');return;}
    if(mode==='home'){if(homeBusy)show('Đang tải dữ liệu');else hide();return;}
    let doc;try{doc=frame.contentDocument;if(!doc){if(loaded)hide();return;}if(doc.URL==='about:blank'||doc.URL!==expected){if(loaded&&doc.URL!=='about:blank')hide();else show('Đang mở trang');return;}}catch{if(loaded)hide();return;}
    const text=doc.body?.innerText||'';
    // Permission, authentication and other actionable errors must remain visible.
    if(/Không thể mở trang|chưa có quyền truy cập|Lỗi xác thực|Chưa nạp khoá|Phiên đăng nhập/.test(text)){hide();return;}
    if(/^(offline|mất kết nối|không có kết nối)/im.test(text)){show('Mất kết nối · Chơi trong lúc chờ');return;}
    // Sẵn sàng = iframe đã load xong VÀ nội dung ngừng render (DOM đứng yên ~700ms).
    // Không dựa vào chuỗi trạng thái: các tool để lại nhãn "Đang tải dữ liệu…" sau khi xong -> gây kẹt.
    // Còn "bận" nếu tool đang hiện chỉ báo tải (aria-busy hoặc nhãn "đang tải/tải dữ liệu/loading")
    // -> đảm bảo chờ data.json về xong (không mở overlay trong lúc chờ mạng).
    const loadingEls=doc.querySelectorAll('[aria-busy="true"],[role="status"],#filterLabelText,#data-status,#dash-status,#ts,#dash-meta,#dash-empty,.loading,.loader,#loading,#loading-overlay');
    const toolBusy=Array.from(loadingEls).some(el=>visible(el)&&(el.getAttribute('aria-busy')==='true'||/đang tải|tải dữ liệu|đang load|loading/i.test((el.textContent||'').slice(0,200))));
    const hidden=!doc.body||getComputedStyle(doc.documentElement).visibility==='hidden'||getComputedStyle(doc.body).visibility==='hidden';
    const idle=Date.now()-lastMut>700;
    const rendered=mutCount>0||Date.now()-loadAt>3000;
    if(!loaded||hidden||!text.trim()||doc.readyState==='loading'||toolBusy||!idle||!rendered){
      show(Date.now()-startedAt>20000?'Trang tải hơi lâu · Bạn vẫn có thể chơi':'Đang tải dữ liệu');
    } else { hide(); }
  }
  // Game chờ CHỈ áp dụng cho CQM và Repeated Agent. Các tool khác + trang chủ: mở thẳng, không game.
  const GAME_TOOLS=/\/(cqm|repeatagent)\//i;
  window.TQALoading={start(url){let p;try{p=new URL(url,location.href).pathname;}catch(e){p=url||'';}if(!GAME_TOOLS.test(p)){mode='';hide();return;}mode='tool';loaded=false;expected=new URL(url,location.href).href;dismissed=false;startedAt=Date.now();stableSince=0;loadAt=0;lastMut=0;mutCount=0;show('Đang mở trang');clearTimeout(hardTimer);hardTimer=setTimeout(()=>{if(mode==='tool'){dismissed=true;hide();}},20000);},home(busy){mode='';hide();},stop(){mode='';hide();}};
  $('sw-dismiss').onclick=()=>{dismissed=true;hide();};
  $('sw-retry').onclick=()=>{dismissed=false;if(mode==='tool')$('tool-reload').click();else location.reload();};
  window.addEventListener('offline',inspect);
  window.addEventListener('online',()=>{dismissed=false;if(mode==='tool')$('tool-reload').click();else if(mode==='home')loadCsat();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();$('sw-play').textContent='Tiếp tục';}else inspect();});
  function attachObserver(){try{if(mo)mo.disconnect();const d=frame.contentDocument;if(!d)return;mo=new MutationObserver(()=>{lastMut=Date.now();mutCount++;});mo.observe(d.documentElement,{childList:true,subtree:true,characterData:true});}catch(e){}}
  frame.addEventListener('load',()=>{loaded=true;loadAt=Date.now();lastMut=Date.now();mutCount=0;attachObserver();inspect();});
  setInterval(()=>{if(!document.hidden)inspect();},400);
  reset();
})();
