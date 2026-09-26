// YouTube helpers for the Work music player: what to embed, how to control it, and optional search.
export type Track={id:string;title:string;channel?:string;thumb?:string};
/** What the player plays: one video followed by a queue, or a whole YouTube playlist. */
export type Music={video:string;queue:string[];list:string;titles:Record<string,string>;playing:boolean};

const listId=(v:string)=>/^[\w-]{10,64}$/.test(v)?v:'';
/** Reads a YouTube link: a video (watch, youtu.be, shorts, live, embed), a playlist (?list=), or both. */
export function parseYouTube(value:string):{video:string;list:string}|null{
 const text=value.trim();
 if(/^[\w-]{11}$/.test(text))return {video:text,list:''};
 let url:URL;try{url=new URL(text);}catch{return null;}
 if(!/(^|\.)youtube(-nocookie)?\.com$|^youtu\.be$/.test(url.hostname))return null;
 const video=url.hostname==='youtu.be'?url.pathname.slice(1,12):url.searchParams.get('v')??url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1]??'';
 const list=listId(url.searchParams.get('list')??'');
 const ok=/^[\w-]{11}$/.test(video);
 return ok||list?{video:ok?video:'',list}:null;
}

/**
 * Embed URL. `playlist=` gives the player its own previous/next buttons and plays the queue in order;
 * YouTube's suggestions appear when it pauses or finishes. enablejsapi lets the dock send "next"/"previous".
 */
export function embedURL(m:Music,origin:string){
 const base='https://www.youtube-nocookie.com/embed/';
 const common=`autoplay=1&enablejsapi=1&playsinline=1&origin=${encodeURIComponent(origin)}`;
 if(m.list)return `${base}${m.video||'videoseries'}?list=${m.list}&${common}`;
 // With `playlist=` YouTube plays only that list, so the chosen video must come first.
 const queue=m.queue.filter(id=>id!==m.video).slice(0,49);
 return `${base}${m.video}?${common}${queue.length?`&playlist=${[m.video,...queue].join(',')}`:''}`;
}
/** Sends a YouTube IFrame Player API command through postMessage (no YouTube script is loaded into My Space). */
export function playerCommand(frame:HTMLIFrameElement|null,func:'nextVideo'|'previousVideo'|'playVideo'|'pauseVideo'){
 frame?.contentWindow?.postMessage(JSON.stringify({event:'command',func,args:[]}),'https://www.youtube-nocookie.com');
}

export const searchKey=()=>process.env.NEXT_PUBLIC_YOUTUBE_API_KEY||'';
function decode(text:string){const el=document.createElement('textarea');el.innerHTML=text;return el.value;}
type SearchItem={id?:{videoId?:string};snippet?:{title?:string;channelTitle?:string;thumbnails?:{default?:{url?:string}}}};
/** YouTube Data API v3 search (needs a referrer-restricted key; each search uses 100 of the key's 10,000 daily units). */
export async function searchYouTube(query:string,key=searchKey(),signal?:AbortSignal):Promise<Track[]>{
 const params=new URLSearchParams({part:'snippet',type:'video',videoEmbeddable:'true',maxResults:'15',safeSearch:'moderate',q:query.slice(0,200),key});
 const res=await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`,{signal,referrerPolicy:'strict-origin-when-cross-origin'});
 if(!res.ok)throw new Error(res.status===403?'YouTube search limit reached for today. Paste a link instead.':'YouTube search is unavailable right now.');
 const data=await res.json() as {items?:SearchItem[]};
 return (data.items??[]).filter(i=>/^[\w-]{11}$/.test(i.id?.videoId??'')).map(i=>({id:i.id!.videoId!,title:decode(i.snippet?.title??''),channel:decode(i.snippet?.channelTitle??''),thumb:i.snippet?.thumbnails?.default?.url}));
}
