import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rootEnv = path.resolve(__dirname, '../../../.env');
const serverEnv = path.resolve(__dirname, '../../.env');

const loaded: string[] = [];

if (fs.existsSync(serverEnv)) {
  dotenv.config({ path: serverEnv });
  loaded.push(serverEnv);
}

// Корневой .env имеет приоритет (как основной источник настроек)
if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv, override: true });
  loaded.push(rootEnv);
}

if (loaded.length) {
  console.info(`[env] Загружено: ${loaded.join(' → ')}`);
} else {
  console.warn('[env] .env не найден (ожидается finance/.env)');
}
