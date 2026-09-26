'use client';
// What the user has listened to, kept only in this browser, so the Music panel can suggest from their own taste.
import {useSyncExternalStore} from 'react';
import {pref} from './preferences';

export type Listen={id:string;title:string;plays:number;last:number;liked:boolean};
const KEY='music-history',MAX=150,DAY=86400000;
const valid=(v:unknown):v is Listen=>!!v&&typeof v==='object'&&/^[\w-]{11}$/.test((v as Listen).id)&&typeof (v as Listen).title==='string'&&Number.isFinite((v as Listen).plays)&&Number.isFinite((v as Listen).last);
function load():Listen[]{try{const data=JSON.parse(pref.get(KEY,'[]'));return Array.isArray(data)?data.filter(valid).map(l=>({...l,title:l.title.slice(0,150),liked:l.liked===true})).slice(0,MAX):[];}catch{return [];}}

let history:Listen[]|null=null;
const listeners=new Set<()=>void>(),empty:Listen[]=[];
function get(){return history??=load();}
function set(next:Listen[]){history=next.slice(0,MAX);pref.set(KEY,JSON.stringify(history));listeners.forEach(fn=>fn());}
export function useHistory(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};},get,()=>empty);}

/** Called when the player starts a video (chosen, next/previous, playlist or a YouTube suggestion). */
export function recordListen(id:string,title:string,now=Date.now()){
 if(!/^[\w-]{11}$/.test(id))return;
 const all=get(),old=all.find(l=>l.id===id);
 // Seeing the same video again within 10 minutes (reloads, previous/next back and forth) is not a new play.
 if(old&&now-old.last<600000){if(title&&title!==old.title)set(all.map(l=>l.id===id?{...l,title}:l));return;}
 set([{id,title:title||old?.title||'YouTube video',plays:(old?.plays??0)+1,last:now,liked:old?.liked??false},...all.filter(l=>l.id!==id)]);
}
export function toggleLike(id:string,title:string){
 const all=get(),old=all.find(l=>l.id===id);
 set(old?all.map(l=>l.id===id?{...l,liked:!l.liked}:l):[{id,title:title||'YouTube video',plays:0,last:Date.now(),liked:true},...all]);
}
export function forget(id:string){set(get().filter(l=>l.id!==id));}
export function clearHistory(){set([]);}

/** Favourites first, then what is played often and recently (a play loses half its weight every two weeks). */
export function score(l:Listen,now=Date.now()){return (l.liked?6:0)+l.plays*Math.pow(.5,(now-l.last)/(14*DAY));}
export function forYou(list:Listen[],now=Date.now()){return [...list].sort((a,b)=>score(b,now)-score(a,now));}
/** A mix for "Play my mix": the top picks in a lightly shuffled order so it doesn't always start the same way. */
export function myMix(list:Listen[],size=25,random=Math.random){
 const top=forYou(list).slice(0,size);
 return top.map((l,i)=>({l,k:i+random()*4})).sort((a,b)=>a.k-b.k).map(x=>x.l);
}
