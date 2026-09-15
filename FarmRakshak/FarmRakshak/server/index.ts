import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat';
import scanRouter from './routes/scan';
import requestLogger from './middleware/logger';
import errorHandler from './middleware/error';

// Auto-load .env file if present
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch {}

export const app = express();
const PORT = Number(process.env.PORT || 5000);

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(requestLogger);

// Mount API routes
app.use('/api', chatRouter);
app.use('/api', scanRouter);

// Error handling middleware
app.use(errorHandler);

// Standalone server execution
const isDirectScript = process.argv[1]?.replace(/\\/g, '/').endsWith('server/index.ts') || process.env.RUN_SERVER === 'true';
if (isDirectScript && !process.env.VITE_DEV_SERVER) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Rakshak Backend] Server running on http://localhost:${PORT}`);
    console.log(`[Rakshak Backend] Connected to Google Gemini 2.5 Flash Engine`);
  });
}

export default app;

