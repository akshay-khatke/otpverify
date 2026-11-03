import { apiClient, rateLimiter, RATE_LIMIT_RULES } from '../../../services';
import { withLog } from '../../../utils';
import {
  VerifyOtpRequest,
  VerifyOtpResponse,
  ResendOtpRequest,
  ResendOtpResponse,
} from '../types';

const otpStorage = new Map<string, string>();

export const generateRandomOtp = (identifier: string): string => {
  const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
  otpStorage.set(identifier, randomCode);
  return randomCode;
};

export const getActiveOtp = (identifier: string): string => {
  if (!otpStorage.has(identifier)) {
    return generateRandomOtp(identifier);
  }
  return otpStorage.get(identifier)!;
};

export const otpApi = {
  verifyOtp: withLog(
    async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
      const targetId = data.identifier || data.phoneNumber || '';

      rateLimiter.assertAllowed(
        `VERIFY_OTP:${targetId}`,
        RATE_LIMIT_RULES.VERIFY_OTP
      );

      const activeOtp = getActiveOtp(targetId);

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (data.otp === activeOtp) {
            console.log(`✅ [OTP MATCHED] For: ${targetId}, Code: ${data.otp}`);

            rateLimiter.reset(`VERIFY_OTP:${targetId}`);
            rateLimiter.reset(`SEND_OTP:${targetId}`);

            resolve({
              success: true,
              message: 'OTP verified successfully!',
              token: `mock_jwt_token_${targetId}_${Date.now()}`,
            });
          } else {
            console.log(`OTP MISMATCH Entered: ${data.otp}, Expected: ${activeOtp}`);
            const check = rateLimiter.checkLimit(
              `VERIFY_OTP:${targetId}`,
              RATE_LIMIT_RULES.VERIFY_OTP
            );
            const remaining = check.remaining;
            const attemptWarning =
              remaining > 0
                ? ` (${remaining} attempt${remaining > 1 ? 's' : ''} left)`
                : '';
            reject(
              new Error(
                `Invalid OTP code${attemptWarning}.`
              )
            );
          }
        }, 800);
      });
    },
    'OtpApi:verifyOtp'
  ),

  resendOtp: withLog(
    async (data: ResendOtpRequest): Promise<ResendOtpResponse> => {
      const targetId = data.identifier || data.phoneNumber || '';

      // 1. Rate Limit Check: Max 3 sends per 60 seconds
      rateLimiter.assertAllowed(
        `SEND_OTP:${targetId}`,
        RATE_LIMIT_RULES.SEND_OTP
      );

      const newOtp = generateRandomOtp(targetId);

      console.log('====================================================');
      console.log(`NEW RANDOM OTP RESENT Destination: ${targetId}`);
      console.log(`RANDOM OTP CODE: ${newOtp}`);
      console.log('====================================================');

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'OTP Sent Successfully',
            generatedOtp: newOtp,
          });
        }, 800);
      });
    },
    'OtpApi:resendOtp'
  ),

  getVerifyLockoutTime: (identifier: string): number => {
    return rateLimiter.getRemainingTime(
      `VERIFY_OTP:${identifier}`,
      RATE_LIMIT_RULES.VERIFY_OTP
    );
  },

  getResendLockoutTime: (identifier: string): number => {
    return rateLimiter.getRemainingTime(
      `SEND_OTP:${identifier}`,
      RATE_LIMIT_RULES.SEND_OTP
    );
  },
};
