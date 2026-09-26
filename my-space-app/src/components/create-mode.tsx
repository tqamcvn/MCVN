'use client';
import {memo,useEffect,useRef,useState} from 'react';
import {Excalidraw,MainMenu,hashElementsVersion} from '@excalidraw/excalidraw';
import type {ExcalidrawElement} from '@excalidraw/excalidraw/element/types';
import type {AppState,BinaryFiles,ExcalidrawInitialDataState} from '@excalidraw/excalidraw/types';
import '@excalidraw/excalidraw/index.css';
import {Plus,Upload,Download,Trash2,Search,PanelLeftClose,PanelLeftOpen} from 'lucide-react';
import {useLibrary,saveBoard,stageBoardSnapshot,persistStagedBoard,removeBoard,importBoard,backup} from '@/lib/library';
import {blankBoard,type BoardRecord} from '@/lib/models';
import {isLegacyBoard,toSnapshot,type BoardSnapshot} from '@/lib/board';
import {jsonDownload,filename} from '@/lib/download';
import {pref} from '@/lib/preferences';
// Fonts are self-hosted under /excalidraw/fonts (copied by scripts/assets.mjs) so the canvas never calls a CDN.
if(typeof window!=='undefined')(window as unknown as {EXCALIDRAW_ASSET_PATH:string}).EXCALIDRAW_ASSET_PATH=location.origin+(process.env.NEXT_PUBLIC_BASE_PATH||'')+'/excalidraw/';
const uiOptions={canvasActions:{loadScene:false,saveToActiveFile:false,toggleTheme:null,export:{saveFileToDisk:true}}};
const noEmbeds=()=>false;

function useDashboardTheme(){
 const [dark,setDark]=useState(()=>document.documentElement.classList.contains('theme-dark'));
 useEffect(()=>{const observer=new MutationObserver(()=>setDark(document.documentElement.classList.contains('theme-dark')));observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});return()=>observer.disconnect();},[]);
 return dark?'dark':'light';
}

const Canvas=memo(function Canvas({board,theme}:{board:BoardRecord;theme:'light'|'dark'}){
 const [initial]=useState<ExcalidrawInitialDataState|null>(()=>{const s=board.snapshot as BoardSnapshot|null;return s?{elements:s.elements as unknown as ExcalidrawElement[],appState:s.appState,files:s.files as unknown as BinaryFiles,scrollToContent:true}:null;});
 const id=board.id,timer=useRef<ReturnType<typeof setTimeout>|null>(null),seen=useRef('');
 useEffect(()=>()=>{if(timer.current){clearTimeout(timer.current);timer.current=null;persistStagedBoard(id);}},[id]);
 // onChange also fires for pointer moves and scrolling, so only drawing changes, background/grid and images are saved.
 function onChange(elements:readonly ExcalidrawElement[],appState:AppState,files:BinaryFiles){
  const key=`${hashElementsVersion(elements)}|${appState.viewBackgroundColor}|${appState.gridModeEnabled}|${Object.keys(files).length}`;
  if(!seen.current){seen.current=key;return;}
  if(key===seen.current)return;
  seen.current=key;
  stageBoardSnapshot(id,toSnapshot(elements,appState,files) as unknown as Record<string,unknown>);
  if(timer.current)clearTimeout(timer.current);
  timer.current=setTimeout(()=>{timer.current=null;persistStagedBoard(id);},500);
 }
 return <Excalidraw initialData={initial} onChange={onChange} theme={theme} UIOptions={uiOptions} validateEmbeddable={noEmbeds}>
  <MainMenu><MainMenu.DefaultItems.SaveAsImage/><MainMenu.DefaultItems.Export/><MainMenu.DefaultItems.ClearCanvas/><MainMenu.Separator/><MainMenu.DefaultItems.ChangeCanvasBackground/><MainMenu.DefaultItems.Help/></MainMenu>
 </Excalidraw>;
},(a,b)=>a.board.id===b.board.id&&a.theme===b.theme);

export default function CreateMode(){
 const library=useLibrary(),theme=useDashboardTheme();const [id,setId]=useState(''),[collapsed,setCollapsed]=useState(false),[query,setQuery]=useState(''),[message,setMessage]=useState('');const file=useRef<HTMLInputElement>(null);
 useEffect(()=>{if(library.ready&&!id){setId(library.boards.find(b=>b.id===pref.get('board'))?.id||library.boards[0]?.id||'');}},[library.ready,library.boards,id]);
 const board=library.boards.find(b=>b.id===id);
 function select(value:string){setId(value);pref.set('board',value);}
 function create(){const next=blankBoard();saveBoard(next);select(next.id);}
 return <div className={'library-layout '+(collapsed?'library-collapsed':'')}><aside className="library"><div className="library-heading"><h1>Boards</h1><button className="soft" disabled={!library.ready} onClick={create}><Plus size={16}/>New</button></div><label className="search"><Search size={16}/><input aria-label="Search boards" placeholder="Find a board…" value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="library-items">{library.boards.filter(b=>b.title.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>b.updatedAt-a.updatedAt).map(b=><button className={'library-item '+(id===b.id?'selected':'')} key={b.id} onClick={()=>select(b.id)}><strong>{b.title||'Untitled board'}</strong><span>{new Date(b.updatedAt).toLocaleDateString()}</span></button>)}</div><div className="library-footer"><button onClick={()=>file.current?.click()}><Upload size={16}/>Import board</button><button onClick={()=>jsonDownload(backup(),'my-space-backup.json')}><Download size={16}/>Backup all</button><p>Stored only in this browser.<br/>Image and PNG export are in the canvas menu.</p></div></aside><section className="editor-pane"><header className="toolbar"><button title="Toggle board library" aria-label="Toggle board library" onClick={()=>setCollapsed(!collapsed)}>{collapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}</button>{board&&<input className="board-title" aria-label="Board title" maxLength={300} value={board.title} onChange={e=>saveBoard({...board,title:e.target.value,updatedAt:Date.now()})}/>}<div className="toolbar-actions">{board&&<><button title="Export board JSON" onClick={()=>jsonDownload({format:'my-space-board',version:1,board},filename(board.title)+'.json')}><Download size={16}/><span>Export JSON</span></button><button title="Delete board" aria-label="Delete board" onClick={()=>{if(confirm('Delete this board? Export a copy first if you need it.')){removeBoard(board.id);setId('');}}}><Trash2 size={17}/></button></>}</div></header>{message&&<div className="inline-message" role="alert">{message}<button onClick={()=>setMessage('')} aria-label="Dismiss message">×</button></div>}{board&&isLegacyBoard(board.snapshot)?<div className="empty"><span className="eyebrow">OLDER BOARD</span><h2>This board uses the previous canvas.</h2><p>It can’t be opened in the new editor. Export it as JSON to keep a copy, or delete it and start a new board.</p><button className="primary" onClick={create}><Plus size={17}/>New board</button></div>:board?<div className="canvas"><div className="canvas-host"><Canvas key={board.id} board={board} theme={theme}/></div></div>:<div className="empty"><span className="eyebrow">THINK OUTSIDE THE LINES</span><h2>Give your ideas some room.</h2><p>An open canvas for sketches, maps, and happy accidents.</p><button className="primary" disabled={!library.ready} onClick={create}><Plus size={17}/>New board</button></div>}</section><input ref={file} type="file" accept=".json" hidden onChange={async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;try{if(f.size>100*1024*1024)throw new Error('Board exceeds 100 MB.');const next=await importBoard(await f.text());select(next.id);}catch(e){setMessage('Import rejected. '+(e instanceof Error?e.message:'Invalid board.'));}}}/></div>;
}
