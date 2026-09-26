(() => {
  'use strict';
  const root = document.getElementById('my-space-view');
  let user, lang = 'vi', state, key, writable = true;
  const copy = {
    vi: {hello:'Góc làm việc của',intro:'Một nơi cho những điều bạn muốn hoàn thành hôm nay.',local:'Lưu riêng theo tài khoản trên trình duyệt này. Chưa đồng bộ sang thiết bị khác.',tasks:'Việc cần làm',taskHint:'Tập trung vào từng việc nhỏ.',taskInput:'Bạn muốn làm gì?',add:'Thêm',emptyTasks:'Chưa có việc cần làm. Thêm việc đầu tiên để bắt đầu.',notes:'Ghi chú nhanh',notesHint:'Ý tưởng, nhắc nhở hoặc điều cần nhớ.',noteInput:'Viết ghi chú của bạn…',links:'Liên kết thường dùng',linksHint:'Giữ những trang bạn cần ngay trong tầm tay.',name:'Tên liên kết',url:'https://…',emptyLinks:'Thêm liên kết để mở nhanh tài liệu và công cụ.',remove:'Xóa',saved:'Đã lưu trên trình duyệt này',error:'Không lưu được. Hãy sao chép nội dung để tránh mất dữ liệu.',readError:'Không đọc được dữ liệu đã lưu. Tải lại trang hoặc kiểm tra bộ nhớ trình duyệt; dữ liệu cũ chưa bị ghi đè.',invalid:'Chỉ chấp nhận liên kết http:// hoặc https:// hợp lệ.',done:'hoàn thành',save:'Lưu ghi chú'},
    en: {hello:'A little space for',intro:'A place for everything you want to get done today.',local:'Saved per account in this browser. Not synced across devices yet.',tasks:'To-do list',taskHint:'Focus on one small step at a time.',taskInput:'What would you like to do?',add:'Add',emptyTasks:'Nothing on your list yet. Add your first task to get started.',notes:'Quick notes',notesHint:'Ideas, reminders, or something to remember.',noteInput:'Write your notes…',links:'Favorite links',linksHint:'Keep the pages you need close at hand.',name:'Link name',url:'https://…',emptyLinks:'Add a link to quickly open your documents and tools.',remove:'Delete',saved:'Saved in this browser',error:'Unable to save. Copy your content to avoid losing it.',readError:'Unable to read saved data. Reload or check browser storage; existing data has not been overwritten.',invalid:'Enter a valid http:// or https:// link.',done:'completed',save:'Save notes'}
  };
  const t = id => copy[lang][id];
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function status(message, error = false) {
    const node = root.querySelector('.ms-status');
    node.textContent = message;
    node.classList.toggle('ms-error', error);
  }
  function save() {
    if (!writable) { status(t('readError'), true); return; }
    try { localStorage.setItem(key, JSON.stringify(state)); status(t('saved')); }
    catch (_) { status(t('error'), true); }
  }
  function button(text, action, primary = false) {
    const b = el('button', primary ? 'ms-primary' : '', text);
    b.type = 'button'; if (action) b.addEventListener('click', action); return b;
  }
  function input(placeholder, limit, type = 'text') {
    const n = el('input'); n.type = type; n.required = true; n.maxLength = limit;
    n.placeholder = placeholder; n.setAttribute('aria-label', placeholder); return n;
  }
  function card(title, subtitle) {
    const n = el('section', 'ms-card'); n.append(el('h2', '', title), el('p','ms-muted',subtitle)); return n;
  }
  function validURL(value) {
    try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u : null; }
    catch (_) { return null; }
  }
  function render() {
    root.replaceChildren();
    const header = el('header', 'ms-header'), heading = el('div');
    heading.append(el('div','ms-eyebrow','MY SPACE'), el('h1','',t('hello') + ' ' + (user.name || user.email)), el('p','ms-muted',t('intro')));
    header.append(heading,el('div','ms-date',new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-GB',{day:'numeric',month:'long',year:'numeric'}).format(new Date())));
    const grid = el('div','ms-grid');
    const tasks = card(t('tasks'),t('taskHint'));
    const progressLabel = el('p','ms-muted'), progress = el('div','ms-progress'), bar = el('span'); progress.append(bar);
    const taskForm = el('form','ms-form'), taskInput = input(t('taskInput'),300), addTask = button(t('add'),null,true); addTask.type = 'submit';
    taskForm.append(taskInput,addTask);
    const taskList = el('ul','ms-list');
    function drawTasks() {
      taskList.replaceChildren();
      const done = state.tasks.filter(task => task.done).length;
      progressLabel.textContent = `${done}/${state.tasks.length} ${t('done')}`;
      bar.style.width = (state.tasks.length ? done / state.tasks.length * 100 : 0) + '%';
      if (!state.tasks.length) taskList.append(el('li','ms-empty',t('emptyTasks')));
      state.tasks.forEach((task,index) => {
        const row = el('li','ms-task'), check = el('input'), label = el('label','',task.text);
        check.type = 'checkbox'; check.checked = task.done; check.id = 'ms-task-' + index; label.htmlFor = check.id;
        check.addEventListener('change',() => { task.done = check.checked; save(); drawTasks(); taskList.querySelectorAll('input')[index]?.focus(); });
        const remove = button('×',() => { state.tasks.splice(index,1); save(); drawTasks(); taskInput.focus(); });
        remove.setAttribute('aria-label',t('remove') + ': ' + task.text);
        row.append(check,label,remove); taskList.append(row);
      });
    }
    taskForm.addEventListener('submit',event => { event.preventDefault(); const text = taskInput.value.trim(); if (!text) return; state.tasks.push({text,done:false}); save(); taskInput.value = ''; drawTasks(); taskInput.focus(); });
    tasks.append(progressLabel,progress,taskForm,taskList); drawTasks();
    const notes = card(t('notes'),t('notesHint')), textarea = el('textarea');
    textarea.value = state.notes; textarea.placeholder = t('noteInput'); textarea.maxLength = 20000; textarea.setAttribute('aria-label',t('notes'));
    textarea.addEventListener('input',() => { state.notes = textarea.value; save(); });
    notes.append(textarea,button(t('save'),save));
    const links = card(t('links'),t('linksHint')); links.classList.add('ms-card-wide');
    const linkForm = el('form','ms-form'), linkName = input(t('name'),100), linkURL = input(t('url'),2048,'url'), addLink = button(t('add'),null,true); addLink.type = 'submit';
    linkForm.append(linkName,linkURL,addLink); const linkList = el('ul','ms-list ms-links');
    function drawLinks() {
      linkList.replaceChildren();
      if (!state.links.length) linkList.append(el('li','ms-empty',t('emptyLinks')));
      state.links.forEach((link,index) => {
        const url = validURL(link.url); if (!url) return;
        const row = el('li','ms-link'), anchor = el('a','',link.name);
        anchor.href = url.href; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; anchor.append(el('small','',url.hostname));
        const remove = button('×',() => { state.links.splice(index,1); save(); drawLinks(); linkName.focus(); }); remove.setAttribute('aria-label',t('remove') + ': ' + link.name);
        row.append(anchor,remove); linkList.append(row);
      });
    }
    linkForm.addEventListener('submit',event => { event.preventDefault(); const name = linkName.value.trim(), url = validURL(linkURL.value.trim()); if (!url) { status(t('invalid'),true); linkURL.focus(); return; } if (!name) return; state.links.push({name,url:url.href}); save(); linkForm.reset(); drawLinks(); linkName.focus(); });
    links.append(linkForm,linkList); drawLinks(); grid.append(tasks,notes,links);
    const message = el('p','ms-status'); message.setAttribute('role','status'); message.setAttribute('aria-live','polite');
    root.append(header,grid,el('p','ms-muted',t('local')),message);
    if (!writable) status(t('readError'),true);
  }
  window.TQAMySpace = {
    show(currentUser, currentLanguage) {
      if (!currentUser?.id) return;
      lang = currentLanguage === 'en' ? 'en' : 'vi';
      if (user?.id !== currentUser.id) {
        key = 'tqa_my_space_v1:' + currentUser.id;
        state = {tasks:[],notes:'',links:[]}; writable = true;
        try {
          const raw = localStorage.getItem(key);
          if (raw !== null) {
            const value = JSON.parse(raw);
            if (!value || !Array.isArray(value.tasks) || !Array.isArray(value.links) || typeof value.notes !== 'string' || !value.tasks.every(v => v && typeof v.text === 'string' && typeof v.done === 'boolean') || !value.links.every(v => v && typeof v.name === 'string' && typeof v.url === 'string')) throw new Error('Invalid data');
            state = value;
          }
        } catch (_) { writable = false; }
      }
      user = currentUser; render();
    },
    language(value) { lang = value === 'en' ? 'en' : 'vi'; if (user) render(); }
  };
})();
