import type { NextConfig } from 'next';
process.env.NEXT_TELEMETRY_DISABLED = '1';
const config: NextConfig = { devIndicators: false, output: 'export', trailingSlash: true, basePath: process.env.NEXT_PUBLIC_BASE_PATH || '', images: { unoptimized: true } };
export default config;
