'use client';
import { useSyncExternalStore } from 'react';
import {db} from './db';
import {backupSchema,boardExportSchema,checkDocument,plainText,type DocumentRecord,type BoardRecord} from './models';
import {validateBoardSnapshot} from './board';
export {validateBoardSnapshot};
export type LibraryState={documents:DocumentRecord[];boards:BoardRecord[];ready:boolean;error:string;saving:number};
let state:LibraryState={documents:[],boards:[],ready:false,error:'',saving:0};
const serverState=state;
const listeners=new Set<()=>void>();
function publish(change:Partial<LibraryState>){state={...state,...change};listeners.forEach(fn=>fn());}
let initPromise:Promise<void>|undefined;
export function initialize(){return initPromise??=(async()=>{try{const [documents,boards]=await Promise.all([db.documents.toArray(),db.boards.toArray()]);publish({documents,boards,ready:true});}catch{publish({ready:true,error:'Browser storage is unavailable. Keep working here and export a backup before closing this tab.'});}})();}
export function useLibrary(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};},()=>state,()=>serverState);}
let queue=Promise.resolve();
function persist(operation:()=>Promise<unknown>){publish({saving:state.saving+1});queue=queue.then(operation).then(()=>undefined).catch(()=>publish({error:'Your latest changes are still in memory, but could not be saved. Export a backup now.'})).finally(()=>publish({saving:state.saving-1}));return queue;}
export function saveDocument(doc:DocumentRecord){publish({documents:[doc,...state.documents.filter(d=>d.id!==doc.id)]});void persist(()=>db.documents.put(doc));}
export function stageBoard(board:BoardRecord){publish({boards:[board,...state.boards.filter(b=>b.id!==board.id)]});}
export function saveBoard(board:BoardRecord){stageBoard(board);void persist(()=>db.boards.put(board));}
/** Updates only the drawing, so a title edited meanwhile is never overwritten by the canvas. */
export function stageBoardSnapshot(id:string,snapshot:BoardRecord['snapshot']){const board=state.boards.find(b=>b.id===id);if(board)stageBoard({...board,snapshot,updatedAt:Date.now()});}
export function persistStagedBoard(id:string){const board=state.boards.find(b=>b.id===id);if(board)void persist(()=>db.boards.put(board));}
export function removeDocument(id:string){publish({documents:state.documents.filter(d=>d.id!==id)});void persist(()=>db.documents.delete(id));}
export function removeBoard(id:string){publish({boards:state.boards.filter(b=>b.id!==id)});void persist(()=>db.boards.delete(id));}
export function backup(){return {format:'my-space-backup',version:1,documents:state.documents,boards:state.boards};}
export function flush(){return queue;}
export async function parseBackup(text:string){
 if(text.length>100*1024*1024)throw new Error('Backup exceeds 100 MB.');
 const data=backupSchema.parse(JSON.parse(text));
 if(new Set(data.documents.map(d=>d.id)).size!==data.documents.length||new Set(data.boards.map(b=>b.id)).size!==data.boards.length)throw new Error('Duplicate IDs in backup.');
 data.documents.forEach(d=>{checkDocument(d.content);d.text=plainText(d.content);});
 if(data.documents.length){const {validateDocuments}=await import('./validate-documents');validateDocuments(data.documents);}
 data.boards.forEach(b=>validateBoardSnapshot(b.snapshot));
 return data;
}
export async function importBackup(text:string){
 const data=await parseBackup(text); // Complete validation before opening the write transaction.
 await flush();
 // Import as copies: existing records and in-memory unsaved edits are never overwritten.
 const documents=data.documents.map(d=>({...d,id:crypto.randomUUID()}));
 const boards=data.boards.map(b=>({...b,id:crypto.randomUUID()}));
 await db.transaction('rw',db.documents,db.boards,async()=>{await db.documents.bulkAdd(documents);await db.boards.bulkAdd(boards);});
 publish({documents:[...documents,...state.documents],boards:[...boards,...state.boards]});
}
export async function importBoard(text:string){
 if(text.length>100*1024*1024)throw new Error('Board exceeds 100 MB.');
 const data=boardExportSchema.parse(JSON.parse(text));validateBoardSnapshot(data.board.snapshot);
 const board={...data.board,id:crypto.randomUUID(),updatedAt:Date.now()};
 saveBoard(board);return board;
}
