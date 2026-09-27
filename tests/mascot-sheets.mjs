import { test } from 'node:test';
import assert from 'node:assert/strict';
import { measureFrames } from '../lantern-companion/mascot-sheets.mjs';
function atlas() {
  const pixels=new Uint8ClampedArray(1024*1536*4);
  for(let row=0;row<6;row++)for(let col=0;col<3;col++)for(let y=row*256+30;y<row*256+220;y++)for(let x=Math.round(col*1024/3)+80;x<Math.round(col*1024/3)+240;x++)pixels[(y*1024+x)*4+3]=255;
  return pixels;
}
test('finds 18 separate frames and their bounds',()=>{const frames=measureFrames(atlas(),1024,1536);assert.equal(frames.length,18);assert.equal(frames[0].width,160);assert.equal(frames[17].height,190);});
test('rejects incorrect atlas resolution',()=>assert.throws(()=>measureFrames(new Uint8Array(4),1,1)));
test('rejects empty frames',()=>assert.throws(()=>measureFrames(new Uint8ClampedArray(1024*1536*4),1024,1536)));
test('rejects opaque backgrounds',()=>{const pixels=atlas();for(let i=3;i<pixels.length;i+=4)pixels[i]=255;assert.throws(()=>measureFrames(pixels,1024,1536));});
test('rejects clipped character at a cell edge',()=>{const pixels=atlas();pixels[(100*1024)*4+3]=255;assert.throws(()=>measureFrames(pixels,1024,1536));});
test('rejects disproportionate frames',()=>{const pixels=atlas();for(let y=31;y<220;y++)for(let x=80;x<240;x++)pixels[(y*1024+x)*4+3]=0;assert.throws(()=>measureFrames(pixels,1024,1536));});
