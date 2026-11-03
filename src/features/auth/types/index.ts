export interface LoginRequest {
  phoneNumber: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  requestId?: string;
  generatedOtp?: string;
}
