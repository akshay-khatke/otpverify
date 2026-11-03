export interface VerifyOtpRequest {
  phoneNumber: string;
  otp: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  token?: string;
}

export interface ResendOtpRequest {
  phoneNumber: string;
}

export interface ResendOtpResponse {
  success: boolean;
  message: string;
  generatedOtp?: string;
}
