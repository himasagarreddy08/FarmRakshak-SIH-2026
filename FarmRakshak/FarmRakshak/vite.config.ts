import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, Plugin } from 'vite';
import { app as expressApp } from './server/chat';

const port = Number(process.env.PORT || 5173);
const basePath = process.env.BASE_PATH || '/';

const rakshakApiPlugin = (): Plugin => ({
  name: 'rakshak-api-middleware',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url || '';
      if (
        url.startsWith('/api/chat') ||
        url.startsWith('/api/assistant') ||
        url.startsWith('/api/health') ||
        url.startsWith('/api/scan')
      ) {
        expressApp(req, res, next);
      } else {
        next();
      }
    });
  },
});

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    rakshakApiPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api/farm-state': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/api/plant-scan': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/api/predict': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/api/risk': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/api/recommendation': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/api/product-suitability': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/api/regional-overview': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/api/educator-cases': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/api/admin': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});

