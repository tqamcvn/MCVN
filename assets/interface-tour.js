(() => {
  const key = 'tqa_glass_tour_v1';
  const chip = document.querySelector('.user-chip');
  const palette = document.querySelector('.background-preferences');
  if (!chip || !palette) return;
  let step = 0, running = false, previousFocus;
  const shades = Array.from({length:4}, () => {
    const node = document.createElement('div'); node.className = 'tour-shade'; return node;
  });
  const ring = document.createElement('div'); ring.className = 'tour-spotlight';
  const tip = document.createElement('section');
  tip.className = 'tour-tooltip'; tip.setAttribute('role','dialog');
  tip.setAttribute('aria-labelledby','tour-title');
  tip.innerHTML = '<span class="tour-count"></span><h3 id="tour-title"></h3><p></p><div class="tour-actions"><button type="button" class="tour-skip">Bỏ qua</button><button type="button" class="tour-next"></button></div>';
  const nodes = [...shades,ring,tip];
  nodes.forEach(node => { node.hidden = true; document.body.append(node); });
  function finish() {
    running = false; nodes.forEach(node => { node.hidden = true; });
    try { localStorage.setItem(key,'done'); } catch (_) {}
    if (previousFocus?.isConnected) previousFocus.focus();
  }
  function position() {
    if (!running) return;
    const target = step === 0 ? chip : palette;
    const r = target.getBoundingClientRect();
    const left = Math.max(0,r.left-6), top = Math.max(0,r.top-6);
    const right = Math.min(innerWidth,r.right+6), bottom = Math.min(innerHeight,r.bottom+6);
    const boxes = [[0,0,innerWidth,top],[0,bottom,innerWidth,innerHeight-bottom],[0,top,left,bottom-top],[right,top,innerWidth-right,bottom-top]];
    shades.forEach((node,i) => { const b=boxes[i]; node.style.cssText=`left:${b[0]}px;top:${b[1]}px;width:${b[2]}px;height:${b[3]}px`; });
    ring.style.cssText=`left:${left}px;top:${top}px;width:${right-left}px;height:${bottom-top}px`;
    const width = Math.min(320,innerWidth-24);
    tip.style.width=width+'px';
    const x = right+16+width <= innerWidth ? right+16 : Math.max(12,Math.min(innerWidth-width-12,left));
    const height=tip.offsetHeight;
    const y = right+16+width <= innerWidth ? Math.max(12,Math.min(innerHeight-height-12,top)) : (top-height-16 >= 12 ? top-height-16 : Math.min(innerHeight-height-12,bottom+16));
    tip.style.left=x+'px'; tip.style.top=Math.max(12,y)+'px';
  }
  function render() {
    const en = document.documentElement.lang === 'en';
    tip.querySelector('.tour-count').textContent = en ? `Step ${step+1} of 2` : `Bước ${step+1}/2`;
    tip.querySelector('h3').textContent = step === 0 ? (en ? 'Make the new interface yours' : 'Tùy chỉnh giao diện mới') : (en ? 'Choose your background color' : 'Chọn màu nền bạn thích');
    tip.querySelector('p').textContent = step === 0 ? (en ? 'Open Settings from your account at the bottom of the sidebar.' : 'Bấm tài khoản ở cuối sidebar để mở Cài đặt và tùy chỉnh màu nền.') : (en ? 'Choose a color to apply it immediately. Default restores the gradient. Your choice is saved in this browser.' : 'Chọn màu để áp dụng ngay. Chọn Mặc định để trở về nền gradient. Lựa chọn được lưu trên trình duyệt này.');
    tip.querySelector('.tour-skip').textContent = en ? 'Skip' : 'Bỏ qua';
    tip.querySelector('.tour-next').textContent = step === 0 ? (en ? 'Open Settings' : 'Mở Cài đặt') : (en ? 'Got it' : 'Đã hiểu');
    nodes.forEach(node => { node.hidden = false; }); position();
  }
  function next() {
    if (step === 1) return finish();
    step = 1;
    chip.click();
    palette.scrollIntoView({block:'center',behavior:'instant'});
    render();
    requestAnimationFrame(() => { position(); tip.querySelector('.tour-next').focus(); });
  }
  function start() {
    previousFocus = document.activeElement; running = true;
    step = document.getElementById('settings-view').classList.contains('visible') ? 1 : 0;
    if (step === 1) palette.scrollIntoView({block:'center',behavior:'instant'});
    render(); tip.querySelector('.tour-next').focus();
  }
  tip.querySelector('.tour-next').addEventListener('click',next);
  tip.querySelector('.tour-skip').addEventListener('click',finish);
  chip.addEventListener('click', () => {
    if (running && step === 0) {
      step = 1; palette.scrollIntoView({block:'center',behavior:'instant'}); render();
      requestAnimationFrame(position);
    }
  });
  document.addEventListener('keydown',e => { if(running && e.key === 'Escape') { e.stopImmediatePropagation(); finish(); } },true);
  document.addEventListener('scroll',position,true);
  window.addEventListener('resize',position);
  let seen = false; try { seen = localStorage.getItem(key) === 'done'; } catch (_) {}
  if (!seen) {
    const ready = new MutationObserver(check);
    function check() {
      if (getComputedStyle(document.body).visibility !== 'visible') return;
      ready.disconnect(); start();
    }
    ready.observe(document.head,{childList:true});
    ready.observe(document.body,{attributes:true,attributeFilter:['style','class']});
    check();
  }
})();
