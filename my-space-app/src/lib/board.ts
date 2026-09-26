// Board snapshots for Create (Excalidraw). Validated with plain zod so imports can be checked before anything is written.
import {z} from 'zod';
import {safeLink} from './models';

const imageTypes=['image/png','image/jpeg','image/webp','image/gif'] as const;
// Web embeds/iframes are left out on purpose: boards stay local and never load third-party pages.
const elementTypes=['rectangle','diamond','ellipse','arrow','line','freedraw','text','image','frame'] as const;
const element=z.object({
 id:z.string().min(1).max(100),
 type:z.enum(elementTypes),
 isDeleted:z.boolean().optional(),
 link:z.string().nullable().optional().refine(v=>v==null||safeLink(v),'Unsafe link on board element.'),
 fileId:z.string().max(100).nullable().optional(),
}).passthrough();
const file=z.object({
 id:z.string().min(1).max(100),
 mimeType:z.enum(imageTypes),
 dataURL:z.string().regex(/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/,'Board images must be embedded PNG, JPEG, WebP or GIF.'),
 created:z.number(),
}).passthrough();
export const boardSnapshotSchema=z.object({
 kind:z.literal('excalidraw'),
 version:z.literal(1),
 elements:z.array(element).max(50000),
 appState:z.object({viewBackgroundColor:z.string().regex(/^(#[0-9a-f]{3,8}|transparent)$/i).optional(),gridModeEnabled:z.boolean().optional()}).strict(),
 files:z.record(z.string(),file),
}).strict();
export type BoardSnapshot=z.infer<typeof boardSnapshotSchema>;

export function validateBoardSnapshot(snapshot:Record<string,unknown>|null){
 if(snapshot===null)return;
 const s=boardSnapshotSchema.parse(snapshot);
 if(new Set(s.elements.map(e=>e.id)).size!==s.elements.length)throw new Error('Duplicate board element IDs.');
 for(const [id,f] of Object.entries(s.files))if(f.id!==id)throw new Error('Mismatched board file ID.');
}
/** Boards saved by the earlier tldraw canvas cannot be opened by Excalidraw. */
export const isLegacyBoard=(snapshot:Record<string,unknown>|null)=>snapshot!==null&&snapshot.kind!=='excalidraw';

type SceneElement={id:string;isDeleted?:boolean;fileId?:string|null;type:string};
/** Keeps only what a board needs: live elements, the files they use, and background/grid settings. */
export function toSnapshot(elements:readonly SceneElement[],appState:{viewBackgroundColor?:string;gridModeEnabled?:boolean},files:Record<string,{id:string}>):BoardSnapshot{
 const live=elements.filter(e=>!e.isDeleted&&(elementTypes as readonly string[]).includes(e.type));
 const used=new Set(live.map(e=>e.fileId).filter(Boolean));
 return {kind:'excalidraw',version:1,elements:live as BoardSnapshot['elements'],appState:{viewBackgroundColor:appState.viewBackgroundColor,gridModeEnabled:appState.gridModeEnabled},
  files:Object.fromEntries(Object.entries(files).filter(([id])=>used.has(id))) as BoardSnapshot['files']};
}
