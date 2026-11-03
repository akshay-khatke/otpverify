import {
  isValidPhoneNumber,
  isValidEmail,
  isValidOtp,
  maskIdentifier,
  checkIsTablet,
  scale,
  moderateScale,
} from '../src/utils';
import { rateLimiter, RATE_LIMIT_RULES, RateLimitError } from '../src/services/rateLimiter';
import { generateRandomOtp, getActiveOtp } from '../src/features/otp/api/otpApi';

describe('1. Validation Flow Tests', () => {
  test('TC-VAL-01: Validates correct 10-digit Indian phone numbers', () => {
    expect(isValidPhoneNumber('9876543210')).toBe(true);
    expect(isValidPhoneNumber('6123456789')).toBe(true);
    expect(isValidPhoneNumber('8999999999')).toBe(true);
  });

  test('TC-VAL-02: Rejects invalid phone numbers', () => {
    expect(isValidPhoneNumber('')).toBe(false);
    expect(isValidPhoneNumber('12345')).toBe(false); // too short
    expect(isValidPhoneNumber('98765432101')).toBe(false); // 11 digits
    expect(isValidPhoneNumber('98765abcde')).toBe(false); // non-numeric
    expect(isValidPhoneNumber(' 987654321 ')).toBe(false); // 9 digits
  });

  test('TC-VAL-03: Validates standard email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('john.doe@sub.company.org')).toBe(true);
    expect(isValidEmail('test+alias@gmail.com')).toBe(true);
  });

  test('TC-VAL-04: Rejects malformed email addresses', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('plainaddress')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('user@.com')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
  });

  test('TC-VAL-05: Validates exact 6-digit OTP format', () => {
    expect(isValidOtp('123456', 6)).toBe(true);
    expect(isValidOtp('000000', 6)).toBe(true);
    expect(isValidOtp('12345', 6)).toBe(false); // 5 digits
    expect(isValidOtp('1234567', 6)).toBe(false); // 7 digits
    expect(isValidOtp('12a456', 6)).toBe(false); // letters
  });
});

describe('2. Masking & Privacy Flow Tests', () => {
  test('TC-MSK-01: Correctly masks 10-digit mobile phone numbers with visible last 3 digits', () => {
    const masked = maskIdentifier('9876543736');
    expect(masked).toBe('+91 *******736');
  });

  test('TC-MSK-02: Correctly masks email addresses preserving first and last char', () => {
    const masked = maskIdentifier('john.doe@example.com');
    expect(masked).toBe('j******e@example.com');
  });

  test('TC-MSK-03: Handles edge cases and empty identifiers gracefully', () => {
    expect(maskIdentifier('')).toBe('');
    expect(maskIdentifier(null)).toBe('');
    expect(maskIdentifier('12')).toBe('+91 12');
  });
});

describe('3. Rate Limiting & "Too Many Attempts" Countdown Flow Tests', () => {
  const testId = `test_user_${Date.now()}`;

  beforeEach(() => {
    rateLimiter.reset(`VERIFY_OTP:${testId}`);
    rateLimiter.reset(`SEND_OTP:${testId}`);
  });

  test('TC-RL-01: Allows requests within max limit', () => {
    const status = rateLimiter.checkLimit(`VERIFY_OTP:${testId}`, RATE_LIMIT_RULES.VERIFY_OTP);
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(5);
    expect(status.retryAfterSeconds).toBe(0);
  });

  test('TC-RL-02: Decrements remaining attempts on each failure', () => {
    rateLimiter.recordRequest(`VERIFY_OTP:${testId}`);
    rateLimiter.recordRequest(`VERIFY_OTP:${testId}`);
    const status = rateLimiter.checkLimit(`VERIFY_OTP:${testId}`, RATE_LIMIT_RULES.VERIFY_OTP);
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(3);
  });

  test('TC-RL-03: Triggers RateLimitError after exceeding max attempts', () => {
    // Record 5 attempts (the maximum allowed)
    for (let i = 0; i < 5; i++) {
      rateLimiter.recordRequest(`VERIFY_OTP:${testId}`);
    }

    // 6th attempt should be blocked
    const status = rateLimiter.checkLimit(`VERIFY_OTP:${testId}`, RATE_LIMIT_RULES.VERIFY_OTP);
    expect(status.allowed).toBe(false);
    expect(status.remaining).toBe(0);
    expect(status.retryAfterSeconds).toBeGreaterThan(0);
    expect(status.retryAfterSeconds).toBeLessThanOrEqual(60);

    // assertAllowed must throw RateLimitError
    expect(() => {
      rateLimiter.assertAllowed(`VERIFY_OTP:${testId}`, RATE_LIMIT_RULES.VERIFY_OTP);
    }).toThrow(RateLimitError);
  });

  test('TC-RL-04: getRemainingTime returns active lockout cooldown', () => {
    for (let i = 0; i < 5; i++) {
      rateLimiter.recordRequest(`VERIFY_OTP:${testId}`);
    }
    const remainingTime = rateLimiter.getRemainingTime(`VERIFY_OTP:${testId}`, RATE_LIMIT_RULES.VERIFY_OTP);
    expect(remainingTime).toBeGreaterThan(0);
    expect(remainingTime).toBeLessThanOrEqual(60);
  });

  test('TC-RL-05: Resets lockout cleanly upon successful verification', () => {
    for (let i = 0; i < 5; i++) {
      rateLimiter.recordRequest(`VERIFY_OTP:${testId}`);
    }
    rateLimiter.reset(`VERIFY_OTP:${testId}`);
    const status = rateLimiter.checkLimit(`VERIFY_OTP:${testId}`, RATE_LIMIT_RULES.VERIFY_OTP);
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(5);
  });
});

describe('4. Dynamic OTP Generation Flow Tests', () => {
  test('TC-OTP-01: Generates random 6-digit numeric OTP', () => {
    const otp = generateRandomOtp('test_device_1');
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  test('TC-OTP-02: Retrieves active OTP consistently', () => {
    const otp1 = getActiveOtp('test_device_2');
    const otp2 = getActiveOtp('test_device_2');
    expect(otp1).toBe(otp2);
  });
});

describe('5. Responsive Layout Helper Tests', () => {
  test('TC-RSP-01: Detects tablet vs phone dimensions correctly', () => {
    expect(checkIsTablet(375, 812)).toBe(false); // iPhone / standard phone
    expect(checkIsTablet(320, 568)).toBe(false); // Small phone
    expect(checkIsTablet(768, 1024)).toBe(true); // iPad / Tablet
    expect(checkIsTablet(800, 1280)).toBe(true); // Android Tablet
  });

  test('TC-RSP-02: Scales metrics proportionally without excessive distortion', () => {
    const standardScale = scale(20, 375);
    expect(standardScale).toBe(20);

    const moderate = moderateScale(20, 0.5, 375);
    expect(moderate).toBe(20);

    // On larger width (e.g. tablet width 750), moderateScale dampens growth
    const tabletScale = moderateScale(20, 0.5, 750);
    expect(tabletScale).toBe(30); // Controlled growth instead of doubling to 40
  });
});
