import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: path.dirname(fileURLToPath(import.meta.url)) },
  // Loaded with Node's require at runtime instead of being bundled (native/binary-downloading packages).
  serverExternalPackages: ['mongoose', 'mongodb-memory-server'],
};

export default nextConfig;
