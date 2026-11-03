import { apiClient, rateLimiter, RATE_LIMIT_RULES } from '../../../services';
import { withLog } from '../../../utils';
import { generateRandomOtp } from '../../otp/api/otpApi';
import { LoginRequest, LoginResponse } from '../types';

export const authApi = {
  requestLoginOtp: withLog(
    async (data: LoginRequest): Promise<LoginResponse> => {
      rateLimiter.assertAllowed(
        `SEND_OTP:${data.identifier}`,
        RATE_LIMIT_RULES.SEND_OTP
      );

      const randomOtp = generateRandomOtp(data.identifier);

      console.log(`New Random OTP Generated: ${data.identifier} (${data.type.toUpperCase()})`);
      console.log(`New Random OTP Code: ${randomOtp}`);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: `OTP sent successfully to your ${data.type}!`,
            requestId: `req_${Date.now()}`,
            generatedOtp: randomOtp,
          });
        }, 800);
      });
    },
    'AuthApi:requestLoginOtp'
  ),

  getSendOtpLockoutTime: (identifier: string): number => {
    return rateLimiter.getRemainingTime(
      `SEND_OTP:${identifier}`,
      RATE_LIMIT_RULES.SEND_OTP
    );
  },
};
