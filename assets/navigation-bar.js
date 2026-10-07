(() => {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  document.body.classList.add('bottom-navigation');
  const dock = document.createElement('nav');
  dock.className = 'bottom-nav';
  dock.setAttribute('aria-label', 'Điều hướng chính');
  const backdrop = document.createElement('div');
  backdrop.className = 'navigation-backdrop';
  backdrop.hidden = true;
  const sheet = document.createElement('section');
  sheet.className = 'navigation-sheet';
  sheet.id = 'navigation-tools';
  sheet.hidden = true;
  sheet.setAttribute('aria-label', 'Công cụ');
  sheet.innerHTML = '<div class="navigation-sheet-header"><strong>Công cụ</strong><button type="button" aria-label="Đóng menu">×</button></div>';
  const home = document.getElementById('home-nav');
  const space = document.getElementById('my-space-nav');
  const reports = sidebar.querySelector('[data-tool="csat"]');
  [home, space, reports].filter(Boolean).forEach(link => dock.append(link));
  if (reports) reports.querySelector('.nav-text').removeAttribute('data-i18n');
  const tools = document.createElement('button');
  tools.type = 'button';
  tools.className = 'dock-button';
  tools.setAttribute('aria-expanded', 'false');
  tools.setAttribute('aria-controls', sheet.id);
  tools.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg><span data-i18n="tools">Công cụ</span>';
  const profile = document.createElement('button');
  profile.type = 'button';
  profile.className = 'dock-button';
  profile.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/></svg><span>Hồ sơ</span>';
  dock.append(tools, profile);
  Array.from(sidebar.children).forEach(node => {
    if (!node.matches('.sidebar-logo, .nav-label')) sheet.append(node);
  });
  document.body.append(backdrop, sheet, dock);
  sheet.querySelectorAll('.nav-group-head').forEach(head => {
    head.setAttribute('role', 'button');
    head.tabIndex = 0;
    head.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); head.click(); }
    });
    const update = () => head.setAttribute('aria-expanded', String(head.parentElement.classList.contains('open')));
    new MutationObserver(update).observe(head.parentElement, { attributes: true, attributeFilter: ['class'] });
    update();
  });
  function closeMenu(restoreFocus = false) {
    sheet.hidden = backdrop.hidden = true;
    tools.setAttribute('aria-expanded', 'false');
    if (restoreFocus) tools.focus();
  }
  tools.addEventListener('click', () => {
    if (!sheet.hidden) return closeMenu(true);
    sheet.hidden = backdrop.hidden = false;
    tools.setAttribute('aria-expanded', 'true');
    sheet.querySelector('button').focus();
  });
  backdrop.addEventListener('click', () => closeMenu(true));
  sheet.querySelector('button').addEventListener('click', () => closeMenu(true));
  sheet.addEventListener('click', e => {
    if (e.target.closest('.nav-item, .user-chip')) closeMenu();
  });
  profile.addEventListener('click', () => { closeMenu(); document.querySelector('.user-chip').click(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !sheet.hidden) closeMenu(true);
  });
  function sync() {
    const active = document.querySelector('.nav-item.active');
    tools.classList.toggle('active', !!active && sheet.contains(active));
    profile.classList.toggle('active', document.getElementById('settings-view').classList.contains('visible'));
    dock.querySelectorAll('.nav-item').forEach(link => {
      if (link === active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }
  const observer = new MutationObserver(sync);
  document.querySelectorAll('.nav-item, #settings-view').forEach(node => observer.observe(node, { attributes: true, attributeFilter: ['class'] }));
  function updateLabels() {
    const english = document.documentElement.lang === 'en';
    profile.querySelector('span').textContent = english ? 'Profile' : 'Hồ sơ';
    sheet.querySelector('strong').textContent = english ? 'Tools' : 'Công cụ';
    if (reports) reports.querySelector('.nav-text').textContent = english ? 'Reports' : 'Báo cáo';
  }
  new MutationObserver(updateLabels).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  updateLabels();
  sync();
})();
