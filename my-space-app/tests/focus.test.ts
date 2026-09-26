import {describe,it,expect} from 'vitest';
import {type Task,defaultDiscipline,completeSession,abandonSession,currentStreak,todayStats,recommendedMinutes,cleanTasks,cleanDiscipline,cleanDurations,visibleToday,doneToday,overdue,toggleTask,todayTasks,youtubeId} from '../src/lib/focus';
const at=(d:number,h=10)=>new Date(2026,8,d,h);
const task=(v:Partial<Task>={}):Task=>({id:'t',text:'Task',done:false,tag:'work',checklist:[],recurrence:'none',createdAt:'2026-09-01',completedDates:[],...v});
describe('focus discipline',()=>{
 it('counts streaks by local day and keeps it through an unfinished today',()=>{
  let d=completeSession(defaultDiscipline,25,at(24));d=completeSession(d,25,at(24,23));d=completeSession(d,45,at(25));
  expect(d.streak).toBe(2);expect(todayStats(d,at(25)).totalMinutes).toBe(45);
  expect(currentStreak(d,at(26))).toBe(2);expect(currentStreak(d,at(27))).toBe(0);
  expect(completeSession(d,25,at(27)).streak).toBe(1);
 });
 it('records abandoned sessions without extending or resetting the streak',()=>{
  const d=abandonSession(completeSession(defaultDiscipline,25,at(25)),at(26));
  expect(todayStats(d,at(26))).toMatchObject({completed:0,abandoned:1});expect(completeSession(d,25,at(26)).streak).toBe(2);
 });
 it('suggests shorter sessions after frequent abandons',()=>{
  let d=defaultDiscipline;for(const day of [20,21,22]){d=abandonSession(d,at(day));d=abandonSession(d,at(day));d=completeSession(d,25,at(day));}
  expect(recommendedMinutes(d)).toBe(25);expect(recommendedMinutes(defaultDiscipline)).toBe(45);
 });
});
describe('focus tasks',()=>{
 it('shows weekly and monthly tasks only on their days, overdue first',()=>{
  const sat=at(26);expect(sat.getDay()).toBe(6);
  expect(visibleToday(task({recurrence:'weekly',recurrenceDays:[6]}),sat)).toBe(true);
  expect(visibleToday(task({recurrence:'weekly',recurrenceDays:[1]}),sat)).toBe(false);
  expect(visibleToday(task({recurrence:'monthly',recurrenceDays:[26]}),sat)).toBe(true);
  const list=todayTasks([task({id:'a',done:true}),task({id:'b'}),task({id:'c',deadline:'2026-09-25'})],sat);
  expect(list.map(t=>t.id)).toEqual(['c','b','a']);
 });
 it('uses local deadline times and toggles recurring completion per day',()=>{
  expect(overdue(task({deadline:'2026-09-26',deadlineTime:'09:00'}),at(26))).toBe(true);
  expect(overdue(task({deadline:'2026-09-26'}),at(26,23))).toBe(false);
  const daily=toggleTask(task({recurrence:'daily'}),at(26));
  expect(doneToday(daily,at(26))).toBe(true);expect(doneToday(daily,at(27))).toBe(false);
 });
 it('drops malformed stored data instead of crashing',()=>{
  expect(cleanTasks('nope')).toEqual([]);
  expect(cleanTasks([{id:'x',text:'ok',tag:'evil',recurrence:'hourly',deadline:'tomorrow'},{text:'no id'}])).toMatchObject([{id:'x',tag:'work',recurrence:'none',deadline:null}]);
  expect(cleanDiscipline({dailyGoal:999,streak:-3,history:[{date:'bad'}]})).toMatchObject({dailyGoal:12,streak:0,history:[]});
  expect(cleanDurations({focus:500,shortBreak:'x'})).toMatchObject({focus:120,shortBreak:5});
 });
 it('accepts only YouTube video links for music',()=>{
  expect(youtubeId('https://www.youtube.com/watch?v=jfKfPfyJRdk&t=3')).toBe('jfKfPfyJRdk');
  expect(youtubeId('https://youtu.be/jfKfPfyJRdk')).toBe('jfKfPfyJRdk');
  expect(youtubeId('https://evil.example/jfKfPfyJRdk1')).toBeNull();
 });
});
