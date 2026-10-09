(() => {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  // Left sidebar layout: retain the original nodes, routes and collapse control.
  document.body.classList.add('glass-navigation');
  // backdrop-filter on .main creates a containing/stacking context for fixed
  // descendants. Keep the modal at body level, above the floating My Space frame.
  const settingsModal = document.getElementById('settings-view');
  if (settingsModal) document.body.append(settingsModal);
  sidebar.setAttribute('aria-label', 'Điều hướng chính');
  sidebar.querySelectorAll('.nav-group-head').forEach(head => {
    head.setAttribute('role', 'button');
    head.tabIndex = 0;
    head.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); head.click(); }
    });
  });
  if (location.pathname === '/navigation-preview') {
    document.getElementById('sb-toggle').addEventListener('click', () => {
      document.body.classList.toggle('sb-collapsed');
    });
  }
  const sync = () => sidebar.querySelectorAll('.nav-item').forEach(link => {
    if (link.classList.contains('active')) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const observer = new MutationObserver(sync);
  sidebar.querySelectorAll('.nav-item').forEach(link => observer.observe(link, { attributes: true, attributeFilter: ['class'] }));
  sync();
  const palettes = [
    ['default', 'Mặc định', 'Default', null, 'linear-gradient(135deg,#77ddd6,#b899ee,#f4abc8)'],
    ['blue', 'Xanh dương', 'Blue', 215, '#98bdee'],
    ['green', 'Xanh lá', 'Green', 155, '#a4dbc2'],
    ['purple', 'Tím', 'Purple', 270, '#c4adec'],
    ['pink', 'Hồng', 'Pink', 335, '#ebb2cc'],
    ['orange', 'Cam', 'Orange', 28, '#efc49e'],
    ['gray', 'Xám', 'Gray', 220, '#b9c1cf']
  ];
  const fieldset = document.createElement('fieldset');
  fieldset.className = 'background-preferences';
  const legend = document.createElement('legend');
  fieldset.append(legend);
  const hint = document.createElement('p');
  fieldset.append(hint);
  const choices = document.createElement('div');
  choices.className = 'background-choices';
  fieldset.append(choices);
  let selected = 'default';
  const storageKey = 'tqa_background_palette';
  try { selected = localStorage.getItem(storageKey) || 'default'; } catch (_) {}
  function apply(value) {
    const palette = palettes.find(p => p[0] === value) || palettes[0];
    selected = palette[0];
    if (selected === 'default') {
      delete document.body.dataset.backgroundPalette;
      document.body.style.removeProperty('--background-hue');
    } else {
      document.body.dataset.backgroundPalette = selected;
      document.body.style.setProperty('--background-hue', palette[3]);
    }
    choices.querySelectorAll('input').forEach(input => { input.checked = input.value === selected; });
  }
  palettes.forEach(palette => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio'; input.name = 'background-palette'; input.value = palette[0];
    const tile = document.createElement('span'); tile.className = 'background-tile';
    const swatch = document.createElement('span'); swatch.className = 'background-swatch';
    swatch.style.background = palette[4]; swatch.setAttribute('aria-hidden', 'true');
    const title = document.createElement('span'); title.dataset.paletteLabel = palette[0];
    tile.append(swatch, title); label.append(input, tile); choices.append(label);
    input.addEventListener('change', () => {
      apply(input.value);
      try { localStorage.setItem(storageKey, selected); } catch (_) {}
    });
  });
  document.getElementById('theme-light').closest('.prefs-card').append(fieldset);
  function updatePaletteLabels() {
    const en = document.documentElement.lang === 'en';
    legend.textContent = en ? 'Background color' : 'Màu nền';
    hint.textContent = en ? 'Applies immediately and is saved in this browser. Choose Default to restore the gradient.' : 'Đổi ngay khi chọn và tự lưu trên trình duyệt này. Chọn Mặc định để khôi phục nền gradient.';
    palettes.forEach(p => { choices.querySelector('[data-palette-label="' + p[0] + '"]').textContent = en ? p[2] : p[1]; });
  }
  new MutationObserver(updatePaletteLabels).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  updatePaletteLabels();
  apply(selected);
  window.addEventListener('storage', e => { if (e.key === storageKey) apply(e.newValue || 'default'); });
  const dialog = settingsModal.querySelector('.stg-dialog');
  dialog.classList.add('mac-settings');
  const cards = Array.from(dialog.querySelectorAll(':scope > .stg-card'));
  const rail = document.createElement('aside'); rail.className = 'mac-settings-rail';
  const closeButton = document.getElementById('stg-close');
  closeButton.classList.add('mac-clear-close');
  const closeLabel = document.createElement('span'); closeLabel.textContent = 'Đóng';
  closeButton.append(closeLabel);
  const identity = document.createElement('div'); identity.className = 'mac-settings-account';
  identity.innerHTML = '<span class="mac-account-icon" aria-hidden="true"></span><div class="mac-account-copy"><strong></strong><small>Cài đặt tài khoản</small></div>';
  const sourceName = document.getElementById('sidebar-name');
  const sourceAvatar = document.getElementById('sidebar-av');
  function syncAccountIdentity() {
    identity.querySelector('strong').textContent = sourceName.textContent;
    const avatar = identity.querySelector('.mac-account-icon');
    avatar.replaceChildren(...Array.from(sourceAvatar.childNodes, node => node.cloneNode(true)));
    avatar.style.backgroundColor = sourceAvatar.style.backgroundColor;
    avatar.style.color = sourceAvatar.style.color;
    identity.querySelector('small').textContent = document.documentElement.lang === 'en' ? 'Account settings' : 'Cài đặt tài khoản';
  }
  const accountObserver = new MutationObserver(syncAccountIdentity);
  accountObserver.observe(sourceName,{childList:true,characterData:true,subtree:true});
  accountObserver.observe(sourceAvatar,{childList:true,characterData:true,subtree:true,attributes:true});
  accountObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  syncAccountIdentity();
  rail.append(identity);
  const nav = document.createElement('nav'); nav.setAttribute('aria-label','Danh mục cài đặt'); rail.append(nav);
  const main = document.createElement('div'); main.className = 'mac-settings-main';
  main.append(dialog.querySelector('.stg-dialog-head'));
  const groups = [
    ['Giao diện','Appearance','◐',cards[0],'#1675ed'],
    ['Bạn đồng hành','Companion','✦',cards[1],'#8d5de0'],
    ['Hồ sơ','Profile','◎',cards[2],'#28a579'],
    ['Mật khẩu','Password','⌘',cards[3],'#737d8b']
  ];
  const categoryIcons = [
    '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none"/>',
    '<path d="m12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7Z"/>',
    '<circle cx="12" cy="8" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
    '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/>'
  ];
  const title = main.querySelector('#stg-dialog-title'); title.removeAttribute('data-i18n');
  function select(index) {
    groups.forEach((group,i) => {
      if(group[3]) group[3].hidden = i !== index;
      nav.children[i].classList.toggle('selected',i === index);
      nav.children[i].setAttribute('aria-pressed',String(i === index));
    });
    title.textContent = groups[index][document.documentElement.lang === 'en' ? 1 : 0];
    main.scrollTop=0;
  }
  groups.forEach((group,index) => {
    const button = document.createElement('button'); button.type='button';
    button.innerHTML='<span class="mac-category-icon" aria-hidden="true" style="background:'+group[4]+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+categoryIcons[index]+'</svg></span><span>'+group[0]+'</span>';
    button.addEventListener('click',()=>select(index)); nav.append(button);
    if(group[3]) { group[3].classList.add('mac-settings-panel'); main.append(group[3]); }
  });
  dialog.append(rail,main);
  document.querySelector('.user-chip').addEventListener('click',()=>select(0));
  new MutationObserver(() => {
    const en=document.documentElement.lang === 'en';
    groups.forEach((group,i)=>{ nav.children[i].lastElementChild.textContent=group[en?1:0]; });
    const index=Array.from(nav.children).findIndex(button=>button.classList.contains('selected'));
    title.textContent=groups[Math.max(0,index)][en?1:0];
  }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  select(0);
  const visibilityKey = 'tqa_companion_hidden';
  let companionHidden = false;
  try { companionHidden = localStorage.getItem(visibilityKey) === 'true'; } catch (_) {}
  const visibilityRow = document.createElement('label'); visibilityRow.className = 'companion-visibility-row';
  visibilityRow.innerHTML = '<span><strong>Hiển thị bạn đồng hành</strong><small>Tắt để ẩn nhân vật và lời nhắc nổi trên màn hình.</small></span><input type="checkbox" role="switch" aria-label="Hiển thị bạn đồng hành"><span class="companion-switch" aria-hidden="true"></span>';
  cards[1].querySelector('.stg-desc').after(visibilityRow);
  const visibilityInput = visibilityRow.querySelector('input');
  function applyCompanionVisibility(hidden) {
    document.body.classList.toggle('companion-hidden',hidden);
    visibilityInput.checked = !hidden;
  }
  applyCompanionVisibility(companionHidden);
  const nameForm = document.createElement('form'); nameForm.className='companion-name-form';
  nameForm.innerHTML='<label for="companion-custom-name">Tên bạn đồng hành</label><p>Đặt tên riêng, tối đa 40 ký tự. Tên được giữ khi đổi nhân vật.</p><div><input id="companion-custom-name" class="stg-input" type="text" maxlength="40" placeholder="Nhập tên bạn thích" autocomplete="off"><button type="submit" class="stg-btn">Lưu tên</button><button type="button" class="companion-name-reset">Mặc định</button></div><small role="status" aria-live="polite"></small>';
  visibilityRow.after(nameForm);
  const nameInput=nameForm.querySelector('input');
  const companionNameKey='tqa-companion-name';
  try { nameInput.value=localStorage.getItem(companionNameKey)||''; } catch (_) {}
  function updateMascotLabels(name) {
    cards[1].classList.toggle('companion-has-custom-name',Boolean(name.trim()));
    cards[1].querySelectorAll('[data-mascot-choice]').forEach(input => {
      const label = input.closest('label').querySelector('[data-i18n]');
      if (label) input.setAttribute('aria-label',label.textContent);
    });
  }
  updateMascotLabels(nameInput.value);
  function saveCompanionName(value) {
    const name=value.trim().slice(0,40);
    nameInput.value=name;
    updateMascotLabels(name);
    try { if(name)localStorage.setItem(companionNameKey,name);else localStorage.removeItem(companionNameKey); } catch (_) {}
    window.LanternCompanion?.setName?.(name);
    nameForm.querySelector('small').textContent=name ? 'Đã lưu tên: '+name : 'Đã khôi phục tên mặc định của nhân vật.';
  }
  nameForm.addEventListener('submit',e=>{e.preventDefault();saveCompanionName(nameInput.value);});
  nameForm.querySelector('.companion-name-reset').addEventListener('click',()=>saveCompanionName(''));
  visibilityInput.addEventListener('change',() => {
    const hidden = !visibilityInput.checked;
    applyCompanionVisibility(hidden);
    try { localStorage.setItem(visibilityKey,String(hidden)); } catch (_) {}
  });
  window.addEventListener('storage',e => { if(e.key === visibilityKey) applyCompanionVisibility(e.newValue === 'true'); });
  const tourScript = document.createElement('script');
  tourScript.src = '/assets/interface-tour.js?v=20261007-2';
  document.body.append(tourScript);
})();
