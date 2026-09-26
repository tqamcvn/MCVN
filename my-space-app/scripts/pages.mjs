import {spawnSync} from 'node:child_process';
import {cp,mkdir,rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
const result=spawnSync(process.execPath,['node_modules/next/dist/bin/next','build'],{stdio:'inherit',env:{...process.env,NEXT_PUBLIC_BASE_PATH:'/my-space',NEXT_TELEMETRY_DISABLED:'1'}});
if(result.status!==0)process.exit(result.status??1);
// Keep hashed files from earlier builds: browsers may hold an older cached page for hours (Cloudflare max-age),
// and that page must still find its CSS/JS. Everything else is replaced by the new build.
const keep='../my-space/_next/static';
await rm('../.my-space-static',{recursive:true,force:true});
if(existsSync(keep))await cp(keep,'../.my-space-static',{recursive:true});
await rm('../my-space',{recursive:true,force:true});
await mkdir('../my-space',{recursive:true});
if(existsSync('../.my-space-static'))await cp('../.my-space-static','../my-space/_next/static',{recursive:true});
await rm('../.my-space-static',{recursive:true,force:true});
await cp('out','../my-space',{recursive:true});
console.log('Static app copied to ../my-space');
