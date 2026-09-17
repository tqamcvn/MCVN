(() => {
  'use strict';
  if (window.LanternCompanion) return;
  // Embedded tools share the dashboard companion and its completion messages.
  try {
    if(window.parent!==window && window.parent.LanternCompanion){
      window.LanternCompanion=window.parent.LanternCompanion;
      window.addEventListener('lantern:complete',e=>window.LanternCompanion.celebrate(typeof e.detail?.message==='string'?e.detail.message:undefined));
      return;
    }
  } catch {} // A standalone or cross-origin tool keeps its own companion.
  const base = new URL('.', document.currentScript.src);
  const host = document.createElement('aside');
  host.id = 'lantern-companion';
  document.body.append(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
    :host{position:fixed;bottom:16px;right:16px;z-index:9999;font:14px/1.5 system-ui,sans-serif;color:#473524}
    *{box-sizing:border-box}button,input{font:inherit}button{cursor:pointer;border:1px solid #e7d5b6;background:#fffaf0;color:#473524;border-radius:12px;padding:7px 11px}button:hover{background-color:#ffedc6}button:focus-visible,input:focus-visible{outline:3px solid #b76d18;outline-offset:3px}
    .bubble{width:min(310px,calc(100vw - 32px));background:#fffdf6;border:1px solid #eddab8;border-radius:20px;padding:17px;box-shadow:0 8px 32px #49300920;margin-bottom:-14px}header{display:flex;align-items:center;justify-content:space-between}strong{font-size:16px}p{margin:10px 0}.actions{display:flex;gap:7px;flex-wrap:wrap}.primary{background:#ffe1a0}small{display:block;color:#806e59;margin-top:9px}details{margin-top:13px;border-top:1px solid #eddfc8;padding-top:10px}summary{cursor:pointer}label{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:9px 0}input[type=number]{width:66px;padding:4px;border:1px solid #dcc7a4;border-radius:7px}input[type=time]{max-width:112px} .pet{display:block;width:140px;height:140px;margin-left:auto;border:0;background-color:transparent;background-size:300% 300%;background-position:50% 50%;padding:0;filter:drop-shadow(0 6px 7px #8e5a1820);animation:breathe 4s ease-in-out infinite}.pet:hover{background-color:transparent}.pet.sleep{animation:none}[hidden]{display:none!important}@keyframes breathe{50%{transform:translateY(-4px)}}@media(prefers-reduced-motion:reduce){.pet{animation:none}}
  </style><section class="bubble" hidden><header><strong>Đèn nhỏ ở đây 🏮</strong><button data-action="close" aria-label="Thu gọn">×</button></header><p role="status" aria-live="polite"></p><div class="actions"></div><details><summary>Lịch đồng hành</summary><label><span>Bật nhắc nhở</span><input name="enabled" type="checkbox"></label><label>Buổi sáng <input name="morningStart" type="time"><input name="morningEnd" aria-label="Kết thúc buổi sáng" type="time"></label><label>Buổi chiều <input name="afternoonStart" type="time"><input name="afternoonEnd" aria-label="Kết thúc buổi chiều" type="time"></label><label>Uống nước (phút)<input name="water" type="number" min="1" max="240"></label><label>Thư giãn mắt (phút)<input name="eyes" type="number" min="1" max="240"></label><label>Nghỉ ngơi (phút)<input name="rest" type="number" min="1" max="240"></label><small>Lịch theo giờ trên máy. Nhắc khi trang đang mở và bạn quay lại trang.</small></details></section><button class="pet" aria-label="Mở bạn đồng hành đèn lồng" aria-expanded="false"></button>`;
  const defaults = { enabled:true, morningStart:'08:00', morningEnd:'12:00', afternoonStart:'13:00', afternoonEnd:'17:30', water:45, eyes:20, rest:60 };
  let config = {...defaults};
  try { const saved=JSON.parse(localStorage.getItem('lantern-settings')||'null'); if(saved) for(const key in defaults) { const v=saved[key]; if(typeof defaults[key]==='number' && Number.isFinite(v) && v>=1 && v<=240 || typeof defaults[key]==='boolean' && typeof v==='boolean' || typeof defaults[key]==='string' && typeof v==='string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v)) config[key]=v; } } catch {}
  const pet=root.querySelector('.pet'), bubble=root.querySelector('.bubble'), message=root.querySelector('p'), actions=root.querySelector('.actions');
  // Keep the pet's anchor stable when its message opens or grows.
  const moveStyle=document.createElement('style');
  moveStyle.textContent=':host{width:140px;height:140px}.pet{touch-action:none;user-select:none;cursor:grab}.pet.dragging{cursor:grabbing;animation:none}.bubble{position:fixed;margin:0;overflow-y:auto;overscroll-behavior:contain}';
  root.append(moveStyle);
  pet.title='Kéo để di chuyển · Bấm để trò chuyện · Phím mũi tên để di chuyển';
  pet.setAttribute('aria-label','Đèn nhỏ: bấm để trò chuyện, kéo hoặc dùng phím mũi tên để di chuyển');
  let position=null, drag=null, suppressClick=false;
  function bounds(){return {width:document.documentElement.clientWidth,height:document.documentElement.clientHeight};}
  function clampPosition(x,y,width,height){return {x:Math.max(0,Math.min(x,Math.max(0,width-140))),y:Math.max(0,Math.min(y,Math.max(0,height-140)))};}
  function placeBubble(){
    if(bubble.hidden)return;
    const {width,height}=bounds(),r=host.getBoundingClientRect();
    bubble.style.maxHeight=`${Math.max(0,height-16)}px`;
    const w=bubble.offsetWidth,h=bubble.offsetHeight;
    bubble.style.left=`${Math.max(8,Math.min(r.right-w,width-w-8))}px`;
    const above=r.top-h-8,below=r.bottom+8;
    const y=above>=8?above:below+h<=height-8?below:Math.max(8,Math.min(r.top,height-h-8));
    bubble.style.top=`${y}px`;
  }
  function moveTo(x,y){
    const {width,height}=bounds();position=clampPosition(x,y,width,height);
    host.style.left=`${position.x}px`;host.style.top=`${position.y}px`;
    host.style.right='auto';host.style.bottom='auto';placeBubble();
  }
  function savePosition(){try{localStorage.setItem('lantern-position',JSON.stringify(position));}catch{}}
  try{const saved=JSON.parse(localStorage.getItem('lantern-position')||'null');if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y))moveTo(saved.x,saved.y);}catch{}
  pet.addEventListener('pointerdown',e=>{
    if(!e.isPrimary||e.button!==0)return;
    suppressClick=false;
    const r=host.getBoundingClientRect();
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left,top:r.top,moved:false};
    pet.setPointerCapture(e.pointerId);
  });
  pet.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(!drag.moved&&Math.hypot(dx,dy)<6)return;
    drag.moved=true;pet.classList.add('dragging');
    moveTo(drag.left+dx,drag.top+dy);
  });
  function finishDrag(e){
    if(!drag||drag.id!==e.pointerId)return;
    suppressClick=drag.moved;if(drag.moved)savePosition();drag=null;
    pet.classList.remove('dragging');
    if(pet.hasPointerCapture(e.pointerId))pet.releasePointerCapture(e.pointerId);
  }
  pet.addEventListener('pointerup',finishDrag);
  pet.addEventListener('pointercancel',finishDrag);
  pet.addEventListener('lostpointercapture',finishDrag);
  pet.addEventListener('click',e=>{if(suppressClick&&e.detail!==0){suppressClick=false;e.stopImmediatePropagation();e.preventDefault();}},true);
  pet.addEventListener('keydown',e=>{
    const offsets={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if(!offsets[e.key])return;e.preventDefault();
    const r=host.getBoundingClientRect(),step=e.shiftKey?30:10,[dx,dy]=offsets[e.key];
    moveTo(r.left+dx*step,r.top+dy*step);savePosition();
  });
  window.addEventListener('resize',()=>{if(position)moveTo(position.x,position.y);else placeBubble();});
  new ResizeObserver(placeBubble).observe(bubble);
  new MutationObserver(placeBubble).observe(bubble,{attributes:true,attributeFilter:['hidden']});
  const direction=new URL('mascots/lantern-directions.webp',base).href, reaction=new URL('mascots/lantern-reactions.webp',base).href;
  const kinds=['water','eyes','rest'];
  let due={}, pausedUntil=0, active=null, expressionUntil=0, eyeUntil=0, lastSession='';
  const reset=()=>kinds.forEach(k=>due[k]=Date.now()+config[k]*60000);
  reset();
  function sprite(index,react=false){pet.style.backgroundImage=`url("${react?reaction:direction}")`;pet.style.backgroundPosition=`${index%3*50}% ${Math.floor(index/3)*50}%`;}
  function expression(index,seconds=8){expressionUntil=Date.now()+seconds*1000;sprite(index,true);pet.classList.toggle('sleep',index===6);}
  function show(text,buttons){bubble.hidden=false;pet.setAttribute('aria-expanded','true');message.textContent=text;actions.replaceChildren();for(const [label,fn] of buttons){const b=document.createElement('button');b.textContent=label;b.addEventListener('click',fn);actions.append(b);}}
  function close(){if(active){due[active]=Date.now()+300000;active=null;eyeUntil=0;}bubble.hidden=true;pet.setAttribute('aria-expanded','false');pet.focus();}
  function home(){show('Mình ở đây cùng bạn. Cứ làm từng chút một nhé.',[]);}
  function celebrate(text='Bạn làm được rồi! Một việc đã xong — mình vui cùng bạn! ✨'){if(active)due[active]=Date.now()+config[active]*60000;active=null;eyeUntil=0;expression(4,12);show(text,[['Cảm ơn Đèn nhỏ',close]]);}
  function done(kind){due[kind]=Date.now()+config[kind]*60000;active=null;eyeUntil=0;expression(1);show('Cảm ơn bạn đã chăm sóc bản thân. Mình cùng tiếp tục nhé!',[['Tiếp tục',close]]);}
  function remind(kind){active=kind;expression(kind==='rest'?6:kind==='eyes'?5:1,30);const texts={water:'Uống vài ngụm nước cùng mình nhé? 💧',eyes:'Cho mắt nghỉ một chút nhé. Bạn có thể nhắm mắt nhẹ nhàng trong 20 giây.',rest:'Mình nghỉ một chút nhé? Đứng dậy, thả lỏng vai và đi lại cho thoải mái.'};show(texts[kind],[[kind==='eyes'?'Bắt đầu 20 giây':'Mình đã làm rồi',()=>{if(kind!=='eyes')return done(kind);eyeUntil=Date.now()+20000;expression(6,20);show('Bạn cứ nhắm mắt thư giãn. Mình ở đây đếm 20 giây nhé.',[['Kết thúc sớm',()=>done(kind)]]);}],['Nhắc lại sau 5 phút',()=>{due[kind]=Date.now()+300000;active=null;close();}]]);}
  function session(){const d=new Date(),n=d.getHours()*60+d.getMinutes(),m=s=>Number(s.slice(0,2))*60+Number(s.slice(3));const slot=n>=m(config.morningStart)&&n<m(config.morningEnd)?'sáng':n>=m(config.afternoonStart)&&n<m(config.afternoonEnd)?'chiều':'';return slot?`${d.toDateString()}/${slot}`:'';}
  root.querySelector('[data-action=close]').onclick=close;
  pet.onclick=()=>{if(bubble.hidden){bubble.hidden=false;pet.setAttribute('aria-expanded','true');if(!active && Date.now()>=pausedUntil)home();}else close();};
  root.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  root.querySelectorAll('input').forEach(input=>{if(input.type==='checkbox')input.checked=config[input.name];else input.value=config[input.name];input.onchange=()=>{if(!input.checkValidity()||!input.value){input.value=config[input.name];return;}config[input.name]=input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.value;try{localStorage.setItem('lantern-settings',JSON.stringify(config));}catch{}reset();active=null;eyeUntil=0;};});
  document.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||Date.now()<expressionUntil)return;const r=pet.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;const col=dx< -45?0:dx>45?2:1,row=dy< -45?0:dy>45?2:1;sprite(row*3+col);},{passive:true});
  setInterval(()=>{const now=Date.now();if(document.hidden)return;if(eyeUntil&&now>=eyeUntil){done('eyes');return;}if(expressionUntil && now>=expressionUntil){expressionUntil=0;pet.classList.remove('sleep');sprite(4);}const s=session();if(s!==lastSession){lastSession=s;reset();}if(!s||!config.enabled||now<pausedUntil||active||!bubble.hidden)return;const next=kinds.filter(k=>now>=due[k]).sort((a,b)=>due[a]-due[b])[0];if(next)remind(next);},1000);
  window.addEventListener('lantern:complete',e=>celebrate(typeof e.detail?.message==='string'?e.detail.message:undefined));
  window.LanternCompanion={celebrate,show:home};
  sprite(4);
})();
