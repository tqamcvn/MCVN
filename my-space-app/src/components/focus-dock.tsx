'use client';
// Mounted once in the Shell, so the focus timer, reminders and music survive switching between modes.
// Inside the MCVN dashboard the same frame shrinks to a floating music player on other dashboards ("mini" mode).
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {Bell,X,Minus,Music,Maximize2} from 'lucide-react';
import {useFocus,initFocus,notify,stopMusic,genres,clock} from '@/lib/focus-store';
import {modeLabels} from '@/lib/focus';

const toParent=(data:Record<string,unknown>)=>{if(window.parent!==window)window.parent.postMessage(data,location.origin);};

export function FocusDock(){
 const {ready,timer,notice,music}=useFocus(),[small,setSmall]=useState(false),[mini,setMini]=useState(false),onWork=/\/work\/?$/.test(usePathname());
 useEffect(()=>{initFocus();},[]);
 useEffect(()=>{const onMessage=(e:MessageEvent)=>{if(e.origin===location.origin&&e.source===window.parent&&e.data?.type==='mcvn-mini')setMini(e.data.on===true);};window.addEventListener('message',onMessage);return()=>window.removeEventListener('message',onMessage);},[]);
 useEffect(()=>{document.documentElement.classList.toggle('mini',mini);},[mini]);
 const running=timer.endAt!==null;
 useEffect(()=>{if(!running)return;const title=document.title;document.title=`${clock(timer.remaining)} · ${modeLabels[timer.mode]}`;return()=>{document.title=title;};},[running,timer.remaining,timer.mode]);
 // Report the countdown, alerts and whether music plays, so the dashboard can show them on other dashboards.
 useEffect(()=>{if(ready)toParent({type:'my-space-focus',running,time:clock(timer.remaining),mode:modeLabels[timer.mode],music:music.playing});},[ready,running,timer.remaining,timer.mode,music.playing]);
 useEffect(()=>{if(notice)toParent({type:'my-space-focus',running,time:clock(timer.remaining),mode:modeLabels[timer.mode],music:music.playing,notice});},[notice]);// eslint-disable-line react-hooks/exhaustive-deps
 if(!ready)return null;
 const label=genres.find(g=>g[1]===music.video)?.[0]??'Your video';
 return <>
  {notice&&!mini&&<p className="focus-notice" role="status"><Bell size={16}/>{notice}<button aria-label="Dismiss" onClick={()=>notify('')}><X size={14}/></button></p>}
  {music.playing&&<aside className={'music-dock'+(small&&!mini?' small':'')+(onWork?' on-work':'')} aria-label="Music player">
   <header><Music size={14}/><span>{label}</span>
    {mini?<button aria-label="Open My Space" title="Open My Space" onClick={()=>toParent({type:'my-space-open'})}><Maximize2 size={14}/></button>
     :<button aria-label={small?'Expand music player':'Shrink music player'} title={small?'Expand':'Shrink'} onClick={()=>setSmall(!small)}><Minus size={14}/></button>}
    <button aria-label="Stop music" title="Stop music" onClick={stopMusic}><X size={14}/></button></header>
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
