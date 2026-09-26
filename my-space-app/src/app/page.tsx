'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { pref } from '@/lib/preferences';
export default function Home(){const router=useRouter();useEffect(()=>{const last=pref.get('mode','write');router.replace('/'+(['write','create','work','frame','challenge'].includes(last)?last:'write'));},[router]);return <div className="empty">Opening your space…</div>;}
