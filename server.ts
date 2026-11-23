import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { attachApiRoutes } from './server/api.ts';

function resolvePort(): number {
  const portFlagIdx = process.argv.findIndex(arg => arg === '--port' || arg.startsWith('--port='));
  if (portFlagIdx !== -1) {
    const arg = process.argv[portFlagIdx];
    const raw = arg.includes('=') ? arg.split('=')[1] : process.argv[portFlagIdx + 1];
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  const envPort = Number(process.env.PORT || 0);
  if (envPort > 0 && String(envPort) !== process.env.NGINX_PORT) {
    return envPort;
  }
  return Number(process.env.DEFAULT_APP_PORT || 3000);
}

const PORT = resolvePort();

async function startServer() {
  const app = express();
  attachApiRoutes(app);

  if (process.env.NODE_ENV !== 'production') {
    const vitePromise = import('vite').then(({ createServer }) =>
      createServer({
        server: {
          middlewareMode: true,
          ...(process.env.DISABLE_HMR === 'true' ? { hmr: false } : {}),
        },
        appType: 'spa',
      })
    );
    vitePromise.catch(err => {
      console.error('Failed to initialize Vite dev middleware:', err);
    });

    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HAIROLOGY server running on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
