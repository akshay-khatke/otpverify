export interface VerifyOtpRequest {
  identifier: string; // phone number or email
  otp: string;
  phoneNumber?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  token?: string;
}

export interface ResendOtpRequest {
  identifier: string; // phone number or email
  phoneNumber?: string;
}

export interface ResendOtpResponse {
  success: boolean;
  message: string;
  generatedOtp?: string;
}
