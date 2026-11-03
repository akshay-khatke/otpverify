export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface User {
  id: string;
  phoneNumber?: string;
  email?: string;
  name?: string;
}

