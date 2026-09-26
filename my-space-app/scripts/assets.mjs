import { cp,mkdir,rm } from 'node:fs/promises';
// Self-host Excalidraw's fonts so the canvas never falls back to a CDN.
await rm('public/excalidraw',{recursive:true,force:true});
await mkdir('public/excalidraw',{recursive:true});
await cp('node_modules/@excalidraw/excalidraw/dist/prod/fonts','public/excalidraw/fonts',{recursive:true});
