import {describe,it,expect,vi,beforeAll} from 'vitest';
import {db} from '../src/lib/db';
import {blankDoc,plainText,textDocument} from '../src/lib/models';
import {initialize,saveDocument,saveBoard,stageBoard,persistStagedBoard,removeBoard,backup,flush,parseBackup,importBackup,importBoard,validateBoardSnapshot} from '../src/lib/library';
import {toSnapshot,isLegacyBoard} from '../src/lib/board';
const envelope=(documents:unknown[]=[],boards:unknown[]=[])=>JSON.stringify({format:'my-space-backup',version:1,documents,boards});
beforeAll(async()=>{await initialize();});
describe('local data boundaries',()=>{
 it('persists document contents and restores them from IndexedDB',async()=>{const d=textDocument('hello\nworld','Note');saveDocument(d);await flush();expect((await db.documents.get(d.id))?.text).toBe('hello\nworld');expect(plainText(d.content)).toBe(d.text);});
 it('preserves in-memory edits when persistence fails',async()=>{const d=blankDoc();d.title='Unsaved but recoverable';const spy=vi.spyOn(db.documents,'put').mockRejectedValueOnce(new Error('quota'));saveDocument(d);await flush();expect(backup().documents.find(v=>v.id===d.id)?.title).toBe(d.title);spy.mockRestore();});
 it('rejects unknown versions, duplicate IDs, invalid document structures and unsafe links without writes',async()=>{const before=await db.documents.toArray();const d=blankDoc();for(const raw of [JSON.stringify({format:'my-space-backup',version:99,documents:[],boards:[]}),envelope([d,d]),envelope([{...d,content:{type:'doc',content:[{type:'text',text:'bad root'}]}}]),envelope([{...d,content:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'unsafe',marks:[{type:'link',attrs:{href:'javascript:alert(1)'}}]}]}]}}])])await expect(importBackup(raw)).rejects.toThrow();expect(await db.documents.toArray()).toEqual(before);});
 it('validates every board before writing any document',async()=>{const before=await db.documents.count();await expect(importBackup(envelope([blankDoc()],[{id:'bad',title:'Bad',updatedAt:0,snapshot:{document:{store:{},schema:{}}}}]))).rejects.toThrow();expect(await db.documents.count()).toBe(before);});
 it('imports valid backups as copies and never replaces existing documents',async()=>{const d=textDocument('keep me','Original');saveDocument(d);await flush();await importBackup(envelope([{...d,title:'Imported'}]));expect((await db.documents.get(d.id))?.title).toBe('Original');expect((await db.documents.toArray()).some(v=>v.id!==d.id&&v.title==='Imported')).toBe(true);});
 it('rolls back a whole import when the board write fails',async()=>{const before=await db.documents.count();const spy=vi.spyOn(db.boards,'bulkAdd').mockRejectedValueOnce(new Error('quota'));await expect(importBackup(envelope([blankDoc()],[{id:'valid',title:'Empty',snapshot:null,updatedAt:0}]))).rejects.toThrow();expect(await db.documents.count()).toBe(before);spy.mockRestore();});
 it('does not recreate a deleted board when a debounce cleanup fires',async()=>{const board={id:'delete-me',title:'Board',snapshot:null,updatedAt:0};saveBoard(board);stageBoard({...board,title:'Pending edit'});removeBoard(board.id);persistStagedBoard(board.id);await flush();expect(await db.boards.get(board.id)).toBeUndefined();expect(backup().boards.some(b=>b.id===board.id)).toBe(false);});
 it('validates Excalidraw snapshots and rejects embeds, unsafe links and remote images',async()=>{
  const png='data:image/png;base64,iVBORw0KGgo=';
  const snapshot=toSnapshot([{id:'a',type:'rectangle'},{id:'b',type:'image',fileId:'f1'},{id:'gone',type:'ellipse',isDeleted:true}],{viewBackgroundColor:'#ffffff'},{f1:{id:'f1',mimeType:'image/png',dataURL:png,created:1} as never,unused:{id:'unused'}});
  expect(snapshot.elements.map(e=>e.id)).toEqual(['a','b']);expect(Object.keys(snapshot.files)).toEqual(['f1']);
  expect(()=>validateBoardSnapshot(snapshot as never)).not.toThrow();
  for(const bad of [{...snapshot,elements:[{id:'e',type:'embeddable'}]},{...snapshot,elements:[{id:'l',type:'rectangle',link:'javascript:alert(1)'}]},{...snapshot,files:{f1:{id:'f1',mimeType:'image/png',dataURL:'https://evil.example/x.png',created:1}}},{...snapshot,files:{f1:{id:'f1',mimeType:'image/svg+xml',dataURL:'data:image/svg+xml;base64,AA==',created:1}}},{...snapshot,elements:[{id:'d',type:'text'},{id:'d',type:'text'}]},{document:{store:{}}}])expect(()=>validateBoardSnapshot(bad as never)).toThrow();
  expect(isLegacyBoard({document:{}})).toBe(true);expect(isLegacyBoard(snapshot as never)).toBe(false);expect(isLegacyBoard(null)).toBe(false);
  const imported=await importBoard(JSON.stringify({format:'my-space-board',version:1,board:{id:'old',title:'Drawn',snapshot,updatedAt:0}}));expect(imported.id).not.toBe('old');await flush();
 });
 it('safely treats Markdown and HTML-like text as literal content',async()=>{const doc=textDocument('<img src=x onerror=alert(1)>\n# Heading','Safe import');expect((await parseBackup(envelope([doc]))).documents[0].text).toBe(doc.text);});
});
