import { Router } from 'express';
import {
  addContribution,
  archiveGoal,
  createGoal,
  deleteGoal,
  getAllGoals,
  getGoalById,
  updateGoal,
} from '../services/goals.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  parseGoalCreateBody,
  parseGoalUpdateBody,
  parsePositiveAmount,
  parseDate,
  parseOptionalString,
} from '../shared/validate.js';

const router = Router();

function paramId(id: string | string[]): string {
  return Array.isArray(id) ? id[0] : id;
}

router.get(
  '/',
  asyncHandler((req, res) => {
    const includeArchived = req.query.includeArchived === 'true';
    res.json(getAllGoals(includeArchived));
  }),
);

router.get(
  '/:id',
  asyncHandler((req, res) => {
    const goal = getGoalById(paramId(req.params.id));
    if (!goal) {
      res.status(404).json({ error: 'Цель не найдена' });
      return;
    }
    res.json(goal);
  }),
);

router.post(
  '/',
  asyncHandler((req, res) => {
    const input = parseGoalCreateBody(req.body);
    const goal = createGoal(input);
    res.status(201).json(goal);
  }),
);

router.put(
  '/:id',
  asyncHandler((req, res) => {
    const input = parseGoalUpdateBody(req.body);
    const goal = updateGoal(paramId(req.params.id), input);
    if (!goal) {
      res.status(404).json({ error: 'Цель не найдена' });
      return;
    }
    res.json(goal);
  }),
);

router.delete(
  '/:id',
  asyncHandler((req, res) => {
    if (!deleteGoal(paramId(req.params.id))) {
      res.status(404).json({ error: 'Цель не найдена' });
      return;
    }
    res.status(204).send();
  }),
);

router.post(
  '/:id/contribute',
  asyncHandler((req, res) => {
    const amount = parsePositiveAmount(req.body?.amount);
    const date = parseDate(req.body?.date);
    const comment = parseOptionalString(req.body?.comment);

    const goal = addContribution(paramId(req.params.id), { amount, date, comment });
    if (!goal) {
      res.status(404).json({ error: 'Цель не найдена' });
      return;
    }

    res.status(201).json(goal);
  }),
);

router.post(
  '/:id/archive',
  asyncHandler((req, res) => {
    const archived = req.body?.archived !== false;
    const goal = archiveGoal(paramId(req.params.id), archived);
    if (!goal) {
      res.status(404).json({ error: 'Цель не найдена' });
      return;
    }
    res.json(goal);
  }),
);

export default router;
