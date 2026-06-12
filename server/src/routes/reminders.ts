import { Router } from 'express';
import dayjs from 'dayjs';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getCreditReminders, getMonthEndHint } from '../services/reminders.js';
import { getCurrentMonthStats } from '../services/statistics.js';

const router = Router();

router.get(
  '/credits',
  asyncHandler((_req, res) => {
    res.json(getCreditReminders());
  }),
);

router.get(
  '/month-end',
  asyncHandler((_req, res) => {
    const stats = getCurrentMonthStats();
    const daysLeft = dayjs().endOf('month').diff(dayjs(), 'day');
    res.json({
      hint: getMonthEndHint(stats.balance, daysLeft),
      daysLeft,
      balance: stats.balance,
    });
  }),
);

export default router;
