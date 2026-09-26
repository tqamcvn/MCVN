import {describe,it,expect} from 'vitest';
import {defaultDiscipline,completeSession,abandonSession,currentStreak,todayStats,recommendedMinutes,cleanDiscipline,cleanDurations,youtubeId} from '../src/lib/focus';
import {defaultBackground,suggestFit,backgroundStyle,cleanBackground,scaledSize} from '../src/lib/focus-background';
const at=(d:number,h=10)=>new Date(2026,8,d,h);
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
describe('focus storage and music',()=>{
 it('drops malformed stored data instead of crashing',()=>{
  expect(cleanDiscipline({dailyGoal:999,streak:-3,history:[{date:'bad'}]})).toMatchObject({dailyGoal:12,streak:0,history:[]});
  expect(cleanDurations({focus:500,shortBreak:'x'})).toMatchObject({focus:120,shortBreak:5});
 });
 it('accepts only YouTube video links for music',()=>{
  expect(youtubeId('https://www.youtube.com/watch?v=jfKfPfyJRdk&t=3')).toBe('jfKfPfyJRdk');
  expect(youtubeId('https://youtu.be/jfKfPfyJRdk')).toBe('jfKfPfyJRdk');
  expect(youtubeId('https://evil.example/jfKfPfyJRdk1')).toBeNull();
 });
});
describe('focus background',()=>{
 it('suggests tile for small images, whole image for very different shapes, fill otherwise',()=>{
  expect(suggestFit(200,200,1200,800)).toBe('tile');
  expect(suggestFit(1000,3000,1200,800)).toBe('contain');
  expect(suggestFit(1920,1080,1200,800)).toBe('cover');
 });
 it('builds CSS for each fit and sanitises stored settings',()=>{
  const b={...defaultBackground,picture:'ocean'};
  expect(backgroundStyle({...b,fit:'custom',size:150,x:0,y:100},'u')).toMatchObject({backgroundSize:'150% auto',backgroundPosition:'0% 100%',backgroundRepeat:'no-repeat'});
  expect(backgroundStyle({...b,fit:'tile'},'u').backgroundRepeat).toBe('repeat');
  expect(backgroundStyle({...b,fit:'fill'},'u').backgroundSize).toBe('100% 100%');
  expect(cleanBackground({picture:'javascript:x',fit:'weird',size:9999,dim:-5})).toMatchObject({picture:'',fit:'cover',size:300,dim:0});
  expect(scaledSize(5120,2880)).toEqual({width:2560,height:1440});
 });
});
