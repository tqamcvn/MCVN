import type { Metadata } from 'next';
import { Shell } from '@/components/shell';
import './globals.css';
export const metadata: Metadata = {title:'My Space · MCVN',description:'A quiet, local space to write, create and focus.'};
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="en"><body><Shell>{children}</Shell></body></html>;}
