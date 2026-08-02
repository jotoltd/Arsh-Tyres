import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory rate limiter for Vercel serverless functions
// Each function instance has its own memory, so this is approximate per-instance limiting
// For production-grade limiting, use Upstash Redis or Vercel Edge Middleware

const stores = new Map<string, Map<string, number[]>>();

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyFn?: (req: VercelRequest) => string;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, keyFn } = options;

  return function(req: VercelRequest, res: VercelResponse): boolean {
    const storeName = `${maxRequests}x${windowMs}`;
    if (!stores.has(storeName)) stores.set(storeName, new Map());
    const store = stores.get(storeName)!;

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || (req.headers['x-real-ip'] as string)
      || 'unknown';
    const key = keyFn ? keyFn(req) : ip;

    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create timestamps array for this key
    let timestamps = store.get(key) || [];
    // Filter out expired entries
    timestamps = timestamps.filter(ts => ts > windowStart);

    if (timestamps.length >= maxRequests) {
      res.status(429).json({
        error: 'Too many requests. Please try again in a moment.',
        retryAfter: Math.ceil(windowMs / 1000),
      });
      return false;
    }

    timestamps.push(now);
    store.set(key, timestamps);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(maxRequests - timestamps.length));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil((windowStart + windowMs) / 1000)));

    return true;
  };
}

// Pre-configured limiters
export const strictLimit = rateLimit({ windowMs: 60_000, maxRequests: 5 });
export const standardLimit = rateLimit({ windowMs: 60_000, maxRequests: 20 });
export const relaxedLimit = rateLimit({ windowMs: 60_000, maxRequests: 60 });
