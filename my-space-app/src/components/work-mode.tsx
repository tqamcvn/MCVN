'use client';
// Focus workspace adapted from qamcvnfocus. The timer, reminders and music run in lib/focus-store so they keep
// going while you use other modes; everything stays in this browser, with no login or cloud sync.
import {useCallback,useEffect,useRef,useState} from 'react';
import {Play,Pause,RotateCcw,SkipForward,Settings2,AlertTriangle,Flame,Target,Lightbulb,Bell,Music,X,Timer,Image as ImageIcon,Upload,Sparkles,Ban,Search,Heart,Shuffle,History} from 'lucide-react';
import {pref} from '@/lib/preferences';
import {type TimerMode,modes,modeLabels,maxMinutes,recommendedMinutes,currentStreak,todayStats} from '@/lib/focus';
import {type Track,parseYouTube,searchYouTube,searchKey} from '@/lib/music';
import {useHistory,forYou,myMix,toggleLike,forget,clearHistory} from '@/lib/music-history';
import {useFocus,startTimer,pauseTimer,resetTimer,isFocusInProgress,abandonFocus,setMinutes,setGoal,toggleReminder,restartReminders,playMusic,stopMusic,reminderList,genres,clock} from '@/lib/focus-store';
import {type Background,type Fit,pictures,fits,defaultBackground,loadBackground,pictureURL,suggestFit,backgroundStyle,scaledSize,MAX_SIDE} from '@/lib/focus-background';

const presets=[25,45,60,90];

export default function WorkMode(){
 const focus=useFocus();
 const [ready,setReady]=useState(false),[background,setBackground]=useState<Background>(defaultBackground),[customImage,setCustomImage]=useState(''),[bgOpen,setBgOpen]=useState(false);
 useEffect(()=>{setBackground(loadBackground());setCustomImage(pref.get('focus-background-image',''));setReady(true);},[]);
 useEffect(()=>{if(ready)pref.set('focus-background',JSON.stringify(background));},[background,ready]);
 const closeBackground=useCallback(()=>setBgOpen(false),[]);
 if(!ready||!focus.ready)return <div className="empty">Getting your focus space ready…</div>;
 return <div className="work-mode">
  <header className="toolbar"><div className="mode-title"><span className="mode-icon"><Timer size={20}/></span><h1>Focus</h1></div><div className="toolbar-actions"><span className="subtle">Keeps running while you use other modes</span><div className="dropdown"><button className="button" aria-expanded={bgOpen} aria-haspopup="dialog" onClick={()=>setBgOpen(!bgOpen)}><ImageIcon size={16}/>Background</button>{bgOpen&&<BackgroundPanel background={background} setBackground={setBackground} customImage={customImage} setCustomImage={setCustomImage} onClose={closeBackground}/>}</div></div></header>
  {focus.storageError&&<p className="inline-message" role="alert">This browser is not saving focus data. Your progress is kept only until you close the page.</p>}
  <div className="focus-layout">
   <FocusTimer background={background} customImage={customImage}/>
   <aside className="focus-side">
    <DisciplinePanel/>
    <HealthReminders/>
    <MusicPanel/>
   </aside>
  </div>
 </div>;
}

function FocusTimer({background,customImage}:{background:Background;customImage:string}){
 const {timer,durations,discipline}=useFocus(),[custom,setCustom]=useState(false),[pending,setPending]=useState<(()=>void)|null>(null);
 const {mode,remaining,started}=timer,running=timer.endAt!==null,total=durations[mode]*60000,recommended=recommendedMinutes(discipline);
 function guard(action:()=>void){if(isFocusInProgress())setPending(()=>action);else action();}
 const radius=140,circumference=2*Math.PI*radius,progress=total?1-remaining/total:0;
 const url=background.picture==='custom'?customImage:background.picture?pictureURL(background.picture):'';
 return <section className={'focus-main'+(url?' has-bg':'')} aria-label="Focus timer">
  {url&&<><div className="focus-bg" style={backgroundStyle(background,url)} aria-hidden="true"/><div className="focus-bg-dim" style={{opacity:background.dim/100}} aria-hidden="true"/></>}
  <div className="focus-tabs" role="tablist">{modes.map(m=><button key={m} role="tab" aria-selected={mode===m} className={mode===m?'active':''} onClick={()=>guard(()=>resetTimer(m))}>{modeLabels[m]}</button>)}</div>
  {mode==='focus'&&<div className="chips focus-presets">{presets.map(p=><button key={p} disabled={started} className={durations.focus===p?'active':''} onClick={()=>setMinutes('focus',p)}>{p} min</button>)}{recommended!==durations.focus&&<button disabled={started} title="Suggested from your last 7 days" onClick={()=>setMinutes('focus',recommended)}><Lightbulb size={13}/>{recommended} min</button>}</div>}
  <div className="focus-ring">
   <svg viewBox="0 0 320 320" aria-hidden="true"><circle cx="160" cy="160" r={radius} className="track"/><circle cx="160" cy="160" r={radius} className="progress" strokeDasharray={circumference} strokeDashoffset={circumference*(1-progress)}/></svg>
   <div><span className="focus-time" role="timer" aria-live="off">{clock(remaining)}</span><span className="subtle">{modeLabels[mode]}</span></div>
  </div>
  <div className="focus-controls">
   <button aria-label="Reset timer" title="Reset" onClick={()=>guard(()=>resetTimer())}><RotateCcw size={22}/></button>
   <button className="primary focus-play" aria-label={running?'Pause timer':'Start timer'} onClick={running?pauseTimer:startTimer}>{running?<Pause size={28}/>:<Play size={28}/>}</button>
   <button aria-label="Next mode" title="Next mode" onClick={()=>guard(()=>resetTimer(modes[(modes.indexOf(mode)+1)%modes.length]))}><SkipForward size={22}/></button>
  </div>
  <button className="text-button" aria-expanded={custom} onClick={()=>setCustom(!custom)}><Settings2 size={14}/>Custom time</button>
  {custom&&<div className="focus-custom">{modes.map(m=><label className="range-control" key={m}><span>{modeLabels[m]}<output>{durations[m]} min</output></span><input type="range" aria-label={modeLabels[m]+' minutes'} min={1} max={maxMinutes[m]} value={durations[m]} disabled={started&&m===mode} onChange={e=>setMinutes(m as TimerMode,Number(e.target.value))}/></label>)}</div>}
  {pending&&<div className="modal-backdrop"><section className="modal" role="alertdialog" aria-modal="true" aria-labelledby="abandon-title"><span className="eyebrow"><AlertTriangle size={15}/>STILL FOCUSING</span><h2 id="abandon-title">Abandon this session?</h2><p>A session stopped halfway won’t count toward today’s goal.</p><button className="primary" autoFocus onClick={()=>setPending(null)}>Keep going</button><button onClick={()=>{abandonFocus();const action=pending;setPending(null);action();}}>Abandon session</button></section></div>}
 </section>;
}

function Panel({title,icon,badge,actions,children}:{title:string;icon:React.ReactNode;badge?:number;actions?:React.ReactNode;children:React.ReactNode}){
 const key='focus-panel-'+title.toLowerCase(),[open,setOpen]=useState(()=>pref.get(key,'open')==='open');
 return <section className="focus-panel" aria-label={title}><header><h2>{icon}{title}{!!badge&&<span className="badge">{badge}</span>}</h2>{actions}<button aria-label={(open?'Collapse ':'Expand ')+title} aria-expanded={open} onClick={()=>{setOpen(!open);pref.set(key,open?'closed':'open');}}>{open?'−':'+'}</button></header>{open&&children}</section>;
}

function DisciplinePanel(){
 const {discipline}=useFocus(),today=todayStats(discipline),goal=discipline.dailyGoal,met=today.completed>=goal,rec=recommendedMinutes(discipline);
 return <Panel title="Discipline" icon={<Flame size={16}/>}>
  <div className="focus-stats"><div><Flame size={20}/><strong>{currentStreak(discipline)}</strong><span>day streak</span></div><div><Timer size={20}/><strong>{today.totalMinutes}</strong><span>minutes today</span></div></div>
  <div className="goal"><span><Target size={14}/>Today’s goal</span><strong className={met?'met':''}>{today.completed}/{goal}</strong></div>
  <progress max={goal} value={Math.min(goal,today.completed)} aria-label="Daily goal progress"/>
  {met&&<p className="met">Goal achieved! 🎉</p>}
  <label className="range-control"><span>Sessions per day<output>{goal}</output></span><input type="range" aria-label="Sessions per day" min={1} max={12} value={goal} onChange={e=>setGoal(Number(e.target.value))}/></label>
  <p className="subtle focus-small">{today.completed} completed · {today.abandoned} abandoned today</p>
  <p className="focus-tip"><Lightbulb size={14}/>{rec<=25?'You’ve abandoned a few sessions lately. Try shorter 25-minute sessions.':rec>=60?'You’re very consistent. Try a 60-minute challenge.':'45 minutes suits your current pace.'}</p>
 </Panel>;
}

function HealthReminders(){
 const {enabled,due,now}=useFocus();
 const list=reminderList.map(r=>({...r,on:enabled[r.id]??true}));
 const next=list.filter(r=>r.on).sort((a,b)=>due[a.id]-due[b.id])[0];
 return <Panel title="Health reminders" icon={<Bell size={16}/>} actions={<button aria-label="Restart reminder timers" title="Restart timers" onClick={restartReminders}><RotateCcw size={14}/></button>}>
  <ul className="reminders">{list.map(r=><li key={r.id}><span aria-hidden="true">{r.icon}</span><div><strong>{r.label}{next?.id===r.id&&<small> · next</small>}</strong><small>Every {r.minutes} min{r.on&&` · ${clock(Math.max(0,due[r.id]-now))}`}</small></div><button role="switch" aria-checked={r.on} aria-label={r.label} className={'switch'+(r.on?' on':'')} onClick={()=>toggleReminder(r.id)}><span/></button></li>)}</ul>
 </Panel>;
}

function MusicPanel(){
 const {music}=useFocus(),[draft,setDraft]=useState(''),[error,setError]=useState(''),[results,setResults]=useState<Track[]>([]),[searching,setSearching]=useState(false),canSearch=!!searchKey();
 const search=useRef<AbortController|null>(null),history=useHistory(),picks=forYou(history).slice(0,8);
 async function submit(e:React.FormEvent){
  e.preventDefault();const text=draft.trim();if(!text)return;setError('');
  const link=parseYouTube(text);
  if(link){playMusic(link.video,{list:link.list,queue:[]});setDraft('');return;}
  if(!canSearch){setError('Paste a YouTube video or playlist link.');return;}
  search.current?.abort();const ctrl=new AbortController();search.current=ctrl;setSearching(true);
  try{const found=await searchYouTube(text,undefined,ctrl.signal);setResults(found);if(!found.length)setError('No videos found. Try other words.');}
  catch(err){if(!ctrl.signal.aborted)setError(err instanceof Error?err.message:'Search failed.');}
  finally{if(search.current===ctrl)setSearching(false);}
 }
 function playMix(){const mix=myMix(history);if(mix.length)playMusic(mix[0].id,{queue:mix.slice(1).map(l=>l.id),titles:Object.fromEntries(mix.map(l=>[l.id,l.title]))});}
 function playPick(i:number){playMusic(picks[i].id,{queue:[...picks.slice(i+1),...picks.slice(0,i)].map(l=>l.id),titles:Object.fromEntries(picks.map(l=>[l.id,l.title]))});}
 function play(i:number){const t=results[i];playMusic(t.id,{queue:results.slice(i+1).map(r=>r.id),titles:Object.fromEntries(results.map(r=>[r.id,r.title]))});}
 return <Panel title="Music" icon={<Music size={16}/>}>
  <div className="chips">{genres.map(([label,id])=><button key={id} aria-pressed={music.video===id} className={music.video===id?'active':''} onClick={()=>playMusic(id)}>{label}</button>)}</div>
  {music.playing?<button className="music-play" onClick={stopMusic}><X size={14}/>Stop music</button>:<button className="primary music-play" onClick={()=>playMusic()}><Play size={14}/>Play music</button>}
  <form className="music-form" onSubmit={e=>void submit(e)}><input aria-label={canSearch?'Search YouTube or paste a link':'YouTube link'} placeholder={canSearch?'Search YouTube or paste a link…':'Paste a YouTube or playlist link…'} value={draft} onChange={e=>setDraft(e.target.value)}/><button disabled={searching}>{canSearch?<Search size={14}/>:null}{searching?'…':canSearch?'Search':'Play'}</button></form>
  {error&&<p className="focus-small" role="alert">{error}</p>}
  {picks.length>0&&<section className="for-you" aria-label="For you">
   <header><h3><History size={13}/>For you</h3><button className="soft" onClick={playMix}><Shuffle size={13}/>Play my mix</button></header>
   <ul className="music-results">{picks.map((l,i)=><li key={l.id}><button className={music.video===l.id?'active':''} onClick={()=>playPick(i)} title={l.title}><i className="thumb" aria-hidden="true" style={{backgroundImage:`url("https://i.ytimg.com/vi/${l.id}/default.jpg")`}}/><span><strong>{l.title}</strong><small>{l.liked?'♥ Favourite · ':''}Played {l.plays}×</small></span></button>
    <button className={'pick-like'+(l.liked?' liked':'')} aria-label={l.liked?'Remove from favourites':'Add to favourites'} aria-pressed={l.liked} onClick={()=>toggleLike(l.id,l.title)}><Heart size={13}/></button>
    <button className="pick-like" aria-label={'Forget '+l.title} title="Remove from history" onClick={()=>forget(l.id)}><X size={13}/></button></li>)}</ul>
   <button className="text-button" onClick={()=>{if(confirm('Clear your listening history and favourites?'))clearHistory();}}>Clear history</button>
  </section>}
  {results.length>0&&<ul className="music-results" aria-label="Search results">{results.map((r,i)=><li key={r.id}><button className={music.video===r.id?'active':''} onClick={()=>play(i)} title={r.title}><i className="thumb" aria-hidden="true" style={r.thumb?{backgroundImage:`url("${r.thumb}")`}:undefined}/><span><strong>{r.title}</strong><small>{r.channel}</small></span></button></li>)}</ul>}
  <p className="subtle focus-small">Use ⏮ ⏭ on the player to change videos; it moves on by itself when one ends, and YouTube’s suggestions appear when you pause. Music keeps going in other modes and MCVN dashboards. {canSearch?'Searches are sent to YouTube (Google).':''} Your listening history stays in this browser. YouTube never receives your documents or boards.</p>
 </Panel>;
}

const positions:[number,number,string][]=[[0,0,'Top left'],[50,0,'Top'],[100,0,'Top right'],[0,50,'Left'],[50,50,'Center'],[100,50,'Right'],[0,100,'Bottom left'],[50,100,'Bottom'],[100,100,'Bottom right']];
async function shrinkImage(file:File){
 const url=URL.createObjectURL(file);
 try{const img=new Image();img.src=url;await img.decode();const {width,height}=scaledSize(img.naturalWidth,img.naturalHeight);
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas is unavailable.');ctx.drawImage(img,0,0,width,height);
  const webp=canvas.toDataURL('image/webp',.85);return webp.startsWith('data:image/webp')?webp:canvas.toDataURL('image/jpeg',.85);}
 finally{URL.revokeObjectURL(url);}
}
function BackgroundPanel({background,setBackground,customImage,setCustomImage,onClose}:{background:Background;setBackground:React.Dispatch<React.SetStateAction<Background>>;customImage:string;setCustomImage:(v:string)=>void;onClose:()=>void}){
 const [suggested,setSuggested]=useState<Fit|null>(null),[message,setMessage]=useState(''),input=useRef<HTMLInputElement>(null),autoFit=useRef(false);
 const url=background.picture==='custom'?customImage:background.picture?pictureURL(background.picture):'';
 const set=(change:Partial<Background>)=>setBackground(b=>({...b,...change}));
 // Suggest a fit from the picture's shape versus the timer area; a newly chosen picture uses the suggestion straight away.
 useEffect(()=>{if(!url)return;let live=true;const img=new Image();img.onload=()=>{if(!live)return;const area=document.querySelector('.focus-main')?.getBoundingClientRect();const fit=suggestFit(img.naturalWidth,img.naturalHeight,area?.width??0,area?.height??0);setSuggested(fit);if(autoFit.current){autoFit.current=false;setBackground(b=>({...b,fit,size:100,x:50,y:50}));}};img.src=url;return()=>{live=false;};},[url,setBackground]);
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[onClose]);
 function choose(picture:string){autoFit.current=!!picture;setSuggested(null);set({picture});}
 async function upload(file:File){
  if(!file.type.startsWith('image/')){setMessage('Choose a PNG, JPG, WebP or GIF image.');return;}
  if(file.size>25*1024*1024){setMessage('Choose an image smaller than 25 MB.');return;}
  try{const data=await shrinkImage(file);setCustomImage(data);choose('custom');setMessage(pref.set('focus-background-image',data)?'':'This image is too large to keep after reload. It is used for now only.');}
  catch{setMessage('Could not open this image.');}
 }
 const fitLabel=(f:Fit)=>fits.find(([id])=>id===f)?.[1];
 return <section className="menu bg-panel" role="dialog" aria-label="Background">
  <header><h2>Background</h2><button aria-label="Close background settings" onClick={onClose}><X size={16}/></button></header>
  <div className="bg-grid">
   <button className={background.picture===''?'selected':''} aria-pressed={background.picture===''} onClick={()=>choose('')}><Ban size={18}/><span>None</span></button>
   {pictures.map(([id,label])=><button key={id} className={background.picture===id?'selected':''} aria-pressed={background.picture===id} style={{backgroundImage:`url("${pictureURL(id)}")`}} onClick={()=>choose(id)}><span>{label}</span></button>)}
   {customImage&&<button className={background.picture==='custom'?'selected':''} aria-pressed={background.picture==='custom'} style={{backgroundImage:`url("${customImage}")`}} onClick={()=>choose('custom')}><span>Your image</span></button>}
   <button className="bg-upload" onClick={()=>input.current?.click()}><Upload size={18}/><span>Upload</span></button>
  </div>
  <input ref={input} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>{const f=e.target.files?.[0];e.target.value='';if(f)void upload(f);}}/>
  {customImage&&<button className="text-button" onClick={()=>{setCustomImage('');pref.set('focus-background-image','');if(background.picture==='custom')choose('');}}>Remove your image</button>}
  {message&&<p className="focus-small" role="alert">{message}</p>}
  {url&&<>
   <h3>How the picture fits</h3>
   {suggested&&<p className="bg-suggest"><Sparkles size={13}/>Suggested: <strong>{fitLabel(suggested)}</strong>{background.fit!==suggested&&<button onClick={()=>set({fit:suggested,size:100,x:50,y:50})}>Use</button>}</p>}
   <div className="chips">{fits.map(([id,label])=><button key={id} aria-pressed={background.fit===id} className={background.fit===id?'active':''} onClick={()=>set({fit:id})}>{label}{suggested===id&&<Sparkles size={11}/>}</button>)}</div>
   {background.fit==='custom'&&<label className="range-control"><span>Picture size<output>{background.size}%</output></span><input type="range" aria-label="Picture size" min={10} max={300} value={background.size} onChange={e=>set({size:Number(e.target.value)})}/></label>}
   {background.fit!=='fill'&&<><h3>Position</h3><div className="bg-position">{positions.map(([x,y,label])=><button key={label} aria-label={label} title={label} aria-pressed={background.x===x&&background.y===y} className={background.x===x&&background.y===y?'active':''} onClick={()=>set({x,y})}><i/></button>)}</div></>}
   <label className="range-control"><span>Soften picture<output>{background.dim}%</output></span><input type="range" aria-label="Soften picture" min={0} max={80} value={background.dim} onChange={e=>set({dim:Number(e.target.value)})}/></label>
   <button className="text-button" onClick={()=>set({fit:suggested??'cover',size:100,x:50,y:50,dim:defaultBackground.dim})}>Reset fit & position</button>
  </>}
  <p className="subtle focus-small">Uploads are resized to at most {MAX_SIDE}px and stay in this browser.</p>
 </section>;
}
