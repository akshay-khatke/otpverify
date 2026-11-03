import { logger } from '../utils';

export interface RateLimitConfig {
  maxRequests: number; // Maximum allowed requests
  windowMs: number;    // Time window in milliseconds (e.g. 60000ms = 1 min)
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

// Default presets for common actions
export const RATE_LIMIT_RULES: Record<string, RateLimitConfig> = {
  SEND_OTP: {
    maxRequests: 3,      // Max 3 OTP requests
    windowMs: 60 * 1000, // per 60 seconds
  },
  VERIFY_OTP: {
    maxRequests: 5,      // Max 5 verification attempts
    windowMs: 60 * 1000, // per 60 seconds
  },
  DEFAULT: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
};

class ClientRateLimiter {
  // Key -> Array of request timestamps (epoch ms)
  private timestamps: Map<string, number[]> = new Map();

  /**
   * Checks whether a request is allowed under the rate limit.
   */
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

    // Filter out timestamps outside the active sliding window
    const currentTimestamps = (this.timestamps.get(key) || []).filter(
      (time) => time > windowStart
    );
    this.timestamps.set(key, currentTimestamps);

    if (currentTimestamps.length >= config.maxRequests) {
      // Calculate how long user must wait until the oldest request in the window expires
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

  /**
   * Records a new request attempt at the current timestamp.
   */
  public recordRequest(key: string): void {
    const now = Date.now();
    const list = this.timestamps.get(key) || [];
    list.push(now);
    this.timestamps.set(key, list);
  }

  /**
   * Helper that checks the limit and records the request if allowed.
   * Throws a RateLimitError immediately if the limit is exceeded.
   */
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

  /**
   * Returns how many seconds the user must wait until allowed again (0 if not limited)
   */
  public getRemainingTime(
    key: string,
    config: RateLimitConfig = RATE_LIMIT_RULES.DEFAULT
  ): number {
    const status = this.checkLimit(key, config);
    return status.allowed ? 0 : status.retryAfterSeconds;
  }

  /**
   * Resets the attempts for a given key (e.g. upon successful verification).
   */
  public reset(key: string): void {
    this.timestamps.delete(key);
    logger.info('RateLimiter', `Rate limit reset for [${key}]`);
  }
}

export const rateLimiter = new ClientRateLimiter();

