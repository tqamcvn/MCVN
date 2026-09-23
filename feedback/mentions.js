'use strict';
function setupFeedbackMentions(db){
 let directory=null,loading=null;
 const getDirectory=()=>directory?Promise.resolve(directory):(loading||(loading=db.rpc('feedback_mention_users').then(result=>{if(result.error)throw result.error;directory=result.data||[];return directory;}).finally(()=>loading=null)));
 const fold=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
 [['body','body-mentions'],['reply-body','reply-mentions']].forEach(([fieldId,listId])=>{
 const field=document.getElementById(fieldId),list=document.getElementById(listId);if(!field||!list)return;
 let candidates=[],active=0,version=0;
 function token(){const before=field.value.slice(0,field.selectionStart);return /(?:^|\s)@([^\s@]*)$/.exec(before);}
 function hide(){version++;list.hidden=true;field.setAttribute('aria-expanded','false');field.removeAttribute('aria-activedescendant');}
 field.setAttribute('aria-controls',listId);field.setAttribute('aria-autocomplete','list');field.setAttribute('aria-expanded','false');list.setAttribute('role','listbox');list.setAttribute('aria-label','Người dùng dashboard');
 function select(person){const match=token();if(!match)return;const end=field.selectionStart,start=end-match[1].length-1;field.setRangeText('@'+person.email+' ',start,end,'end');hide();field.dispatchEvent(new Event('input',{bubbles:true}));field.focus();}
 function highlight(){Array.from(list.children).forEach((button,i)=>button.setAttribute('aria-selected',String(i===active)));field.setAttribute('aria-activedescendant',listId+'-'+active);}
 async function update(){const match=token();if(!match){hide();return;}const current=++version;list.hidden=false;list.textContent='Đang tải người dùng…';field.setAttribute('aria-expanded','true');
 try{const users=await getDirectory();if(current!==version)return;const query=fold(match[1]);candidates=users.filter(p=>fold(p.display_name+' '+p.email).includes(query)).slice(0,8);active=0;list.replaceChildren();
 if(!candidates.length){list.textContent='Không tìm thấy người dùng phù hợp.';return;}
 candidates.forEach((person,i)=>{const button=document.createElement('button');button.type='button';button.id=listId+'-'+i;button.setAttribute('role','option');button.textContent=person.display_name;const email=document.createElement('small');email.textContent=person.email;button.append(email);button.onmousedown=e=>e.preventDefault();button.onclick=()=>select(person);list.append(button);});highlight();
 }catch{if(current===version){candidates=[];list.textContent='Không tải được danh sách. Gõ lại @ để thử lại.';}}
 }
 field.addEventListener('input',update);field.addEventListener('click',update);
 field.addEventListener('keydown',e=>{if(list.hidden)return;if(e.key==='Escape'){e.preventDefault();e.stopPropagation();hide();return;}if(!candidates.length)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();active=(active+(e.key==='ArrowDown'?1:-1)+candidates.length)%candidates.length;highlight();}else if(e.key==='Enter'){e.preventDefault();select(candidates[active]);}});
 field.addEventListener('blur',()=>setTimeout(()=>{if(!list.contains(document.activeElement))hide();},150));
 field.closest('dialog')?.addEventListener('close',hide);
 });
}
