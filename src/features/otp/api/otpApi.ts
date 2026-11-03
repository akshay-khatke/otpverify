import { apiClient } from '../../../services';
import { withLog } from '../../../utils';
import {
  VerifyOtpRequest,
  VerifyOtpResponse,
  ResendOtpRequest,
  ResendOtpResponse,
} from '../types';

const otpStore = new Map<string, string>();

export const generateRandomOtp = (phoneNumber: string): string => {
  const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phoneNumber, randomCode);
  return randomCode;
};


export const getActiveOtp = (phoneNumber: string): string => {
  if (!otpStore.has(phoneNumber)) {
    return generateRandomOtp(phoneNumber);
  }
  return otpStore.get(phoneNumber)!;
};

export const otpApi = {
  verifyOtp: withLog(
    async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
      const activeOtp = getActiveOtp(data.phoneNumber);

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (data.otp === activeOtp) {
            console.log(`OTP MATCHED Phone: +91 ${data.phoneNumber}, Code: ${data.otp}`);
            resolve({
              success: true,
              message: 'OTP verified successfully!',
              token: `mock_jwt_token_${data.phoneNumber}_${Date.now()}`,
            });
          } else {
            console.warn(`OTP MISMATCH Entered: ${data.otp}, Expected: ${activeOtp}`);
            reject(new Error(`Invalid OTP code. The generated OTP is ${activeOtp}.`));
          }
        }, 800);
      });
    },
    'OtpApi:verifyOtp'
  ),

  resendOtp: withLog(
    async (data: ResendOtpRequest): Promise<ResendOtpResponse> => {
      // Generate a new random OTP
      const newOtp = generateRandomOtp(data.phoneNumber);

      console.log(`NEW RANDOM OTP RESENT Mobile: +91 ${data.phoneNumber}`);
      console.log(`RANDOM OTP CODE: ${newOtp}`);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: `A new random OTP has been sent!`,
            generatedOtp: newOtp,
          });
        }, 800);
      });
    },
    'OtpApi:resendOtp'
  ),
};
