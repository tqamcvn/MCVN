export const backgrounds=[['Ocean','#185565','#75b787'],['Sunset','#ffb96b','#e866ba'],['Lagoon','#1aa0bd','#9be9c0'],['Peach','#ffcdb3','#ffb2cb'],['Violet','#824dff','#ce83f1'],['Forest','#214c4a','#6aaa83'],['Apricot','#ffd066','#ff9e89'],['Midnight','#142f3e','#214d59'],['Lavender','#b7caff','#e7b5ec'],['Lime','#d0ee74','#9ee4b4'],['Sky','#9cc9ff','#e4b9f0'],['Paper','#f3f3f1','#f3f3f1'],['Ink','#161616','#161616'],['Transparent','transparent','transparent']] as const;
export type FrameOptions={background:number;ratio:string;padding:number;roundness:number;shadow:number;scale:number;chrome:string;watermark:string};
export const defaults:FrameOptions={background:0,ratio:'Auto',padding:8,roundness:24,shadow:35,scale:100,chrome:'light',watermark:''};
export function dimensions(imageWidth:number,imageHeight:number,o:FrameOptions){
 const ratio:Record<string,number>={'16:9':16/9,'4:3':4/3,'1:1':1,'9:16':9/16,'1.91:1':1.91};
 if(ratio[o.ratio]){const r=ratio[o.ratio];return r>=1?{width:1600,height:Math.round(1600/r)}:{width:Math.round(1600*r),height:1600};}
 const factor=Math.min(1,2400/imageWidth,2400/imageHeight);const w=imageWidth*factor,h=imageHeight*factor;const pad=Math.max(w,h)*o.padding/100;
 return {width:Math.ceil(w+pad*2),height:Math.ceil(h+pad*2+(o.chrome==='none'?0:44))};
}
export function renderFrame(canvas:HTMLCanvasElement,image:HTMLImageElement,o:FrameOptions){
 const {width,height}=dimensions(image.naturalWidth,image.naturalHeight,o);canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas is unavailable.');
 ctx.clearRect(0,0,width,height);const bg=backgrounds[o.background]??backgrounds[0];
 if(bg[1]!=='transparent'){const gradient=ctx.createLinearGradient(0,0,width,height);gradient.addColorStop(0,bg[1]);gradient.addColorStop(1,bg[2]);ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);}
 const padding=Math.min(width,height)*o.padding/100;const chrome=o.chrome==='none'?0:Math.min(44,height*.07);
 const fit=Math.min((width-padding*2)/image.naturalWidth,(height-padding*2-chrome)/image.naturalHeight)*o.scale/100;
 const w=Math.max(1,image.naturalWidth*fit),h=Math.max(1,image.naturalHeight*fit),x=(width-w)/2,y=(height-h-chrome)/2,r=Math.min(o.roundness,w/2,(h+chrome)/2);
 ctx.save();ctx.shadowColor=`rgba(0,0,0,${o.shadow/150})`;ctx.shadowBlur=o.shadow;ctx.shadowOffsetY=o.shadow/3;ctx.fillStyle=o.chrome==='dark'?'#24272b':'#fff';ctx.beginPath();ctx.roundRect(x,y,w,h+chrome,r);ctx.fill();ctx.restore();
 ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h+chrome,r);ctx.clip();ctx.fillStyle=o.chrome==='dark'?'#292b30':'#f0f0f2';ctx.fillRect(x,y,w,chrome);ctx.drawImage(image,x,y+chrome,w,h);
 if(chrome){['#ff6059','#ffbd2e','#28c840'].forEach((color,i)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x+18+i*17,y+chrome/2,5,0,Math.PI*2);ctx.fill();});}
 ctx.restore();if(o.watermark){ctx.fillStyle=bg[0]==='Paper'?'#56635a':'#fff';ctx.font=`500 ${Math.max(16,width*.017)}px system-ui`;ctx.textAlign='right';ctx.textBaseline='bottom';ctx.fillText(o.watermark,width-24,height-16,width*.7);}
 return {width,height};
}
