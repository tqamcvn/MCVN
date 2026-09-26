export const prompts=[
 {title:'A letter to your future self',detail:'Write a short note to yourself six months from now. What do you hope you remember?',mode:'write',minutes:10},
 {title:'Draw the shape of your day',detail:'Use only lines and three colors to show how today feels. There is no right answer.',mode:'create',minutes:5},
 {title:'Five ordinary things',detail:'Notice five everyday objects. Describe each without using its name.',mode:'write',minutes:8},
 {title:'An idea, in a diagram',detail:'Choose something you want to understand. Map it with circles, arrows and a few words.',mode:'create',minutes:10},
 {title:'A tiny story',detail:'Write a complete story in exactly fifty words. Begin with an unexpected sound.',mode:'write',minutes:10},
 {title:'Give a moment a frame',detail:'Take a screenshot of something you made. Give it a background that matches its mood.',mode:'frame',minutes:5},
 {title:'Make space for one thing',detail:'Choose one small task you have been avoiding. Spend ten focused minutes on it.',mode:'work',minutes:10},
 {title:'A better question',detail:'Write down a problem, then turn it into five different questions. Follow the most interesting one.',mode:'write',minutes:8},
 {title:'Invent a little place',detail:'Sketch a room where you would love to think. Include one impossible detail.',mode:'create',minutes:10},
 {title:'What went well?',detail:'Write three things that went well recently, and one thing each taught you.',mode:'write',minutes:5},
 {title:'Something from nothing',detail:'Draw six random dots. Turn them into a creature, a city, or a constellation.',mode:'create',minutes:5},
 {title:'A small manifesto',detail:'Write five sentences beginning with “I want to make…” Keep them specific.',mode:'write',minutes:8}
] as const;
export function dayKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function promptFor(date:Date){return prompts[Math.floor(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000)%prompts.length];}
export function streak(days:string[],today=new Date()){const cursor=new Date(today);let count=0;if(!days.includes(dayKey(cursor)))cursor.setDate(cursor.getDate()-1);while(days.includes(dayKey(cursor))){count++;cursor.setDate(cursor.getDate()-1);}return count;}
