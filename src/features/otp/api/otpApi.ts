import { apiClient, rateLimiter, RATE_LIMIT_RULES } from '../../../services';
import { withLog } from '../../../utils';
import {
  VerifyOtpRequest,
  VerifyOtpResponse,
  ResendOtpRequest,
  ResendOtpResponse,
} from '../types';

// In-memory store to map phone numbers to their randomly generated OTPs
const otpStorage = new Map<string, string>();

/**
 * Generates a random 6-digit OTP and associates it with the phone number
 */
export const generateRandomOtp = (phoneNumber: string): string => {
  const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
  otpStorage.set(phoneNumber, randomCode);
  return randomCode;
};

/**
 * Retrieves the currently active random OTP for the given phone number
 */
export const getActiveOtp = (phoneNumber: string): string => {
  if (!otpStorage.has(phoneNumber)) {
    return generateRandomOtp(phoneNumber);
  }
  return otpStorage.get(phoneNumber)!;
};

export const otpApi = {
  verifyOtp: withLog(
    async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
      // 1. Rate Limit Check: Max 5 failed attempts per 60 seconds
      rateLimiter.assertAllowed(
        `VERIFY_OTP:${data.phoneNumber}`,
        RATE_LIMIT_RULES.VERIFY_OTP
      );

      const activeOtp = getActiveOtp(data.phoneNumber);

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (data.otp === activeOtp) {
            console.log(`✅ [OTP MATCHED] Phone: +91 ${data.phoneNumber}, Code: ${data.otp}`);
            
            // Reset rate limiter on successful verification
            rateLimiter.reset(`VERIFY_OTP:${data.phoneNumber}`);
            rateLimiter.reset(`SEND_OTP:${data.phoneNumber}`);

            resolve({
              success: true,
              message: 'OTP verified successfully!',
              token: `mock_jwt_token_${data.phoneNumber}_${Date.now()}`,
            });
          } else {
            console.warn(`❌ [OTP MISMATCH] Entered: ${data.otp}, Expected: ${activeOtp}`);
            reject(new Error(`Invalid OTP code. The generated OTP is ${activeOtp}.`));
          }
        }, 800);
      });
    },
    'OtpApi:verifyOtp'
  ),

  resendOtp: withLog(
    async (data: ResendOtpRequest): Promise<ResendOtpResponse> => {
      // 1. Rate Limit Check: Max 3 sends per 60 seconds
      rateLimiter.assertAllowed(
        `SEND_OTP:${data.phoneNumber}`,
        RATE_LIMIT_RULES.SEND_OTP
      );

      // 2. Generate a brand new random OTP
      const newOtp = generateRandomOtp(data.phoneNumber);

      console.log('====================================================');
      console.log(`🔄 [NEW RANDOM OTP RESENT] Mobile: +91 ${data.phoneNumber}`);
      console.log(`🔑 [RANDOM OTP CODE]: ${newOtp}`);
      console.log('====================================================');

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'A new random OTP has been sent!',
            generatedOtp: newOtp,
          });
        }, 800);
      });
    },
    'OtpApi:resendOtp'
  ),
};
