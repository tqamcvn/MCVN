'use client';
import dynamic from 'next/dynamic';
const Mode=dynamic(()=>import('@/components/write-mode'),{ssr:false,loading:()=> <div className="empty" role="status">Loading write…</div>});
export default function Page(){return <Mode/>;}
