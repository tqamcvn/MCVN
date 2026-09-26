'use client';
// Mounted once in the Shell, so the focus timer, reminders and music survive switching between modes.
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {Bell,X,Minus,Music} from 'lucide-react';
import {useFocus,initFocus,notify,stopMusic,genres,clock} from '@/lib/focus-store';
import {modeLabels} from '@/lib/focus';

export function FocusDock(){
 const {ready,timer,notice,music}=useFocus(),[small,setSmall]=useState(false),onWork=/\/work\/?$/.test(usePathname());
 useEffect(()=>{initFocus();},[]);
 const running=timer.endAt!==null;
 useEffect(()=>{if(!running)return;const title=document.title;document.title=`${clock(timer.remaining)} · ${modeLabels[timer.mode]}`;return()=>{document.title=title;};},[running,timer.remaining,timer.mode]);
 // Inside the MCVN dashboard, report the countdown and alerts so they show while another dashboard is open.
 useEffect(()=>{if(ready&&window.parent!==window)window.parent.postMessage({type:'my-space-focus',running,time:clock(timer.remaining),mode:modeLabels[timer.mode]},location.origin);},[ready,running,timer.remaining,timer.mode]);
 useEffect(()=>{if(notice&&window.parent!==window)window.parent.postMessage({type:'my-space-focus',running,time:clock(timer.remaining),mode:modeLabels[timer.mode],notice},location.origin);},[notice]);// eslint-disable-line react-hooks/exhaustive-deps
 if(!ready)return null;
 const label=genres.find(g=>g[1]===music.video)?.[0]??'Your video';
 return <>
  {notice&&<p className="focus-notice" role="status"><Bell size={16}/>{notice}<button aria-label="Dismiss" onClick={()=>notify('')}><X size={14}/></button></p>}
  {music.playing&&<aside className={'music-dock'+(small?' small':'')+(onWork?' on-work':'')} aria-label="Music player">
   <header><Music size={14}/><span>{label}</span><button aria-label={small?'Expand music player':'Shrink music player'} title={small?'Expand':'Shrink'} onClick={()=>setSmall(!small)}><Minus size={14}/></button><button aria-label="Stop music" title="Stop music" onClick={stopMusic}><X size={14}/></button></header>
   <iframe key={music.video} title="Focus music" src={`https://www.youtube-nocookie.com/embed/${music.video}?autoplay=1&rel=0`} referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation" allow="autoplay; encrypted-media; picture-in-picture"/>
  </aside>}
 </>;
}

/** Remaining time shown next to Work in the rail while the timer runs in the background. */
export function RailTimer(){
 const {timer}=useFocus();
 if(timer.endAt===null)return null;
 return <small className="rail-timer" aria-label={`${modeLabels[timer.mode]} timer ${clock(timer.remaining)}`}>{clock(timer.remaining)}</small>;
}
