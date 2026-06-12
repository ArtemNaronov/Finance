import type { RequestHandler } from 'express';

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export function createRateLimiter(maxRequests: number, windowMs: number): RequestHandler {
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const bucket = buckets.get(key) ?? { timestamps: [] };
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

    if (bucket.timestamps.length >= maxRequests) {
      res.status(429).json({ error: 'Слишком много запросов. Попробуйте позже.' });
      return;
    }

    bucket.timestamps.push(now);
    buckets.set(key, bucket);
    next();
  };
}

export const aiRateLimit = createRateLimiter(15, 60_000);
