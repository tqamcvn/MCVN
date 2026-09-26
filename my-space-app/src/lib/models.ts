import { z } from 'zod';
export type DocContent = {type:string;text?:string;attrs?:Record<string,unknown>;marks?:{type:string;attrs?:Record<string,unknown>}[];content?:DocContent[]};
export interface DocumentRecord { id:string; title:string; content:DocContent; text:string; updatedAt:number; }
export interface BoardRecord { id:string; title:string; snapshot:Record<string,unknown> | null; updatedAt:number; }
const id=z.string().min(1).max(100);
const timestamp=z.number().int().nonnegative();
const nodeNames=['doc','paragraph','text','heading','bulletList','orderedList','listItem','blockquote','codeBlock','hardBreak','horizontalRule'];
const markNames=['bold','italic','strike','code','underline','link','textStyle','highlight'];
const node:z.ZodType<DocContent>=z.lazy(()=>z.object({type:z.enum(nodeNames),text:z.string().optional(),attrs:z.record(z.string(),z.unknown()).optional(),marks:z.array(z.object({type:z.enum(markNames),attrs:z.record(z.string(),z.unknown()).optional()}).strict()).optional(),content:z.array(node).optional()}).strict());
export const documentSchema=z.object({id,title:z.string().max(300),content:node.refine(v=>v.type==='doc','Expected document root'),text:z.string(),updatedAt:timestamp}).strict();
export const boardSchema=z.object({id,title:z.string().max(300),snapshot:z.record(z.string(),z.unknown()).nullable(),updatedAt:timestamp}).strict();
export const backupSchema=z.object({format:z.literal('my-space-backup'),version:z.literal(1),documents:z.array(documentSchema).max(10000),boards:z.array(boardSchema).max(1000)}).strict();
export const boardExportSchema=z.object({format:z.literal('my-space-board'),version:z.literal(1),board:boardSchema}).strict();
export const blankDoc=():DocumentRecord=>({id:crypto.randomUUID(),title:'Untitled',content:{type:'doc',content:[{type:'paragraph'}]},text:'',updatedAt:Date.now()});
export const blankBoard=():BoardRecord=>({id:crypto.randomUUID(),title:'Untitled board',snapshot:null,updatedAt:Date.now()});
export function safeLink(value:unknown){if(typeof value!=='string')return false;try{const url=new URL(value);return ['http:','https:','mailto:'].includes(url.protocol);}catch{return false;}}
export function checkDocument(content:DocContent){
 let count=0;
 function walk(n:DocContent,depth:number){
  if(depth>50||++count>100000)throw new Error('Document is too complex.');
  if(n.type==='text'&&(typeof n.text!=='string'||n.content))throw new Error('Invalid text node.');
  if(n.type==='heading'&&![1,2,3,4,5,6].includes(Number(n.attrs?.level)))throw new Error('Invalid heading.');
  for(const m of n.marks??[]){
   if(m.type==='link'&&!safeLink(m.attrs?.href))throw new Error('Unsafe link in document.');
   for(const [key,value] of Object.entries(m.attrs??{})){if(['color','backgroundColor'].includes(key)&&(typeof value!=='string'||!/^#[0-9a-f]{3,8}$/i.test(value)))throw new Error('Invalid color.');}
  }
  (n.content??[]).forEach(c=>walk(c,depth+1));
 }
 walk(content,0);
}
export function plainText(content:DocContent):string{if(content.type==='text')return content.text??'';return (content.content??[]).map(plainText).join(['doc','bulletList','orderedList'].includes(content.type)?'\n':'');}
export function textDocument(text:string,title:string){const doc=blankDoc();doc.title=title.slice(0,300);doc.text=text;doc.content={type:'doc',content:text.split(/\r?\n/).map(line=>({type:'paragraph',...(line?{content:[{type:'text',text:line}]}:{})}))};return doc;}
