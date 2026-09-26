import {execFileSync} from 'node:child_process';
import {mkdir,cp} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('..'),out=path.join(root,'.site');
await mkdir(out,{recursive:true});
const files=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
for(const file of files){if(file.startsWith('my-space-app/')||file.startsWith('.')&&file!=='.nojekyll'||file.startsWith('tests/')||file.startsWith('ui/')||file.startsWith('supabase/')||file.startsWith('recap-bot/'))continue;const dest=path.join(out,file);await mkdir(path.dirname(dest),{recursive:true});await cp(path.join(root,file),dest);}
await cp(path.join(root,'my-space'),path.join(out,'my-space'),{recursive:true});
console.log('Complete MCVN static site: '+out);
