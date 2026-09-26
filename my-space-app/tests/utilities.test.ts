import {describe,it,expect} from 'vitest';
import {dayKey,streak,promptFor} from '../src/lib/challenges';
import {dimensions,defaults} from '../src/lib/frame';
describe('daily prompts',()=>{it('uses local calendar dates and stable daily prompts',()=>{const d=new Date(2026,8,26,23,55);expect(dayKey(d)).toBe('2026-09-26');expect(promptFor(d)).toEqual(promptFor(new Date(2026,8,26,0,1)));});it('counts consecutive days allowing an unfinished today',()=>{expect(streak(['2026-09-24','2026-09-25'],new Date(2026,8,26))).toBe(2);expect(streak(['2026-09-24','2026-09-26'],new Date(2026,8,26))).toBe(1);});});
describe('frame',()=>{it('keeps export dimensions bounded and aspect ratios exact',()=>{expect(dimensions(10000,10000,defaults).width).toBeLessThan(4096);const d=dimensions(600,400,{...defaults,ratio:'16:9'});expect(d.width/d.height).toBeCloseTo(16/9);});});
