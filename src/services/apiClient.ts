import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import { secureStorage } from './secureStorage';
import { logger } from '../utils';

const BASE_URL = 'https://api.example.com/api/v1';

// 1. Create Axios Instance
const instance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// 2. Request Interceptor (attaches secure token and logs request)
instance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await secureStorage.getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      logger.warn('API:Token', 'Failed to read token from secure storage', e);
    }

    logger.info('API:Request', `[${config.method?.toUpperCase()}] ${config.url}`);
    return config;
  },
  (error: AxiosError) => {
    logger.error('API:RequestError', error);
    return Promise.reject(error);
  }
);

// 3. Response Interceptor (handles data extraction and global error handling)
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    logger.info('API:Response', `${response.status} from ${response.config.url}`);
    return response.data;
  },
  async (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const data: any = error.response.data;

      logger.error(`API:Error:${status}`, data);

      switch (status) {
        case 401:
          // Unauthorized: Session expired, clear token from secure storage
          await secureStorage.clearToken();
          break;
        case 403:
          // Forbidden
          break;
        case 404:
          // Not Found
          break;
        case 429: {
          // Too Many Requests: Rate limit reached on server
          const retryAfter = error.response.headers?.['retry-after'];
          const message = retryAfter
            ? `Too many requests. Please wait ${retryAfter} seconds before trying again.`
            : (data?.message || 'Rate limit reached. Please wait a moment before trying again.');
          return Promise.reject(message);
        }
        case 500:
          // Internal Server Error
          break;
        default:
          break;
      }

      return Promise.reject(data?.message || error.message);
    } else if (error.request) {
      logger.error('API:Network', 'No response received from server');
      return Promise.reject('Please check your internet connection and try again.');
    } else {
      logger.error('API:Setup', error.message);
      return Promise.reject(error.message);
    }
  }
);

// 4. API Client Wrapper Methods
export const apiClient = {
  get: async <T = any>(url: string, params?: any): Promise<T> => {
    const res = await instance.get(url, { params });
    return res as unknown as T;
  },

  post: async <T = any>(url: string, data?: any): Promise<T> => {
    const res = await instance.post(url, data);
    return res as unknown as T;
  },

  put: async <T = any>(url: string, data?: any): Promise<T> => {
    const res = await instance.put(url, data);
    return res as unknown as T;
  },

  delete: async <T = any>(url: string): Promise<T> => {
    const res = await instance.delete(url);
    return res as unknown as T;
  },

  // Direct access to Axios instance
  raw: instance,
};
