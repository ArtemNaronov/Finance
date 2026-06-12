import './config/env.js';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getGateLlmApiKey, getGateLlmBaseUrl, getGateLlmModel } from './config/gatellm-env.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import transactionsRouter from './routes/transactions.js';
import insightsRouter from './routes/insights.js';
import reportsRouter from './routes/reports.js';
import analyticsRouter from './routes/analytics.js';
import aiRouter from './routes/ai.js';
import categoriesRouter from './routes/categories.js';
import goalsRouter from './routes/goals.js';
import settingsRouter from './routes/settings.js';
import recurringRouter from './routes/recurring.js';
import budgetsRouter from './routes/budgets.js';
import dataRouter from './routes/data.js';
import searchRouter from './routes/search.js';
import remindersRouter from './routes/reminders.js';
import { dbPath } from './db/index.js';
import { applyDueRecurring } from './services/recurring.js';
import './db/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const APP_VERSION = process.env.APP_VERSION || '1.1.0';

const corsOrigins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) ?? [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'tauri://localhost',
  'http://tauri.localhost',
  'capacitor://localhost',
  'http://localhost',
  'http://127.0.0.1:3001',
];

function resolveClientDist(): string | null {
  const candidates = [
    process.env.CLIENT_DIST,
    path.resolve(__dirname, '../client-dist'),
    path.resolve(__dirname, '../../client/dist'),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const dir = path.resolve(candidate);
    if (fs.existsSync(path.join(dir, 'index.html'))) {
      return dir;
    }
  }
  return null;
}

const clientDist = resolveClientDist();

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    dbPath,
    gatellmConfigured: Boolean(getGateLlmApiKey()),
  });
});

app.get('/api/version', (_req, res) => {
  res.json({ version: APP_VERSION });
});

app.use('/api', authMiddleware);
app.use('/api/transactions', transactionsRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/recurring', recurringRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/data', dataRouter);
app.use('/api/search', searchRouter);
app.use('/api/reminders', remindersRouter);

if (clientDist) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_req, res, next) => {
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
  console.log(`[static] UI: ${clientDist}`);
} else if (process.env.SERVE_CLIENT === 'true') {
  console.error('[static] SERVE_CLIENT=true, но index.html не найден');
}

app.use(errorHandler);

const applied = applyDueRecurring();
if (applied > 0) {
  console.log(`[recurring] Создано повторяющихся операций: ${applied}`);
}

app.listen(Number(PORT), '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
  console.log(`Version: ${APP_VERSION} | DB: ${dbPath}`);
  console.log(
    `GateLLM: ${getGateLlmApiKey() ? 'ключ загружен' : 'ключ не найден'} | ${getGateLlmBaseUrl()} | ${getGateLlmModel()}`,
  );
  if (process.env.API_TOKEN) {
    console.log('[auth] API_TOKEN включён — запросы требуют Bearer-токен');
  }
});
