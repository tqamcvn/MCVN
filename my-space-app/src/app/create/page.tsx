'use client';
import dynamic from 'next/dynamic';
const Mode=dynamic(()=>import('@/components/create-mode'),{ssr:false,loading:()=> <div className="empty" role="status">Loading create…</div>});
export default function Page(){return <Mode/>;}
