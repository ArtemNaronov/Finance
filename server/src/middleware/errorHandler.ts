import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ValidationError } from '../shared/validate.js';

export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message });
    return;
  }

  console.error('[error]', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
};
