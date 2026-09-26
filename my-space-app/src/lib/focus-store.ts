'use client';
// Timer, health reminders and music live here instead of in the Work page, so they keep running
// while the user switches to Write, Create, Frame or Challenge. Timer and reminder deadlines are
// timestamps saved in localStorage, so a reload continues where it left off.
import {useSyncExternalStore} from 'react';
import {pref} from './preferences';
import {type TimerMode,type Discipline,type Durations,modes,modeLabels,defaultDurations,defaultDiscipline,loadDiscipline,loadDurations,save,completeSession,abandonSession} from './focus';

export type Timer={mode:TimerMode;endAt:number|null;remaining:number;started:boolean};
export type Reminder={id:string;label:string;icon:string;minutes:number};
export const reminderList:Reminder[]=[{id:'eyes',label:'Rest your eyes',icon:'👀',minutes:20},{id:'water',label:'Drink water',icon:'💧',minutes:30},{id:'stretch',label:'Stretch',icon:'🙆',minutes:45},{id:'walk',label:'Take a walk',icon:'🚶',minutes:60}];
// Checked 2026-09-26: each plays when embedded from teamqamcvn.com. Streams can end, so the panel also accepts any YouTube link.
export const genres=[['Lofi','7NOSDKb0HlU'],['Jazz','VMAPTo7RVCo'],['Piano','77ZozI0rw7w'],['Nature','xNN7iTA57jM'],['Ambient','S_MOd40zlYU'],['Classical','jgpJVI3tDbY'],['Chill','lTRiuFIWV54'],['Synthwave','4xDzrJKXOOY']] as const;
export type FocusState={ready:boolean;now:number;durations:Durations;discipline:Discipline;timer:Timer;enabled:Record<string,boolean>;due:Record<string,number>;music:{video:string;playing:boolean};notice:string;storageError:boolean};

export const clock=(ms:number)=>{const s=Math.ceil(ms/1000);return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;};
const fresh=(mode:TimerMode,d:Durations):Timer=>({mode,endAt:null,remaining:d[mode]*60000,started:false});
let state:FocusState={ready:false,now:0,durations:defaultDurations,discipline:defaultDiscipline,timer:fresh('focus',defaultDurations),enabled:{},due:{},music:{video:genres[0][1],playing:false},notice:'',storageError:false};
const serverState=state,listeners=new Set<()=>void>();
function publish(change:Partial<FocusState>){state={...state,...change};listeners.forEach(fn=>fn());}
export function useFocus(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};},()=>state,()=>serverState);}

function chime(){try{const ctx=new AudioContext();[0,.25].forEach((at,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=i?880:660;g.gain.setValueAtTime(.001,ctx.currentTime+at);g.gain.exponentialRampToValueAtTime(.25,ctx.currentTime+at+.02);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+at+.5);o.connect(g).connect(ctx.destination);o.start(ctx.currentTime+at);o.stop(ctx.currentTime+at+.55);});setTimeout(()=>void ctx.close(),1500);}catch{}}
let noticeTimer:ReturnType<typeof setTimeout>|undefined;
export function notify(notice:string){publish({notice});clearTimeout(noticeTimer);if(notice)noticeTimer=setTimeout(()=>publish({notice:''}),8000);}

function readJSON<T>(key:string,fallback:T):T{try{const raw=pref.get(key,'');return raw?JSON.parse(raw) as T:fallback;}catch{return fallback;}}
function cleanTimer(value:unknown,d:Durations):Timer{
 const t=value as Partial<Timer>|null;
 if(!t||!modes.includes(t.mode as TimerMode))return fresh('focus',d);
 const mode=t.mode as TimerMode,max=d[mode]*60000;
 const remaining=typeof t.remaining==='number'&&Number.isFinite(t.remaining)?Math.max(0,Math.min(max,t.remaining)):max;
 const endAt=typeof t.endAt==='number'&&Number.isFinite(t.endAt)?t.endAt:null;
 return {mode,endAt,remaining,started:t.started===true||endAt!==null};
}
const saveTimer=(t:Timer)=>save('focus-timer',t);
const saveDue=(due:Record<string,number>)=>save('focus-reminder-due',due);

let ticker:ReturnType<typeof setInterval>|undefined;
export function initFocus(){
 if(ticker)return;
 const now=Date.now(),durations=loadDurations();
 const enabled=readJSON<Record<string,boolean>>('focus-reminders',{});
 const stored=readJSON<Record<string,number>>('focus-reminder-due',{});
 // Deadlines missed while the page was closed are simply rescheduled rather than all firing at once.
 const due=Object.fromEntries(reminderList.map(r=>[r.id,typeof stored[r.id]==='number'&&stored[r.id]>now?stored[r.id]:now+r.minutes*60000]));
 // Stations that stopped working are swapped for the current default.
 const retired=['jfKfPfyJRdk','BfkzVBRt1J0','mIYzp5rcTvU','9fh0qPef_ao'],saved=pref.get('focus-music',''),video=retired.includes(saved)?'':saved;
 publish({ready:true,now,durations,discipline:loadDiscipline(),timer:cleanTimer(readJSON('focus-timer',null),durations),enabled,due,music:{video:genres.some(g=>g[1]===video)||/^[\w-]{11}$/.test(video)?video:genres[0][1],playing:false}});
 saveDue(due);
 tick();
 ticker=setInterval(tick,250);
}

function tick(){
 const now=Date.now(),{timer,due,enabled}=state;
 const change:Partial<FocusState>={};
 if(timer.endAt!==null){
  const remaining=Math.max(0,timer.endAt-now);
  if(!remaining){finish();return;}
  if(Math.ceil(remaining/1000)!==Math.ceil(timer.remaining/1000))change.timer={...timer,remaining};
 }
 const fired=reminderList.filter(r=>(enabled[r.id]??true)&&due[r.id]<=now);
 if(fired.length){change.due={...due,...Object.fromEntries(fired.map(r=>[r.id,now+r.minutes*60000]))};saveDue(change.due);chime();notify(fired.map(r=>`${r.icon} ${r.label}`).join(' · '));}
 if(Math.floor(now/1000)!==Math.floor(state.now/1000))change.now=now;
 if(Object.keys(change).length)publish(change);
}
function finish(){
 const {timer,durations,discipline}=state,mode=timer.mode;
 const next=fresh(mode,durations);saveTimer(next);
 const done=mode==='focus'&&timer.started?completeSession(discipline,durations.focus):discipline;
 if(done!==discipline&&!save('focus-discipline',done))publish({storageError:true});
 publish({timer:next,discipline:done});
 chime();
 notify(mode==='focus'?'Focus session complete. Well done!':`${modeLabels[mode]} is over. Ready when you are.`);
}

function setTimer(t:Timer){saveTimer(t);publish({timer:t});}
export const startTimer=()=>{const t=state.timer;if(t.endAt===null)setTimer({...t,started:true,endAt:Date.now()+t.remaining});};
export const pauseTimer=()=>{const t=state.timer;if(t.endAt!==null)setTimer({...t,endAt:null,remaining:Math.max(0,t.endAt-Date.now())});};
export const resetTimer=(mode:TimerMode=state.timer.mode)=>setTimer(fresh(mode,state.durations));
/** A focus session that was started and not finished counts as abandoned. */
export const isFocusInProgress=()=>{const t=state.timer;return t.mode==='focus'&&t.started;};
export function abandonFocus(){const d=abandonSession(state.discipline);if(!save('focus-discipline',d))publish({storageError:true});publish({discipline:d});}
export function setMinutes(mode:TimerMode,minutes:number){
 const durations={...state.durations,[mode]:minutes};save('focus-durations',durations);publish({durations});
 const t=state.timer;if(t.mode===mode&&!t.started)setTimer(fresh(mode,durations));
}
export function setGoal(dailyGoal:number){const d={...state.discipline,dailyGoal};save('focus-discipline',d);publish({discipline:d});}
export function toggleReminder(id:string){
 const enabled={...state.enabled,[id]:!(state.enabled[id]??true)};pref.set('focus-reminders',JSON.stringify(enabled));
 const r=reminderList.find(x=>x.id===id)!,due={...state.due,[id]:Date.now()+r.minutes*60000};saveDue(due);publish({enabled,due});
}
export function restartReminders(){const now=Date.now(),due=Object.fromEntries(reminderList.map(r=>[r.id,now+r.minutes*60000]));saveDue(due);publish({due});}
export function playMusic(video=state.music.video){pref.set('focus-music',video);publish({music:{video,playing:true}});}
export function stopMusic(){publish({music:{...state.music,playing:false}});}
