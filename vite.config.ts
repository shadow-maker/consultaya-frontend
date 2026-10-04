import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin, type ProxyOptions } from 'vite';
import { defineConfig } from 'vitest/config';

const require = createRequire(import.meta.url);

/**
 * Sirve el service worker de MSW solo durante `npm run dev`.
 * Así `public/` y `dist/` nunca contienen archivos de los mocks.
 */
function mswWorkerSoloDev(): Plugin {
  return {
    name: 'consultaya-msw-worker',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/mockServiceWorker.js', (_req, res) => {
        const ruta = join(dirname(require.resolve('msw/package.json')), 'lib', 'mockServiceWorker.js');
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Service-Worker-Allowed', '/');
        res.end(readFileSync(ruta));
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const docker = env.VITE_BACKEND === 'docker';

  const proxy: Record<string, ProxyOptions> = docker
    ? { '/api': { target: 'http://localhost:8080', changeOrigin: true } }
    : {
        '/api/usuarios': { target: 'http://localhost:8001', changeOrigin: true },
        '/api/lecciones': { target: 'http://localhost:8002', changeOrigin: true },
        '/api/progreso': { target: 'http://localhost:8003', changeOrigin: true },
      };

  return {
    plugins: [react(), mswWorkerSoloDev()],
    server: { port: 5173, strictPort: true, proxy },
    preview: { port: 5173, strictPort: true },
    test: {
      environment: 'jsdom',
      environmentOptions: { jsdom: { url: 'http://localhost:3000/' } },
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      restoreMocks: true,
    },
  };
});
