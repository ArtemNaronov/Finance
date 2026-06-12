import { Router } from 'express';
import { chatWithAI } from '../services/gatellm.js';
import { buildAIContext } from '../services/statistics.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { aiRateLimit } from '../middleware/rateLimit.js';
import { getApiToken } from '../middleware/auth.js';
import { parseNonEmptyString } from '../shared/validate.js';

const router = Router();

router.use(aiRateLimit);

router.post(
  '/chat',
  asyncHandler(async (req, res) => {
    const message = parseNonEmptyString(req.body?.message, 'message', 4000);
    const context = buildAIContext();
    const reply = await chatWithAI(message, context);
    res.json({ reply });
  }),
);

router.get(
  '/context',
  asyncHandler((_req, res) => {
    if (getApiToken()) {
      res.status(403).json({ error: 'Контекст доступен только при авторизации через API' });
      return;
    }
    res.json({ context: buildAIContext() });
  }),
);

export default router;
