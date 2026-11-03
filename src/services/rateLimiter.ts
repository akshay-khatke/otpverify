import { logger } from '../utils';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export class RateLimitError extends Error {
  public retryAfterSeconds: number;
  public remaining: number;

  constructor(message: string, retryAfterSeconds: number, remaining: number = 0) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
    this.remaining = remaining;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export const RATE_LIMIT_RULES: Record<string, RateLimitConfig> = {
  SEND_OTP: {
    maxRequests: 3,
    windowMs: 60 * 1000,
  },
  VERIFY_OTP: {
    maxRequests: 5,
    windowMs: 60 * 1000,
  },
  DEFAULT: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
};

class ClientRateLimiter {
  private timestamps: Map<string, number[]> = new Map();

  public checkLimit(
    key: string,
    config: RateLimitConfig = RATE_LIMIT_RULES.DEFAULT
  ): {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
  } {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const currentTimestamps = (this.timestamps.get(key) || []).filter(
      (time) => time > windowStart
    );
    this.timestamps.set(key, currentTimestamps);

    if (currentTimestamps.length >= config.maxRequests) {
      const oldestTimestamp = currentTimestamps[0];
      const waitTimeMs = oldestTimestamp + config.windowMs - now;
      const retryAfterSeconds = Math.max(1, Math.ceil(waitTimeMs / 1000));

      logger.warn(
        'RateLimiter',
        `Rate limit reached for [${key}]. Retry after ${retryAfterSeconds}s`
      );

      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - currentTimestamps.length,
      retryAfterSeconds: 0,
    };
  }


  public recordRequest(key: string): void {
    const now = Date.now();
    const list = this.timestamps.get(key) || [];
    list.push(now);
    this.timestamps.set(key, list);
  }


  public assertAllowed(
    key: string,
    config: RateLimitConfig = RATE_LIMIT_RULES.DEFAULT
  ): void {
    const status = this.checkLimit(key, config);
    if (!status.allowed) {
      throw new RateLimitError(
        `Too many attempts. Please wait ${status.retryAfterSeconds} seconds before trying again.`,
        status.retryAfterSeconds,
        status.remaining
      );
    }
    this.recordRequest(key);
  }


  public getRemainingTime(
    key: string,
    config: RateLimitConfig = RATE_LIMIT_RULES.DEFAULT
  ): number {
    const status = this.checkLimit(key, config);
    return status.allowed ? 0 : status.retryAfterSeconds;
  }


  public reset(key: string): void {
    this.timestamps.delete(key);
    logger.info('RateLimiter', `Rate limit reset for [${key}]`);
  }
}

export const rateLimiter = new ClientRateLimiter();

