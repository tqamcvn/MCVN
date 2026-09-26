// Focus timer and discipline logic, adapted from qamcvnfocus without login or cloud sync.
import {dayKey} from './challenges';
import {pref} from './preferences';

export type TimerMode='focus'|'shortBreak'|'longBreak'|'meditation';
export type DayHistory={date:string;completed:number;abandoned:number;totalMinutes:number};
export type Discipline={streak:number;lastActiveDate:string;dailyGoal:number;history:DayHistory[]};
export type Durations=Record<TimerMode,number>;

export const modes:TimerMode[]=['focus','shortBreak','longBreak','meditation'];
export const modeLabels:Record<TimerMode,string>={focus:'Focus',shortBreak:'Short break',longBreak:'Long break',meditation:'Meditate'};
export const maxMinutes:Durations={focus:120,shortBreak:30,longBreak:30,meditation:60};
export const defaultDurations:Durations={focus:45,shortBreak:5,longBreak:15,meditation:10};
export const defaultDiscipline:Discipline={streak:0,lastActiveDate:'',dailyGoal:4,history:[]};

const isDay=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v);
const count=(v:unknown,min=0,max=1e6)=>typeof v==='number'&&Number.isFinite(v)?Math.round(Math.max(min,Math.min(max,v))):min;

function read<T>(key:string,fallback:T,clean:(v:unknown)=>T):T{try{const raw=pref.get(key,'');return raw?clean(JSON.parse(raw)):fallback;}catch{return fallback;}}
export const save=(key:string,value:unknown)=>pref.set(key,JSON.stringify(value));

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

export function youtubeId(value:string){return value.trim().match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/)?.[1]??(/^[\w-]{11}$/.test(value.trim())?value.trim():null);}
