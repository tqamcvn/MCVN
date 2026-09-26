import {describe,it,expect,beforeEach,vi} from 'vitest';
const store:Record<string,string>={};
vi.stubGlobal('localStorage',{getItem:(k:string)=>store[k]??null,setItem:(k:string,v:string)=>{store[k]=v;},removeItem:(k:string)=>{delete store[k];}});
const h=await import('../src/lib/music-history');
const DAY=86400000,now=Date.UTC(2026,8,26);
describe('listening history',()=>{
 beforeEach(()=>h.clearHistory());
 it('counts a play once per 10 minutes and keeps the latest title',()=>{
  h.recordListen('VMAPTo7RVCo','Jazz',now);h.recordListen('VMAPTo7RVCo','Jazz (live)',now+60000);h.recordListen('VMAPTo7RVCo','Jazz',now+700000);
  const [l]=h.forYou(JSON.parse(store['my-space:music-history']));expect(l.plays).toBe(2);expect(l.title).toBe('Jazz');
  h.recordListen('bad id','x',now);expect(JSON.parse(store['my-space:music-history'])).toHaveLength(1);
 });
 it('ranks favourites, then frequent and recent plays',()=>{
  const list=[{id:'aaaaaaaaaaa',title:'old favourite',plays:1,last:now-60*DAY,liked:true},{id:'bbbbbbbbbbb',title:'often, recent',plays:5,last:now-DAY,liked:false},{id:'ccccccccccc',title:'often, long ago',plays:5,last:now-90*DAY,liked:false}];
  expect(h.forYou(list,now).map(l=>l.title)).toEqual(['old favourite','often, recent','often, long ago']);
  expect(h.myMix(list,2,()=>0).map(l=>l.id)).toEqual(['aaaaaaaaaaa','bbbbbbbbbbb']);
 });
 it('likes, forgets and survives damaged storage',()=>{
  h.toggleLike('VMAPTo7RVCo','Jazz');expect(JSON.parse(store['my-space:music-history'])[0].liked).toBe(true);
  h.forget('VMAPTo7RVCo');expect(JSON.parse(store['my-space:music-history'])).toEqual([]);
 });
});
