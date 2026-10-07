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
  const tourScript = document.createElement('script');
  tourScript.src = '/assets/interface-tour.js?v=20261007-2';
  document.body.append(tourScript);
})();
