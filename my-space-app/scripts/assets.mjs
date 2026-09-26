import { cp,mkdir } from 'node:fs/promises';
await mkdir('public/tldraw',{recursive:true});
for(const folder of ['fonts','icons','translations','embed-icons']) await cp('node_modules/@tldraw/assets/'+folder,'public/tldraw/'+folder,{recursive:true});
