// Background for the Work timer area: preset pictures from qamcvnfocus or the user's own image, with fit/size/position.
import {pref} from './preferences';

export type Fit='cover'|'contain'|'fill'|'tile'|'custom';
export type Background={picture:string;fit:Fit;size:number;x:number;y:number;dim:number};

export const pictures=[['nature','Nature'],['sunset','Sunset'],['clouds','Clouds'],['ocean','Ocean'],['night','Night sky'],['rain','Rain'],['cat','Cat'],['dog','Dog'],['panda','Panda'],['bunny','Bunny']] as const;
export const fits:[Fit,string][]=[['cover','Fill area'],['contain','Whole image'],['fill','Stretch'],['tile','Tile'],['custom','Custom size']];
export const defaultBackground:Background={picture:'',fit:'cover',size:100,x:50,y:50,dim:20};
/** Custom uploads are downscaled so they fit in browser storage. */
export const MAX_SIDE=2560;

const clamp=(v:unknown,min:number,max:number,fallback:number)=>typeof v==='number'&&Number.isFinite(v)?Math.round(Math.max(min,Math.min(max,v))):fallback;
export function cleanBackground(value:unknown):Background{
 if(!value||typeof value!=='object')return defaultBackground;
 const b=value as Partial<Background>;
 const picture=b.picture==='custom'||pictures.some(([id])=>id===b.picture)?b.picture as string:'';
 return {picture,fit:fits.some(([f])=>f===b.fit)?b.fit as Fit:'cover',size:clamp(b.size,10,300,100),x:clamp(b.x,0,100,50),y:clamp(b.y,0,100,50),dim:clamp(b.dim,0,80,20)};
}
export function loadBackground(){try{return cleanBackground(JSON.parse(pref.get('focus-background','null')));}catch{return defaultBackground;}}
export const pictureURL=(id:string)=>`${process.env.NEXT_PUBLIC_BASE_PATH||''}/focus-bg/bg-${id}.jpg`;

/**
 * Suggests how to fit an image into the timer area:
 * small images tile, images whose shape differs a lot from the area are shown whole,
 * and everything else fills the area (cropping a little at the edges).
 */
export function suggestFit(imageW:number,imageH:number,areaW:number,areaH:number):Fit{
 if(!imageW||!imageH||!areaW||!areaH)return 'cover';
 if(imageW<areaW/2&&imageH<areaH/2)return 'tile';
 const ratio=(imageW/imageH)/(areaW/areaH);
 return ratio>2.2||ratio<1/2.2?'contain':'cover';
}
export function backgroundStyle(b:Background,url:string){
 const size={cover:'cover',contain:'contain',fill:'100% 100%',tile:'auto',custom:`${b.size}% auto`}[b.fit];
 return {backgroundImage:`url("${url}")`,backgroundSize:size,backgroundRepeat:b.fit==='tile'?'repeat':'no-repeat',backgroundPosition:`${b.x}% ${b.y}%`};
}
export function scaledSize(w:number,h:number,max=MAX_SIDE){const k=Math.min(1,max/Math.max(w,h));return {width:Math.round(w*k),height:Math.round(h*k)};}
