import type { RequestHandler } from 'express';

export function getApiToken(): string | undefined {
  return process.env.API_TOKEN?.trim() || undefined;
}

/** Если задан API_TOKEN — требует Bearer-токен для всех /api маршрутов кроме /health */
export const authMiddleware: RequestHandler = (req, res, next) => {
  const token = getApiToken();
  if (!token) return next();

  const auth = req.headers.authorization;
  if (auth === `Bearer ${token}`) return next();

  res.status(401).json({ error: 'Требуется авторизация' });
};
