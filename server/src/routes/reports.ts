import { Router } from 'express';
import dayjs from 'dayjs';
import 'dayjs/locale/ru.js';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { generateMonthlyReport } from '../services/gatellm.js';
import { buildAIContext, getMonthStats } from '../services/statistics.js';
import type { MonthlyReport } from '../types/index.js';

dayjs.locale('ru');

const router = Router();

router.get('/', (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM monthly_reports ORDER BY year DESC, month DESC')
    .all();
  res.json(rows);
});

router.get('/:year/:month', (req, res) => {
  const { year, month } = req.params;
  const row = db
    .prepare('SELECT * FROM monthly_reports WHERE year = ? AND month = ?')
    .get(Number(year), Number(month));
  if (!row) {
    res.status(404).json({ error: 'Отчёт не найден' });
    return;
  }
  res.json(row);
});

router.post('/generate', async (req, res) => {
  try {
    const month = Number(req.body.month) || dayjs().subtract(1, 'month').month() + 1;
    const year = Number(req.body.year) || dayjs().subtract(1, 'month').year();

    const existing = db
      .prepare('SELECT * FROM monthly_reports WHERE month = ? AND year = ?')
      .get(month, year);

    if (existing) {
      res.json(existing);
      return;
    }

    const monthName = dayjs(`${year}-${month}-01`).format('MMMM YYYY');
    const stats = getMonthStats(month, year);
    const context = buildAIContext();

    const reportData = await generateMonthlyReport(
      `${context}\n\n=== ОТЧЁТ ЗА ${monthName.toUpperCase()} ===\nДоход: ${stats.income}\nРасход: ${stats.expense}\nОстаток: ${stats.balance}`,
      monthName,
    );

    const report: MonthlyReport = {
      id: uuidv4(),
      month,
      year,
      summary: reportData.summary,
      recommendations: reportData.recommendations,
      createdAt: new Date().toISOString(),
    };

    db.prepare(
      `INSERT INTO monthly_reports (id, month, year, summary, recommendations, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(report.id, report.month, report.year, report.summary, report.recommendations, report.createdAt);

    res.status(201).json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка генерации отчёта' });
  }
});

export default router;
