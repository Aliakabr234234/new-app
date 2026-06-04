import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';

const loginLimiter = new RateLimiterMemory({
  points: 10, // 10 attempts
  duration: 15 * 60, // per 15 minutes
  blockDuration: 15 * 60, // block for 15 minutes
});

export async function loginRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    await loginLimiter.consume(ip);
    next();
  } catch (error) {
    res.status(429).json({
      error: 'Too many login attempts. Please try again in 15 minutes.',
    });
  }
}
