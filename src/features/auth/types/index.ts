export type LoginMode = 'phone' | 'email';

export interface LoginRequest {
  identifier: string; // phone number or email
  type: LoginMode;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  requestId?: string;
  generatedOtp?: string;
}
