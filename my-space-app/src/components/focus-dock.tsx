'use client';
// Mounted once in the Shell, so the focus timer, reminders and music survive switching between modes.
// Inside the MCVN dashboard the same frame shrinks to a floating music player on other dashboards ("mini" mode).
import {useEffect,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import {Bell,X,Minus,Music,Maximize2,GripHorizontal,SkipBack,SkipForward} from 'lucide-react';
import {embedURL,playerCommand} from '@/lib/music';
import {useFocus,initFocus,notify,stopMusic,genres,clock} from '@/lib/focus-store';
import {modeLabels} from '@/lib/focus';
import {pref} from '@/lib/preferences';

type Point={x:number;y:number};
const toParent=(data:Record<string,unknown>)=>{if(window.parent!==window)window.parent.postMessage(data,location.origin);};
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(Math.max(min,max),v));
/** The dashboard page can be served from browser cache for hours; this frame is always fresh, so it checks the dashboard's version. */
const DASHBOARD_API=3;
function dashboardOutdated(){try{return window.parent!==window&&((window.parent as unknown as {MCVN_MY_SPACE_API?:number}).MCVN_MY_SPACE_API??0)<DASHBOARD_API;}catch{return false;}}
function savedPos():Point|null{try{const p=JSON.parse(pref.get('music-dock-pos','null'));return p&&Number.isFinite(p.x)&&Number.isFinite(p.y)?p:null;}catch{return null;}}

export function FocusDock(){
 const {ready,timer,notice,music}=useFocus(),[small,setSmall]=useState(false),[mini,setMini]=useState(false),onWork=/\/work\/?$/.test(usePathname());
 const dock=useRef<HTMLElement>(null),drag=useRef<{sx:number;sy:number;left:number;top:number}|null>(null),[dragging,setDragging]=useState(false),[pos,setPos]=useState<Point|null>(null);
 const [outdated,setOutdated]=useState(false),[nowPlaying,setNowPlaying]=useState(''),player=useRef<HTMLIFrameElement>(null);
 useEffect(()=>{const onMessage=(e:MessageEvent)=>{if(e.origin!=='https://www.youtube-nocookie.com'||e.source!==player.current?.contentWindow||typeof e.data!=='string')return;
  try{const d=JSON.parse(e.data);const title=d?.info?.videoData?.title;if(typeof title==='string'&&title)setNowPlaying(title.slice(0,120));}catch{}};
  addEventListener('message',onMessage);return()=>removeEventListener('message',onMessage);},[]);
 useEffect(()=>{initFocus();setPos(savedPos());setOutdated(dashboardOutdated());},[]);
 useEffect(()=>{const onMessage=(e:MessageEvent)=>{if(e.origin===location.origin&&e.source===window.parent&&e.data?.type==='mcvn-mini')setMini(e.data.on===true);};window.addEventListener('message',onMessage);return()=>window.removeEventListener('message',onMessage);},[]);
 useEffect(()=>{document.documentElement.classList.toggle('mini',mini);},[mini]);
 // Keep a moved player on screen when the window gets smaller.
 useEffect(()=>{const fit=()=>setPos(p=>{const r=dock.current?.getBoundingClientRect();return p&&r?{x:clamp(p.x,8,innerWidth-r.width-8),y:clamp(p.y,8,innerHeight-r.height-8)}:p;});addEventListener('resize',fit);return()=>removeEventListener('resize',fit);},[]);
 const running=timer.endAt!==null;
 useEffect(()=>{if(!running)return;const title=document.title;document.title=`${clock(timer.remaining)} · ${modeLabels[timer.mode]}`;return()=>{document.title=title;};},[running,timer.remaining,timer.mode]);
 // Report the countdown, alerts and whether music plays, so the dashboard can show them on other dashboards.
 useEffect(()=>{if(ready)toParent({type:'my-space-focus',running,time:clock(timer.remaining),mode:modeLabels[timer.mode],music:music.playing});},[ready,running,timer.remaining,timer.mode,music.playing]);
 useEffect(()=>{if(notice)toParent({type:'my-space-focus',running,time:clock(timer.remaining),mode:modeLabels[timer.mode],music:music.playing,notice});},[notice]);// eslint-disable-line react-hooks/exhaustive-deps
 if(!ready)return null;
 const label=nowPlaying||music.titles[music.video]||genres.find(g=>g[1]===music.video)?.[0]||'YouTube';
 const hasQueue=!!music.list||music.queue.length>0;

 // Drag by the header. In mini mode the whole frame lives in the dashboard, so the dashboard moves it;
 // screen coordinates keep the deltas stable while the frame moves under the pointer.
 function onDown(e:React.PointerEvent<HTMLElement>){
  if(e.button!==0||(e.target as HTMLElement).closest('button'))return;
  e.currentTarget.setPointerCapture(e.pointerId);
  const r=dock.current!.getBoundingClientRect();drag.current={sx:e.screenX,sy:e.screenY,left:r.left,top:r.top};setDragging(true);
 }
 function onMove(e:React.PointerEvent<HTMLElement>){
  const d=drag.current;if(!d)return;
  const dx=e.screenX-d.sx,dy=e.screenY-d.sy;
  if(mini){if(dx||dy){toParent({type:'my-space-drag',dx,dy});d.sx=e.screenX;d.sy=e.screenY;}return;}
  const r=dock.current!.getBoundingClientRect();
  setPos({x:clamp(d.left+dx,8,innerWidth-r.width-8),y:clamp(d.top+dy,8,innerHeight-r.height-8)});
 }
 function onUp(){
  if(!drag.current)return;drag.current=null;setDragging(false);
  if(mini)toParent({type:'my-space-drag',dx:0,dy:0,end:true});else if(pos)pref.set('music-dock-pos',JSON.stringify(pos));
 }
 function resetPosition(){if(mini)toParent({type:'my-space-drag',reset:true});else{setPos(null);pref.set('music-dock-pos','null');}}
 const style=pos&&!mini?{left:pos.x,top:pos.y,right:'auto',bottom:'auto'}:undefined;

 return <>
  {notice&&!mini&&<p className="focus-notice" role="status"><Bell size={16}/>{notice}<button aria-label="Dismiss" onClick={()=>notify('')}><X size={14}/></button></p>}
  {music.playing&&<aside ref={dock} style={style} className={'music-dock'+(small&&!mini?' small':'')+(onWork?' on-work':'')+(dragging?' dragging':'')} aria-label="Music player">
   <header title="Drag to move · double-click to put back" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onDoubleClick={e=>{if(!(e.target as HTMLElement).closest('button'))resetPosition();}}>
    <GripHorizontal size={14} className="grip" aria-hidden="true"/><Music size={14}/><span title={label}>{label}</span>
    {hasQueue&&<><button aria-label="Previous video" title="Previous" onClick={()=>playerCommand(player.current,'previousVideo')}><SkipBack size={14}/></button><button aria-label="Next video" title="Next" onClick={()=>playerCommand(player.current,'nextVideo')}><SkipForward size={14}/></button></>}
    {mini?<button aria-label="Open My Space" title="Open My Space" onClick={()=>toParent({type:'my-space-open'})}><Maximize2 size={14}/></button>
     :<button aria-label={small?'Expand music player':'Shrink music player'} title={small?'Expand':'Shrink'} onClick={()=>setSmall(!small)}><Minus size={14}/></button>}
    <button aria-label="Stop music" title="Stop music" onClick={stopMusic}><X size={14}/></button></header>
   {outdated&&mini&&<p className="dock-update">MCVN has an update. <button onClick={()=>window.parent.location.reload()}>Refresh</button> to move this player.</p>}
   <iframe ref={player} key={music.list+music.video+music.queue.join()} title="Focus music" src={embedURL(music,location.origin)} onLoad={e=>{setNowPlaying('');e.currentTarget.contentWindow?.postMessage(JSON.stringify({event:'listening',id:'my-space',channel:'widget'}),'https://www.youtube-nocookie.com');}} referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox" allow="autoplay; encrypted-media; picture-in-picture"/>
  </aside>}
 </>;
}

/** Remaining time shown next to Work in the rail while the timer runs in the background. */
export function RailTimer(){
 const {timer}=useFocus();
 if(timer.endAt===null)return null;
 return <small className="rail-timer" aria-label={`${modeLabels[timer.mode]} timer ${clock(timer.remaining)}`}>{clock(timer.remaining)}</small>;
}
