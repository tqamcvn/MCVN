'use client';
import {memo,useCallback,useEffect,useRef,useState} from 'react';
import {Tldraw,getSnapshot,inlineBase64AssetStore,type Editor,type TLEditorSnapshot,type TLUiOverrides} from 'tldraw';
import {getAssetUrls} from '@tldraw/assets/selfHosted';
import 'tldraw/tldraw.css';
import {Plus,Upload,Download,Trash2,Search,PanelLeftClose,PanelLeftOpen} from 'lucide-react';
import {useLibrary,saveBoard,stageBoard,persistStagedBoard,removeBoard,importBoard,backup} from '@/lib/library';
import {blankBoard,type BoardRecord} from '@/lib/models';
import {jsonDownload,filename} from '@/lib/download';
import {pref} from '@/lib/preferences';
const assets=getAssetUrls({baseUrl:(process.env.NEXT_PUBLIC_BASE_PATH||'')+'/tldraw/'});
const imageTypes=['image/png','image/jpeg','image/webp','image/gif'];
const videoTypes:string[]=[];
const overrides:TLUiOverrides={actions(_editor,actions){const next={...actions};delete next['insert-embed'];delete next['convert-to-embed'];return next;}};
const Canvas=memo(function Canvas({board}:{board:BoardRecord}){
 const [initial]=useState(board.snapshot);
 const latest=useRef(board),editor=useRef<Editor|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),dispose=useRef<(()=>void)|null>(null);
 useEffect(()=>{latest.current=board;},[board]);
 useEffect(()=>()=>{dispose.current?.();if(timer.current){clearTimeout(timer.current);timer.current=null;persistStagedBoard(latest.current.id);}},[]);
 const onMount=useCallback((e:Editor)=>{  editor.current=e;
  e.registerExternalAssetHandler('url',null);
  e.registerExternalContentHandler('url',async()=>{});
  if(!latest.current.snapshot){const next={...latest.current,snapshot:getSnapshot(e.store) as unknown as Record<string,unknown>};latest.current=next;saveBoard(next);}
  dispose.current=e.store.listen(()=>{
   const next={...latest.current,snapshot:getSnapshot(e.store) as unknown as Record<string,unknown>,updatedAt:Date.now()};latest.current=next;stageBoard(next);
   if(timer.current)clearTimeout(timer.current);
   timer.current=setTimeout(()=>{timer.current=null;persistStagedBoard(latest.current.id);},500);
  },{scope:'all'});
 },[]);
 return <Tldraw assetUrls={assets} assets={inlineBase64AssetStore} licenseKey={process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY||undefined} snapshot={initial as unknown as TLEditorSnapshot ?? undefined} overrides={overrides} acceptedImageMimeTypes={imageTypes} acceptedVideoMimeTypes={videoTypes} onMount={onMount}/>;
},(a,b)=>a.board.id===b.board.id&&a.board.title===b.board.title); 
export default function CreateMode(){
 const library=useLibrary();const [id,setId]=useState(''),[collapsed,setCollapsed]=useState(false),[query,setQuery]=useState(''),[message,setMessage]=useState('');const file=useRef<HTMLInputElement>(null);
 useEffect(()=>{if(library.ready&&!id){setId(library.boards.find(b=>b.id===pref.get('board'))?.id||library.boards[0]?.id||'');}},[library.ready,library.boards,id]);
 const board=library.boards.find(b=>b.id===id);
 function select(value:string){setId(value);pref.set('board',value);}
 function create(){const next=blankBoard();saveBoard(next);select(next.id);}
 return <div className={'library-layout '+(collapsed?'library-collapsed':'')}><aside className="library"><div className="library-heading"><h1>Boards</h1><button className="soft" disabled={!library.ready} onClick={create}><Plus size={16}/>New</button></div><label className="search"><Search size={16}/><input aria-label="Search boards" placeholder="Find a board…" value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="library-items">{library.boards.filter(b=>b.title.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>b.updatedAt-a.updatedAt).map(b=><button className={'library-item '+(id===b.id?'selected':'')} key={b.id} onClick={()=>select(b.id)}><strong>{b.title||'Untitled board'}</strong><span>{new Date(b.updatedAt).toLocaleDateString()}</span></button>)}</div><div className="library-footer"><button onClick={()=>file.current?.click()}><Upload size={16}/>Import board</button><button onClick={()=>jsonDownload(backup(),'my-space-backup.json')}><Download size={16}/>Backup all</button><p>Stored only in this browser.<br/>Image and PNG export are in the canvas menu.</p></div></aside><section className="editor-pane"><header className="toolbar"><button title="Toggle board library" aria-label="Toggle board library" onClick={()=>setCollapsed(!collapsed)}>{collapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}</button>{board&&<input className="board-title" aria-label="Board title" maxLength={300} value={board.title} onChange={e=>saveBoard({...board,title:e.target.value,updatedAt:Date.now()})}/>}<div className="toolbar-actions">{board&&<><button title="Export board JSON" onClick={()=>jsonDownload({format:'my-space-board',version:1,board},filename(board.title)+'.json')}><Download size={16}/><span>Export JSON</span></button><button title="Delete board" aria-label="Delete board" onClick={()=>{if(confirm('Delete this board? Export a copy first if you need it.')){removeBoard(board.id);setId('');}}}><Trash2 size={17}/></button></>}</div></header>{message&&<div className="inline-message" role="alert">{message}<button onClick={()=>setMessage('')} aria-label="Dismiss message">×</button></div>}{process.env.NODE_ENV==='production'&&!process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY&&<div className="inline-message">Create requires a tldraw production license key. Board backup and import remain available.</div>}{board?<div className="canvas"><Canvas key={board.id} board={board}/></div>:<div className="empty"><span className="eyebrow">THINK OUTSIDE THE LINES</span><h2>Give your ideas some room.</h2><p>An open canvas for sketches, maps, and happy accidents.</p><button className="primary" disabled={!library.ready} onClick={create}><Plus size={17}/>New board</button></div>}</section><input ref={file} type="file" accept=".json" hidden onChange={async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;try{if(f.size>100*1024*1024)throw new Error('Board exceeds 100 MB.');const next=await importBoard(await f.text());select(next.id);}catch(e){setMessage('Import rejected. '+(e instanceof Error?e.message:'Invalid board.'));}}}/></div>;
}
