// Focus timer, tasks and discipline logic, adapted from qamcvnfocus without login or cloud sync.
import {dayKey} from './challenges';
import {pref} from './preferences';

export type TimerMode='focus'|'shortBreak'|'longBreak'|'meditation';
export type Tag='work'|'learning'|'admin';
export type Recurrence='none'|'daily'|'weekly'|'monthly';
export type CheckItem={id:string;text:string;done:boolean};
export type Task={id:string;text:string;done:boolean;tag:Tag;checklist:CheckItem[];recurrence:Recurrence;recurrenceDays?:number[];deadline?:string|null;deadlineTime?:string|null;createdAt:string;completedDates?:string[]};
export type DayHistory={date:string;completed:number;abandoned:number;totalMinutes:number};
export type Discipline={streak:number;lastActiveDate:string;dailyGoal:number;history:DayHistory[]};
export type Durations=Record<TimerMode,number>;

export const modes:TimerMode[]=['focus','shortBreak','longBreak','meditation'];
export const modeLabels:Record<TimerMode,string>={focus:'Focus',shortBreak:'Short break',longBreak:'Long break',meditation:'Meditate'};
export const maxMinutes:Durations={focus:120,shortBreak:30,longBreak:30,meditation:60};
export const defaultDurations:Durations={focus:45,shortBreak:5,longBreak:15,meditation:10};
export const defaultDiscipline:Discipline={streak:0,lastActiveDate:'',dailyGoal:4,history:[]};
export const tagLabels:Record<Tag,string>={work:'Work',learning:'Learning',admin:'Admin'};
export const recurrenceLabels:Record<Recurrence,string>={none:'No repeat',daily:'Daily',weekly:'Weekly',monthly:'Monthly'};

const tags=Object.keys(tagLabels) as Tag[],recurrences=Object.keys(recurrenceLabels) as Recurrence[];
const isDay=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v);
const isTime=(v:unknown):v is string=>typeof v==='string'&&/^\d{2}:\d{2}$/.test(v);
const count=(v:unknown,min=0,max=1e6)=>typeof v==='number'&&Number.isFinite(v)?Math.round(Math.max(min,Math.min(max,v))):min;
const text=(v:unknown)=>typeof v==='string'?v.slice(0,500):'';

function read<T>(key:string,fallback:T,clean:(v:unknown)=>T):T{try{const raw=pref.get(key,'');return raw?clean(JSON.parse(raw)):fallback;}catch{return fallback;}}
export const save=(key:string,value:unknown)=>pref.set(key,JSON.stringify(value));

export function cleanTasks(value:unknown):Task[]{
 if(!Array.isArray(value))return [];
 return value.filter(t=>t&&typeof t==='object'&&typeof t.id==='string'&&text(t.text)).map((t):Task=>({
  id:t.id,text:text(t.text),done:t.done===true,tag:tags.includes(t.tag)?t.tag:'work',
  checklist:Array.isArray(t.checklist)?t.checklist.filter((c:CheckItem)=>c&&typeof c.id==='string'&&text(c.text)).map((c:CheckItem)=>({id:c.id,text:text(c.text),done:c.done===true})):[],
  recurrence:recurrences.includes(t.recurrence)?t.recurrence:'none',
  recurrenceDays:Array.isArray(t.recurrenceDays)?t.recurrenceDays.filter((d:unknown)=>Number.isInteger(d)&&(d as number)>=0&&(d as number)<=31):undefined,
  deadline:isDay(t.deadline)?t.deadline:null,deadlineTime:isTime(t.deadlineTime)?t.deadlineTime:null,
  createdAt:isDay(t.createdAt)?t.createdAt:dayKey(),completedDates:Array.isArray(t.completedDates)?t.completedDates.filter(isDay):[],
 }));
}
export function cleanDiscipline(value:unknown):Discipline{
 if(!value||typeof value!=='object')return defaultDiscipline;
 const d=value as Partial<Discipline>;
 return {streak:count(d.streak),lastActiveDate:isDay(d.lastActiveDate)?d.lastActiveDate:'',dailyGoal:count(d.dailyGoal,1,12)||4,
  history:Array.isArray(d.history)?d.history.filter(h=>h&&isDay(h.date)).map(h=>({date:h.date,completed:count(h.completed),abandoned:count(h.abandoned),totalMinutes:count(h.totalMinutes)})).slice(-30):[]};
}
export function cleanDurations(value:unknown):Durations{
 const d={...defaultDurations};
 if(value&&typeof value==='object')for(const m of modes){const v=(value as Durations)[m];if(typeof v==='number'&&Number.isFinite(v))d[m]=count(v,1,maxMinutes[m]);}
 return d;
}
export const loadTasks=()=>read('focus-tasks',[],cleanTasks);
export const loadDiscipline=()=>read('focus-discipline',defaultDiscipline,cleanDiscipline);
export const loadDurations=()=>read('focus-durations',defaultDurations,cleanDurations);

function shift(date:Date,days:number){const d=new Date(date);d.setDate(d.getDate()+days);return d;}
function withToday(d:Discipline,now:Date,change:(h:DayHistory)=>DayHistory){
 const today=dayKey(now),current=d.history.find(h=>h.date===today)??{date:today,completed:0,abandoned:0,totalMinutes:0};
 return [...d.history.filter(h=>h.date!==today),change(current)].slice(-30);
}
/** Streak shown to the user: an unfinished today keeps yesterday's streak alive. */
export function currentStreak(d:Discipline,now=new Date()){return d.lastActiveDate===dayKey(now)||d.lastActiveDate===dayKey(shift(now,-1))?d.streak:0;}
export function todayStats(d:Discipline,now=new Date()){return d.history.find(h=>h.date===dayKey(now))??{date:dayKey(now),completed:0,abandoned:0,totalMinutes:0};}
export function completeSession(d:Discipline,minutes:number,now=new Date()):Discipline{
 const today=dayKey(now),yesterday=dayKey(shift(now,-1));
 const streak=d.lastActiveDate===today?Math.max(1,d.streak):d.lastActiveDate===yesterday?d.streak+1:1;
 return {...d,streak,lastActiveDate:today,history:withToday(d,now,h=>({...h,completed:h.completed+1,totalMinutes:h.totalMinutes+minutes}))};
}
/** Abandoning is recorded but does not count as an active day for the streak. */
export function abandonSession(d:Discipline,now=new Date()):Discipline{return {...d,history:withToday(d,now,h=>({...h,abandoned:h.abandoned+1}))};}
export function recommendedMinutes(d:Discipline){
 const recent=d.history.slice(-7);if(recent.length<3)return 45;
 const done=recent.reduce((s,h)=>s+h.completed,0),quit=recent.reduce((s,h)=>s+h.abandoned,0),failRate=quit/Math.max(1,done+quit);
 return failRate>.4?25:failRate<.1&&done>10?60:45;
}

export function visibleToday(t:Task,now=new Date()){
 if(t.recurrence==='none'||t.recurrence==='daily'||t.completedDates?.includes(dayKey(now)))return true;
 return t.recurrenceDays?.includes(t.recurrence==='weekly'?now.getDay():now.getDate())??false;
}
export function doneToday(t:Task,now=new Date()){return t.recurrence==='none'?t.done:t.completedDates?.includes(dayKey(now))??false;}
export function overdue(t:Task,now=new Date()){
 if(!t.deadline||doneToday(t,now))return false;
 const [y,m,d]=t.deadline.split('-').map(Number),[h,min]=(t.deadlineTime??'23:59').split(':').map(Number);
 return now>new Date(y,m-1,d,h,min,59,999);
}
export function toggleTask(t:Task,now=new Date()):Task{
 if(t.recurrence==='none')return {...t,done:!t.done};
 const today=dayKey(now),dates=t.completedDates??[];
 return {...t,completedDates:dates.includes(today)?dates.filter(d=>d!==today):[...dates,today]};
}
export function todayTasks(tasks:Task[],now=new Date()){
 const rank=(t:Task)=>overdue(t,now)?0:doneToday(t,now)?2:1;
 return tasks.filter(t=>visibleToday(t,now)).sort((a,b)=>rank(a)-rank(b));
}
export function youtubeId(value:string){return value.trim().match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/)?.[1]??(/^[\w-]{11}$/.test(value.trim())?value.trim():null);}
