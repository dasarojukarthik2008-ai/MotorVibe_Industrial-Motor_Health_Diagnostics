import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(projectRoot, '.env');
const envPort = existsSync(envPath)
  ? readFileSync(envPath, 'utf8').match(/^\s*PORT\s*=\s*["']?(\d+)["']?\s*(?:#.*)?$/m)?.[1]
  : null;

export default defineConfig(() => {
  const backendTarget = `http://127.0.0.1:${process.env.PORT || envPort || 5000}`;

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/socket.io': {
          target: backendTarget,
          ws: true,
        },
      },
    },
  };
});
