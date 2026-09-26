'use client';
// Focus workspace adapted from qamcvnfocus. Timer, tasks and history stay in this browser; there is no login or cloud sync.
import {useCallback,useEffect,useMemo,useState} from 'react';
import {Play,Pause,RotateCcw,SkipForward,Settings2,AlertTriangle,Plus,Check,Trash2,ListChecks,Flame,Target,Lightbulb,Bell,Music,X,Timer,AlertCircle} from 'lucide-react';
import {dayKey} from '@/lib/challenges';
import {pref} from '@/lib/preferences';
import {type Task,type TimerMode,type Tag,type Recurrence,type Discipline,type Durations,modes,modeLabels,maxMinutes,defaultDurations,defaultDiscipline,tagLabels,recurrenceLabels,loadTasks,loadDiscipline,loadDurations,save,completeSession,abandonSession,recommendedMinutes,currentStreak,todayStats,todayTasks,doneToday,overdue,toggleTask,youtubeId} from '@/lib/focus';

const presets=[25,45,60,90];
const clock=(ms:number)=>{const s=Math.ceil(ms/1000);return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;};
function chime(){try{const ctx=new AudioContext();[0,.25].forEach((at,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=i?880:660;g.gain.setValueAtTime(.001,ctx.currentTime+at);g.gain.exponentialRampToValueAtTime(.25,ctx.currentTime+at+.02);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+at+.5);o.connect(g).connect(ctx.destination);o.start(ctx.currentTime+at);o.stop(ctx.currentTime+at+.55);});setTimeout(()=>void ctx.close(),1500);}catch{}}

export default function WorkMode(){
 const [ready,setReady]=useState(false),[tasks,setTasks]=useState<Task[]>([]),[discipline,setDiscipline]=useState<Discipline>(defaultDiscipline),[durations,setDurations]=useState<Durations>(defaultDurations);
 const [activeTaskId,setActiveTaskId]=useState<string|null>(null),[notice,setNotice]=useState(''),[storageError,setStorageError]=useState(false);
 useEffect(()=>{setTasks(loadTasks());setDiscipline(loadDiscipline());setDurations(loadDurations());setActiveTaskId(pref.get('focus-active-task','')||null);setReady(true);},[]);
 useEffect(()=>{if(ready&&!save('focus-tasks',tasks))setStorageError(true);},[tasks,ready]);
 useEffect(()=>{if(ready&&!save('focus-discipline',discipline))setStorageError(true);},[discipline,ready]);
 useEffect(()=>{if(ready)save('focus-durations',durations);},[durations,ready]);
 useEffect(()=>{if(ready)pref.set('focus-active-task',activeTaskId??'');},[activeTaskId,ready]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),8000);return()=>clearTimeout(t);},[notice]);
 const onComplete=useCallback((minutes:number,mode:TimerMode)=>{if(mode==='focus')setDiscipline(d=>completeSession(d,minutes));setNotice(mode==='focus'?'Focus session complete. Well done!':`${modeLabels[mode]} is over. Ready when you are.`);},[]);
 const onAbandon=useCallback(()=>setDiscipline(d=>abandonSession(d)),[]);
 if(!ready)return <div className="empty">Getting your focus space ready…</div>;
 const activeTask=tasks.find(t=>t.id===activeTaskId&&!doneToday(t));
 return <div className="work-mode">
  <header className="toolbar"><div className="mode-title"><span className="mode-icon"><Timer size={20}/></span><h1>Focus</h1></div><span className="subtle toolbar-actions">One thing at a time · stays on this device</span></header>
  {storageError&&<p className="inline-message" role="alert">This browser is not saving focus data. Your progress is kept only until you close the page.</p>}
  {notice&&<p className="focus-notice" role="status"><Bell size={16}/>{notice}<button aria-label="Dismiss" onClick={()=>setNotice('')}><X size={14}/></button></p>}
  <div className="focus-layout">
   <FocusTimer durations={durations} setDurations={setDurations} activeTask={activeTask} recommended={recommendedMinutes(discipline)} onComplete={onComplete} onAbandon={onAbandon}/>
   <aside className="focus-side">
    <TaskPanel tasks={tasks} setTasks={setTasks} activeTaskId={activeTaskId} setActiveTaskId={setActiveTaskId}/>
    <DisciplinePanel discipline={discipline} setGoal={g=>setDiscipline(d=>({...d,dailyGoal:g}))}/>
    <HealthReminders onRemind={setNotice}/>
    <MusicPanel/>
   </aside>
  </div>
 </div>;
}

function FocusTimer({durations,setDurations,activeTask,recommended,onComplete,onAbandon}:{durations:Durations;setDurations:(d:Durations)=>void;activeTask?:Task;recommended:number;onComplete:(minutes:number,mode:TimerMode)=>void;onAbandon:()=>void}){
 const [mode,setMode]=useState<TimerMode>('focus'),[remaining,setRemaining]=useState(durations.focus*60000),[endAt,setEndAt]=useState<number|null>(null),[started,setStarted]=useState(false),[custom,setCustom]=useState(false),[pending,setPending]=useState<(()=>void)|null>(null);
 const total=durations[mode]*60000,running=endAt!==null;
 const reset=useCallback((m:TimerMode,minutes:number)=>{setMode(m);setEndAt(null);setStarted(false);setRemaining(minutes*60000);},[]);
 // Timestamps instead of per-second decrements keep the timer accurate when the tab is in the background.
 useEffect(()=>{if(endAt===null)return;let finished=false;const id=setInterval(()=>{if(finished)return;const left=Math.max(0,endAt-Date.now());setRemaining(left);if(!left){finished=true;setEndAt(null);setStarted(false);chime();onComplete(durations[mode],mode);}},250);return()=>clearInterval(id);},[endAt,mode,durations,onComplete]);
 useEffect(()=>{if(!running)return;const title=document.title;document.title=`${clock(remaining)} · ${modeLabels[mode]}`;return()=>{document.title=title;};},[running,remaining,mode]);
 function guard(action:()=>void){if(started&&mode==='focus'&&remaining>0)setPending(()=>action);else action();}
 function setMinutes(m:TimerMode,minutes:number){const next={...durations,[m]:minutes};setDurations(next);if(m===mode&&!started)setRemaining(minutes*60000);}
 const radius=140,circumference=2*Math.PI*radius,progress=total?1-remaining/total:0;
 return <section className="focus-main" aria-label="Focus timer">
  <div className="focus-tabs" role="tablist">{modes.map(m=><button key={m} role="tab" aria-selected={mode===m} className={mode===m?'active':''} onClick={()=>guard(()=>reset(m,durations[m]))}>{modeLabels[m]}</button>)}</div>
  {activeTask&&mode==='focus'&&<p className="focus-task"><Play size={12}/>{activeTask.text}<span className={'tag '+activeTask.tag}>{tagLabels[activeTask.tag]}</span></p>}
  {mode==='focus'&&<div className="chips focus-presets">{presets.map(p=><button key={p} disabled={started} className={durations.focus===p?'active':''} onClick={()=>setMinutes('focus',p)}>{p} min</button>)}{recommended!==durations.focus&&<button disabled={started} title="Suggested from your last 7 days" onClick={()=>setMinutes('focus',recommended)}><Lightbulb size={13}/>{recommended} min</button>}</div>}
  <div className="focus-ring">
   <svg viewBox="0 0 320 320" aria-hidden="true"><circle cx="160" cy="160" r={radius} className="track"/><circle cx="160" cy="160" r={radius} className="progress" strokeDasharray={circumference} strokeDashoffset={circumference*(1-progress)}/></svg>
   <div><span className="focus-time" role="timer" aria-live="off">{clock(remaining)}</span><span className="subtle">{modeLabels[mode]}</span></div>
  </div>
  <div className="focus-controls">
   <button aria-label="Reset timer" title="Reset" onClick={()=>guard(()=>reset(mode,durations[mode]))}><RotateCcw size={22}/></button>
   <button className="primary focus-play" aria-label={running?'Pause timer':'Start timer'} onClick={()=>{if(running){setEndAt(null);}else{setStarted(true);setEndAt(Date.now()+remaining);}}}>{running?<Pause size={28}/>:<Play size={28}/>}</button>
   <button aria-label="Next mode" title="Next mode" onClick={()=>guard(()=>{const next=modes[(modes.indexOf(mode)+1)%modes.length];reset(next,durations[next]);})}><SkipForward size={22}/></button>
  </div>
  <button className="text-button" aria-expanded={custom} onClick={()=>setCustom(!custom)}><Settings2 size={14}/>Custom time</button>
  {custom&&<div className="focus-custom">{modes.map(m=><label className="range-control" key={m}><span>{modeLabels[m]}<output>{durations[m]} min</output></span><input type="range" aria-label={modeLabels[m]+' minutes'} min={1} max={maxMinutes[m]} value={durations[m]} disabled={started&&m===mode} onChange={e=>setMinutes(m,Number(e.target.value))}/></label>)}</div>}
  {pending&&<div className="modal-backdrop"><section className="modal" role="alertdialog" aria-modal="true" aria-labelledby="abandon-title"><span className="eyebrow"><AlertTriangle size={15}/>STILL FOCUSING</span><h2 id="abandon-title">Abandon this session?</h2><p>A session stopped halfway won’t count toward today’s goal.</p><button className="primary" autoFocus onClick={()=>setPending(null)}>Keep going</button><button onClick={()=>{onAbandon();const action=pending;setPending(null);action();}}>Abandon session</button></section></div>}
 </section>;
}

function Panel({title,icon,badge,actions,children}:{title:string;icon:React.ReactNode;badge?:number;actions?:React.ReactNode;children:React.ReactNode}){
 const key='focus-panel-'+title.toLowerCase(),[open,setOpen]=useState(()=>pref.get(key,'open')==='open');
 return <section className="focus-panel" aria-label={title}><header><h2>{icon}{title}{!!badge&&<span className="badge">{badge}</span>}</h2>{actions}<button aria-label={(open?'Collapse ':'Expand ')+title} aria-expanded={open} onClick={()=>{setOpen(!open);pref.set(key,open?'closed':'open');}}>{open?'−':'+'}</button></header>{open&&children}</section>;
}

function TaskPanel({tasks,setTasks,activeTaskId,setActiveTaskId}:{tasks:Task[];setTasks:React.Dispatch<React.SetStateAction<Task[]>>;activeTaskId:string|null;setActiveTaskId:(id:string|null)=>void}){
 const [adding,setAdding]=useState(false),[expanded,setExpanded]=useState<string|null>(null);
 const now=new Date(),list=useMemo(()=>todayTasks(tasks),[tasks]);
 const update=(id:string,change:(t:Task)=>Task)=>setTasks(all=>all.map(t=>t.id===id?change(t):t));
 return <Panel title="Tasks" icon={<ListChecks size={16}/>} badge={list.filter(t=>!doneToday(t,now)).length} actions={<button aria-label="Add task" onClick={()=>setAdding(true)}><Plus size={16}/></button>}>
  {adding&&<TaskForm onAdd={t=>{setTasks(all=>[...all,t]);setAdding(false);}} onCancel={()=>setAdding(false)}/>}
  {!list.length&&!adding&&<p className="subtle focus-empty">No tasks for today. Add one to focus on.</p>}
  <ul className="focus-tasks">{list.map(t=>{const done=doneToday(t,now),late=overdue(t,now),active=activeTaskId===t.id;return <li key={t.id} className={(active?'active ':'')+(late?'overdue':'')}>
   <div className="task-row">
    <button className={'check'+(done?' done':'')} aria-label={(done?'Mark not done: ':'Mark done: ')+t.text} onClick={()=>update(t.id,x=>toggleTask(x))}>{done&&<Check size={12}/>}</button>
    <div className="task-text"><span className={done?'done':''}>{t.text}</span><small>{t.recurrence!=='none'&&recurrenceLabels[t.recurrence]}{t.deadline&&<span className={late?'late':''}>{late&&<AlertCircle size={10}/>}Due {t.deadline.slice(8)}/{t.deadline.slice(5,7)}{t.deadlineTime?' '+t.deadlineTime:''}</span>}</small></div>
    <span className={'tag '+t.tag}>{tagLabels[t.tag]}</span>
    {!done&&<button aria-label={(active?'Stop focusing on ':'Focus on ')+t.text} aria-pressed={active} className={active?'on':''} onClick={()=>setActiveTaskId(active?null:t.id)}><Play size={12}/></button>}
    <button aria-label={'Checklist for '+t.text} aria-expanded={expanded===t.id} onClick={()=>setExpanded(expanded===t.id?null:t.id)}><ListChecks size={12}/></button>
    <button aria-label={'Delete '+t.text} onClick={()=>{setTasks(all=>all.filter(x=>x.id!==t.id));if(active)setActiveTaskId(null);}}><Trash2 size={12}/></button>
   </div>
   {expanded===t.id&&<Checklist task={t} update={change=>update(t.id,change)}/>}
  </li>;})}</ul>
 </Panel>;
}

function Checklist({task,update}:{task:Task;update:(change:(t:Task)=>Task)=>void}){
 const [draft,setDraft]=useState('');
 return <div className="checklist">{task.checklist.map(c=><div key={c.id}><label><input type="checkbox" checked={c.done} onChange={()=>update(t=>({...t,checklist:t.checklist.map(x=>x.id===c.id?{...x,done:!x.done}:x)}))}/><span className={c.done?'done':''}>{c.text}</span></label><button aria-label={'Delete '+c.text} onClick={()=>update(t=>({...t,checklist:t.checklist.filter(x=>x.id!==c.id)}))}><Trash2 size={10}/></button></div>)}
  <form onSubmit={e=>{e.preventDefault();const text=draft.trim();if(text){update(t=>({...t,checklist:[...t.checklist,{id:crypto.randomUUID(),text,done:false}]}));setDraft('');}}}><input aria-label="Add checklist item" maxLength={500} placeholder="Add sub-item…" value={draft} onChange={e=>setDraft(e.target.value)}/><button aria-label="Add sub-item"><Plus size={12}/></button></form>
 </div>;
}

const dayNames=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function TaskForm({onAdd,onCancel}:{onAdd:(t:Task)=>void;onCancel:()=>void}){
 const [text,setText]=useState(''),[tag,setTag]=useState<Tag>('work'),[recurrence,setRecurrence]=useState<Recurrence>('none'),[days,setDays]=useState<number[]>([]),[deadline,setDeadline]=useState(''),[time,setTime]=useState(''),[advanced,setAdvanced]=useState(false);
 const toggleDay=(d:number)=>setDays(v=>v.includes(d)?v.filter(x=>x!==d):[...v,d].sort((a,b)=>a-b));
 return <form className="task-form" onSubmit={e=>{e.preventDefault();if(!text.trim())return;onAdd({id:crypto.randomUUID(),text:text.trim(),done:false,tag,checklist:[],recurrence,recurrenceDays:recurrence==='weekly'||recurrence==='monthly'?days:undefined,deadline:recurrence==='none'&&deadline?deadline:null,deadlineTime:recurrence==='none'&&deadline&&time?time:null,createdAt:dayKey(),completedDates:[]});}}>
  <div className="task-form-row"><input aria-label="Task" autoFocus maxLength={500} placeholder="Add a task…" value={text} onChange={e=>setText(e.target.value)}/><button className="primary">Add</button></div>
  <div className="chips">{(Object.keys(tagLabels) as Tag[]).map(t=><button type="button" key={t} aria-pressed={tag===t} className={tag===t?'active':''} onClick={()=>setTag(t)}>{tagLabels[t]}</button>)}</div>
  <button type="button" className="text-button" aria-expanded={advanced} onClick={()=>setAdvanced(!advanced)}><RotateCcw size={11}/>Repeat & deadline</button>
  {advanced&&<>
   <div className="chips">{(Object.keys(recurrenceLabels) as Recurrence[]).map(r=><button type="button" key={r} aria-pressed={recurrence===r} className={recurrence===r?'active':''} onClick={()=>{setRecurrence(r);setDays([]);}}>{recurrenceLabels[r]}</button>)}</div>
   {recurrence==='weekly'&&<div className="day-picker">{dayNames.map((n,i)=><button type="button" key={n} aria-pressed={days.includes(i)} className={days.includes(i)?'active':''} onClick={()=>toggleDay(i)}>{n}</button>)}</div>}
   {recurrence==='monthly'&&<div className="day-picker month">{Array.from({length:31},(_,i)=>i+1).map(d=><button type="button" key={d} aria-pressed={days.includes(d)} className={days.includes(d)?'active':''} onClick={()=>toggleDay(d)}>{d}</button>)}</div>}
   {recurrence==='none'&&<div className="task-form-row"><input type="date" aria-label="Deadline date" value={deadline} onChange={e=>setDeadline(e.target.value)}/><input type="time" aria-label="Deadline time" value={time} disabled={!deadline} onChange={e=>setTime(e.target.value)}/></div>}
  </>}
  <button type="button" className="text-button" onClick={onCancel}>Cancel</button>
 </form>;
}

function DisciplinePanel({discipline,setGoal}:{discipline:Discipline;setGoal:(g:number)=>void}){
 const today=todayStats(discipline),goal=discipline.dailyGoal,met=today.completed>=goal,rec=recommendedMinutes(discipline);
 return <Panel title="Discipline" icon={<Flame size={16}/>}>
  <div className="focus-stats"><div><Flame size={20}/><strong>{currentStreak(discipline)}</strong><span>day streak</span></div><div><Timer size={20}/><strong>{today.totalMinutes}</strong><span>minutes today</span></div></div>
  <div className="goal"><span><Target size={14}/>Today’s goal</span><strong className={met?'met':''}>{today.completed}/{goal}</strong></div>
  <progress max={goal} value={Math.min(goal,today.completed)} aria-label="Daily goal progress"/>
  {met&&<p className="met">Goal achieved! 🎉</p>}
  <label className="range-control"><span>Sessions per day<output>{goal}</output></span><input type="range" aria-label="Sessions per day" min={1} max={12} value={goal} onChange={e=>setGoal(Number(e.target.value))}/></label>
  <p className="subtle focus-small">{today.completed} completed · {today.abandoned} abandoned today</p>
  <p className="focus-tip"><Lightbulb size={14}/>{rec<=25?'You’ve abandoned a few sessions lately. Try shorter 25-minute sessions.':rec>=60?'You’re very consistent. Try a 60-minute challenge.':'45 minutes suits your current pace.'}</p>
 </Panel>;
}

type Reminder={id:string;label:string;icon:string;minutes:number;enabled:boolean};
const defaultReminders:Reminder[]=[{id:'eyes',label:'Rest your eyes',icon:'👀',minutes:20,enabled:true},{id:'water',label:'Drink water',icon:'💧',minutes:30,enabled:true},{id:'stretch',label:'Stretch',icon:'🙆',minutes:45,enabled:true},{id:'walk',label:'Take a walk',icon:'🚶',minutes:60,enabled:true}];
function HealthReminders({onRemind}:{onRemind:(m:string)=>void}){
 const [enabled,setEnabled]=useState<Record<string,boolean>>(()=>{try{return JSON.parse(pref.get('focus-reminders','{}'));}catch{return {};}});
 const [due,setDue]=useState<Record<string,number>>(()=>Object.fromEntries(defaultReminders.map(r=>[r.id,Date.now()+r.minutes*60000])));
 const [now,setNow]=useState(()=>Date.now());
 const reminders=defaultReminders.map(r=>({...r,enabled:enabled[r.id]??r.enabled}));
 useEffect(()=>{const id=setInterval(()=>{const t=Date.now();setNow(t);const fired=defaultReminders.filter(r=>(enabled[r.id]??r.enabled)&&due[r.id]<=t);if(!fired.length)return;chime();onRemind(fired.map(r=>`${r.icon} ${r.label}`).join(' · '));setDue(d=>({...d,...Object.fromEntries(fired.map(r=>[r.id,t+r.minutes*60000]))}));},1000);return()=>clearInterval(id);},[enabled,due,onRemind]);
 function toggle(r:Reminder){const next={...enabled,[r.id]:!r.enabled};setEnabled(next);pref.set('focus-reminders',JSON.stringify(next));setDue(d=>({...d,[r.id]:Date.now()+r.minutes*60000}));}
 const next=reminders.filter(r=>r.enabled).sort((a,b)=>due[a.id]-due[b.id])[0];
 return <Panel title="Health reminders" icon={<Bell size={16}/>} actions={<button aria-label="Restart reminder timers" title="Restart timers" onClick={()=>setDue(Object.fromEntries(defaultReminders.map(r=>[r.id,Date.now()+r.minutes*60000])))}><RotateCcw size={14}/></button>}>
  <ul className="reminders">{reminders.map(r=><li key={r.id}><span aria-hidden="true">{r.icon}</span><div><strong>{r.label}{next?.id===r.id&&<small> · next</small>}</strong><small>Every {r.minutes} min{r.enabled&&` · ${clock(Math.max(0,due[r.id]-now))}`}</small></div><button role="switch" aria-checked={r.enabled} aria-label={r.label} className={'switch'+(r.enabled?' on':'')} onClick={()=>toggle(r)}><span/></button></li>)}</ul>
 </Panel>;
}

const genres=[['Lofi','jfKfPfyJRdk'],['Jazz','VMAPTo7RVCo'],['Piano','BfkzVBRt1J0'],['Nature','xNN7iTA57jM'],['Ambient','S_MOd40zlYU'],['Classical','mIYzp5rcTvU'],['Chill','lTRiuFIWV54'],['Rock','9fh0qPef_ao']] as const;
function MusicPanel(){
 const [video,setVideo]=useState<string>(genres[0][1]),[playing,setPlaying]=useState(false),[draft,setDraft]=useState(''),[error,setError]=useState('');
 return <Panel title="Music" icon={<Music size={16}/>}>
  <div className="chips">{genres.map(([label,id])=><button key={id} aria-pressed={video===id} className={video===id?'active':''} onClick={()=>{setVideo(id);setPlaying(true);}}>{label}</button>)}</div>
  {playing?<div className="music-frame"><iframe title="Focus music" src={`https://www.youtube-nocookie.com/embed/${video}?autoplay=1&rel=0`} referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation" allow="autoplay; encrypted-media; picture-in-picture"/><button onClick={()=>setPlaying(false)}><X size={14}/>Stop music</button></div>:<button className="primary music-play" onClick={()=>setPlaying(true)}><Play size={14}/>Play music</button>}
  <form className="task-form-row" onSubmit={e=>{e.preventDefault();const id=youtubeId(draft);if(!id){setError('Paste a YouTube video link.');return;}setError('');setVideo(id);setPlaying(true);setDraft('');}}><input aria-label="YouTube link" placeholder="Paste a YouTube link…" value={draft} onChange={e=>setDraft(e.target.value)}/><button>Play</button></form>
  {error&&<p className="focus-small" role="alert">{error}</p>}
  <p className="subtle focus-small">Music streams from YouTube only after you press play. YouTube never receives your tasks, documents or boards.</p>
 </Panel>;
}
