import { apiClient } from '../../../services';
import { withLog } from '../../../utils';
import { generateRandomOtp } from '../../otp/api/otpApi';
import { LoginRequest, LoginResponse } from '../types';

export const authApi = {
  requestLoginOtp: withLog(
    async (data: LoginRequest): Promise<LoginResponse> => {
      // Generate a dynamic random 6-digit OTP
      const randomOtp = generateRandomOtp(data.phoneNumber);

      console.log('====================================================');
      console.log(`📱 [NEW RANDOM OTP GENERATED] Mobile: +91 ${data.phoneNumber}`);
      console.log(`🔑 [RANDOM OTP CODE]: ${randomOtp}`);
      console.log('====================================================');

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: `OTP sent successfully!`,
            requestId: `req_${Date.now()}`,
            generatedOtp: randomOtp,
          });
        }, 1000);
      });
    },
    'AuthApi:requestLoginOtp'
  ),
};
