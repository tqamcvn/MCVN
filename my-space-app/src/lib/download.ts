export function download(data:BlobPart,name:string,type='application/json'){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
export function filename(title:string){return title.replace(/[^\p{L}\p{N}_ -]/gu,'').trim().slice(0,80)||'Untitled';}
export function jsonDownload(data:unknown,name:string){download(JSON.stringify(data,null,2),name);}
