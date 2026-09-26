'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useState} from 'react';
import {FileText,Paintbrush,PanelsTopLeft,Aperture,Trophy,Settings,ArrowLeft,Leaf,X,Download} from 'lucide-react';
import {pref} from '@/lib/preferences';
import {initialize,useLibrary,backup} from '@/lib/library';
import {jsonDownload} from '@/lib/download';
const modes=[['write','Write',FileText],['create','Create',Paintbrush],['work','Work',PanelsTopLeft],['frame','Frame',Aperture],['challenge','Challenge',Trophy]] as const;
export function Shell({children}:{children:React.ReactNode}){
 const pathname=usePathname(),library=useLibrary();const [settings,setSettings]=useState(false);
 useEffect(()=>{void initialize();},[]);
 useEffect(()=>{const mode=pathname.split('/').filter(Boolean).at(-1);if(modes.some(m=>m[0]===mode))pref.set('mode',mode!);},[pathname]);
 return <div className="workspace"><nav className="rail" aria-label="Modes"><Link className="brand" href="/" title="My Space" aria-label="My Space"><Leaf size={23}/></Link><div className="mode-links">{modes.map(([slug,label,Icon])=><Link prefetch={false} key={slug} href={'/'+slug} className={pathname.endsWith('/'+slug)||pathname.endsWith('/'+slug+'/')?'selected':''} title={label} aria-label={label} aria-current={pathname.includes('/'+slug)?'page':undefined}><Icon size={21}/><span>{label}</span></Link>)}</div><div className="rail-bottom"><button aria-label="Settings and privacy" title="Settings and privacy" onClick={()=>setSettings(true)}><Settings size={20}/></button><a href="/dashboard.html#home" title="Back to MCVN" aria-label="Back to MCVN"><ArrowLeft size={20}/></a></div></nav><main className="surface">{library.error&&<div className="storage-alert" role="alert"><span>{library.error}</span><button onClick={()=>jsonDownload(backup(),'my-space-backup.json')}><Download size={16}/>Export now</button></div>}{children}</main>{settings&&<div className="modal-backdrop" onClick={()=>setSettings(false)}><section role="dialog" aria-modal="true" aria-label="About your space" className="modal" onClick={e=>e.stopPropagation()}><button className="close" aria-label="Close settings" onClick={()=>setSettings(false)} autoFocus><X/></button><span className="eyebrow">YOUR SPACE, YOUR DATA</span><h2>A little room to think.</h2><p>Documents and boards stay in this browser. They are not sent to this deployment, analytics, or AI services.</p><p>Work’s timer, tasks and focus history also stay in this browser. Music loads from YouTube only when you press play.</p><p>Clearing browser/site data deletes your library. Private browsing may be temporary. Export backups regularly.</p><button className="primary" onClick={()=>jsonDownload(backup(),'my-space-backup.json')}><Download size={16}/>Export all documents & boards</button><button onClick={()=>setSettings(false)}>Done</button></section></div>}</div>;
}
