'use strict';
async function setupFeedbackMentions(db){
 let directory=null,loading=null;
 const getDirectory=()=>directory?Promise.resolve(directory):(loading||(loading=db.rpc('feedback_mention_users').then(result=>{if(result.error)throw result.error;directory=result.data||[];return directory;}).finally(()=>loading=null)));
 try{await getDirectory();}catch{}
 window.feedbackMentionText=text=>String(text).replace(/@([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g,(raw,email)=>'@'+((directory||[]).find(p=>p.email.toLowerCase()===email.toLowerCase())?.display_name||'Thành viên'));
 window.feedbackMentionContent=text=>{
  const fragment=document.createDocumentFragment();const source=String(text);let cursor=0;
  for(const match of source.matchAll(/@([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g)){
   fragment.append(document.createTextNode(source.slice(cursor,match.index)));
   const tag=document.createElement('span');tag.className='mention-highlight';tag.textContent=feedbackMentionText(match[0]);fragment.append(tag);cursor=match.index+match[0].length;
  }
  fragment.append(document.createTextNode(source.slice(cursor)));return fragment;
 };
 const fold=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
 [['body','body-mentions'],['reply-body','reply-mentions']].forEach(([fieldId,listId])=>{
 const field=document.getElementById(fieldId),list=document.getElementById(listId);if(!field||!list)return;
 let candidates=[],active=0,version=0,tags=[],previous=field.value;
 function sync(){const next=field.value;if(next===previous)return;let start=0;while(start<previous.length&&start<next.length&&previous[start]===next[start])start++;let oldEnd=previous.length,newEnd=next.length;while(oldEnd>start&&newEnd>start&&previous[oldEnd-1]===next[newEnd-1]){oldEnd--;newEnd--;}const delta=newEnd-oldEnd;tags=tags.filter(t=>{if(t.end<=start)return true;if(t.start>=oldEnd){t.start+=delta;t.end+=delta;return true;}return false;});previous=next;}
 field.mentionValue={
  serialize(){sync();let value=field.value;[...tags].sort((a,b)=>b.start-a.start).forEach(t=>{value=value.slice(0,t.start)+'@'+t.email+value.slice(t.end);});return value;},
  restore(wire){tags=[];let value='',cursor=0;for(const match of wire.matchAll(/@([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g)){value+=wire.slice(cursor,match.index);const person=(directory||[]).find(p=>p.email.toLowerCase()===match[1].toLowerCase());const label=person?'@'+person.display_name:match[0];if(person)tags.push({start:value.length,end:value.length+label.length,email:person.email});value+=label;cursor=match.index+match[0].length;}value+=wire.slice(cursor);field.value=value;previous=value;}
 };
 field.addEventListener('input',sync);

 function token(){const before=field.value.slice(0,field.selectionStart);return /(?:^|\s)@([^\s@]*)$/.exec(before);}
 function hide(){version++;list.hidden=true;field.setAttribute('aria-expanded','false');field.removeAttribute('aria-activedescendant');}
 field.setAttribute('aria-controls',listId);field.setAttribute('aria-autocomplete','list');field.setAttribute('aria-expanded','false');list.setAttribute('role','listbox');list.setAttribute('aria-label','Người dùng dashboard');
 function select(person){const match=token();if(!match)return;const end=field.selectionStart,start=end-match[1].length-1;const label='@'+person.display_name;field.setRangeText(label+' ',start,end,'end');sync();tags.push({start,end:start+label.length,email:person.email});hide();field.dispatchEvent(new Event('input',{bubbles:true}));field.focus();}
 function highlight(){Array.from(list.children).forEach((button,i)=>button.setAttribute('aria-selected',String(i===active)));field.setAttribute('aria-activedescendant',listId+'-'+active);}
 async function update(){const match=token();if(!match){hide();return;}const current=++version;list.hidden=false;list.textContent='Đang tải người dùng…';field.setAttribute('aria-expanded','true');
 try{const users=await getDirectory();if(current!==version)return;const query=fold(match[1]);candidates=users.filter(p=>fold(p.display_name+' '+p.email).includes(query)).slice(0,8);active=0;list.replaceChildren();
 if(!candidates.length){list.textContent='Không tìm thấy người dùng phù hợp.';return;}
 candidates.forEach((person,i)=>{const button=document.createElement('button');button.type='button';button.id=listId+'-'+i;button.setAttribute('role','option');button.textContent=person.display_name;const avatar=document.createElement('span');avatar.className='mention-avatar';avatar.textContent=person.display_name.trim().split(/\s+/).slice(-2).map(x=>x[0]).join('').toUpperCase();button.prepend(avatar);button.onmousedown=e=>e.preventDefault();button.onclick=()=>select(person);list.append(button);});highlight();
 }catch{if(current===version){candidates=[];list.textContent='Không tải được danh sách. Gõ lại @ để thử lại.';}}
 }
 field.addEventListener('input',update);field.addEventListener('click',update);
 field.addEventListener('keydown',e=>{if(list.hidden)return;if(e.key==='Escape'){e.preventDefault();e.stopPropagation();hide();return;}if(!candidates.length)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();active=(active+(e.key==='ArrowDown'?1:-1)+candidates.length)%candidates.length;highlight();}else if(e.key==='Enter'){e.preventDefault();select(candidates[active]);}});
 field.addEventListener('blur',()=>setTimeout(()=>{if(!list.contains(document.activeElement))hide();},150));
 field.closest('dialog')?.addEventListener('close',hide);
 });
}
