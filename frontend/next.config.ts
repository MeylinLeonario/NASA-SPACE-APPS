// frontend/next.config.ts
import type { NextConfig } from 'next';

const configuredBackend = process.env.BACKEND_URL?.trim();

if (process.env.VERCEL && !configuredBackend) {
  throw new Error('Set BACKEND_URL in Vercel to the HTTPS origin of the Python backend before deploying.');
}

const backend = new URL(configuredBackend || 'http://127.0.0.1:8000');
if (
  !['http:', 'https:'].includes(backend.protocol) ||
  backend.username || backend.password || backend.search || backend.hash ||
  backend.pathname !== '/'
) {
  throw new Error('BACKEND_URL must be an HTTP(S) origin without credentials, path, query or fragment.');
}
if (process.env.VERCEL && (
  backend.protocol !== 'https:' ||
  ['localhost', '127.0.0.1', '[::1]'].includes(backend.hostname)
)) {
  throw new Error('BACKEND_URL must point to a deployed HTTPS backend on Vercel.');
}
const BACKEND_URL = backend.origin;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${BACKEND_URL}/health`,
      },
    ];
  },
};

export default nextConfig;
