import {describe,it,expect} from 'vitest';
import {parseYouTube,embedURL,type Music} from '../src/lib/music';
const base:Music={video:'7NOSDKb0HlU',queue:[],list:'',titles:{},playing:true};
describe('music links',()=>{
 it('reads videos, playlists and both from YouTube links only',()=>{
  expect(parseYouTube('https://www.youtube.com/watch?v=VMAPTo7RVCo&t=3')).toEqual({video:'VMAPTo7RVCo',list:''});
  expect(parseYouTube('https://youtu.be/VMAPTo7RVCo')).toEqual({video:'VMAPTo7RVCo',list:''});
  expect(parseYouTube('https://www.youtube.com/playlist?list=PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG')).toEqual({video:'',list:'PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG'});
  expect(parseYouTube('https://www.youtube.com/watch?v=VMAPTo7RVCo&list=PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG')?.list).toBe('PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG');
  expect(parseYouTube('https://evil.example/watch?v=VMAPTo7RVCo')).toBeNull();
  expect(parseYouTube('lofi music')).toBeNull();
 });
 it('embeds the queue as a playlist so the player has next/previous and plays on',()=>{
  const url=new URL(embedURL({...base,queue:['VMAPTo7RVCo','7NOSDKb0HlU','77ZozI0rw7w']},'https://teamqamcvn.com'));
  expect(url.pathname).toBe('/embed/7NOSDKb0HlU');expect(url.searchParams.get('playlist')).toBe('7NOSDKb0HlU,VMAPTo7RVCo,77ZozI0rw7w');
  expect(url.searchParams.get('enablejsapi')).toBe('1');expect(url.searchParams.get('origin')).toBe('https://teamqamcvn.com');
  expect(new URL(embedURL({...base,video:'',list:'PLabcdefghij'},'https://x')).pathname).toBe('/embed/videoseries');
 });
});
describe('music search',()=>{
 it('maps YouTube Data API results and reports quota errors',async()=>{
  const {searchYouTube}=await import('../src/lib/music');
  globalThis.document={createElement:()=>({set innerHTML(v:string){(this as {value:string}).value=v.replace('&#39;',"'").replace('&amp;','&');},value:''})} as unknown as Document;
  let url='';
  globalThis.fetch=(async(u:string)=>{url=u;return new Response(JSON.stringify({items:[{id:{videoId:'VMAPTo7RVCo'},snippet:{title:'Jazz &amp; rain',channelTitle:'Cafe',thumbnails:{default:{url:'https://i.ytimg.com/x.jpg'}}}},{id:{channelId:'x'}}]}));}) as typeof fetch;
  const found=await searchYouTube('lofi beats','KEY');
  expect(found).toEqual([{id:'VMAPTo7RVCo',title:'Jazz & rain',channel:'Cafe',thumb:'https://i.ytimg.com/x.jpg'}]);
  expect(new URL(url).searchParams.get('videoEmbeddable')).toBe('true');
  globalThis.fetch=(async()=>new Response('{}',{status:403})) as typeof fetch;
  await expect(searchYouTube('x','KEY')).rejects.toThrow('limit');
 });
});
