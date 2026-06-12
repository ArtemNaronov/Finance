import { Router } from 'express';
import dayjs from 'dayjs';
import {
  computeCodeRecommendations,
  getAnalytics,
  getMonthStats,
  getMonthsStatsEndingAt,
} from '../services/statistics.js';
import { generateRecommendations } from '../services/gatellm.js';
import { buildAIContext } from '../services/statistics.js';
import { getCreditReminders, getMonthEndHint } from '../services/reminders.js';
import { getBudgetStatus } from '../services/budgets.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get(
  '/dashboard',
  asyncHandler((req, res) => {
    const now = dayjs();
    const month = req.query.month ? Number(req.query.month) : now.month() + 1;
    const year = req.query.year ? Number(req.query.year) : now.year();

    const current = getMonthStats(month, year);
    const prev = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).subtract(1, 'month');
    const previous = getMonthStats(prev.month() + 1, prev.year());
    const monthly = getMonthsStatsEndingAt(month, year, 6).reverse();

    const anchor = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
    const isCurrentMonth = anchor.isSame(now, 'month');
    const daysLeft = isCurrentMonth ? anchor.endOf('month').diff(now, 'day') : 0;

    res.json({
      current,
      previous,
      monthly,
      budgets: getBudgetStatus(month, year),
      creditReminders: isCurrentMonth ? getCreditReminders() : [],
      monthEndHint: isCurrentMonth ? getMonthEndHint(current.balance, daysLeft) : null,
      selectedMonth: { month, year },
    });
  }),
);

router.get('/full', (_req, res) => {
  res.json(getAnalytics());
});

router.get('/recommendations', async (_req, res) => {
  const codeRecs = computeCodeRecommendations();
  let aiRecs: { id: string; text: string; source: 'ai' }[] = [];

  try {
    const context = buildAIContext();
    const aiTexts = await generateRecommendations(context);
    aiRecs = aiTexts.map((text, i) => ({
      id: `ai-${i}`,
      text,
      source: 'ai' as const,
    }));
  } catch (e) {
    console.error('AI recommendations failed:', e);
  }

  res.json([...codeRecs, ...aiRecs].slice(0, 8));
});

export default router;
