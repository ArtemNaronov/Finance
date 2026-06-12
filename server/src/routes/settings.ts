import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getAllSettings, setSetting, deleteSetting } from '../services/settings.js';

const router = Router();

router.get(
  '/',
  asyncHandler((_req, res) => {
    res.json(getAllSettings());
  }),
);

router.put(
  '/:key',
  asyncHandler((req, res) => {
    const key = String(req.params.key);
    const value = String(req.body?.value ?? '');
    setSetting(key, value);
    res.json({ key, value });
  }),
);

router.delete(
  '/:key',
  asyncHandler((req, res) => {
    if (!deleteSetting(String(req.params.key))) {
      res.status(404).json({ error: 'Настройка не найдена' });
      return;
    }
    res.status(204).send();
  }),
);

export default router;
