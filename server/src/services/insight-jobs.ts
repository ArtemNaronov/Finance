import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { generateInsight } from './gatellm.js';
import { buildInsightContext } from './statistics.js';
import type { Transaction } from '../types/index.js';

export function scheduleInsightGeneration(transaction: Transaction): void {
  setImmediate(async () => {
    try {
      const context = buildInsightContext(transaction);
      const insightText = await generateInsight(context);
      const insightId = uuidv4();
      db.prepare(
        'INSERT INTO insights (id, text, createdAt, transactionId) VALUES (?, ?, ?, ?)',
      ).run(insightId, insightText, new Date().toISOString(), transaction.id);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Ошибка генерации инсайта';
      console.error('[insight]', message);
    }
  });
}
