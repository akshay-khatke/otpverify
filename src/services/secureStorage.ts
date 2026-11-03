import * as Keychain from 'react-native-keychain';
import { logger } from '../utils';

const TOKEN_SERVICE = 'com.otpverifyapp.auth_token';
const PHONE_SERVICE = 'com.otpverifyapp.user_phone';

// In-memory cache for fast synchronous access
let cachedToken: string | null = null;
let cachedPhone: string | null = null;

export const secureStorage = {
  /**
   * Securely saves the token to device keychain (Android Keystore / iOS Keychain)
   */
  saveToken: async (token: string): Promise<boolean> => {
    try {
      cachedToken = token;
      await Keychain.setGenericPassword('auth_token', token, {
        service: TOKEN_SERVICE,
      });
      logger.info('SecureStorage', 'Token saved securely');
      return true;
    } catch (error) {
      logger.error('SecureStorage:Save', error);
      return false;
    }
  },

  /**
   * Retrieves the stored token from secure storage
   */
  getToken: async (): Promise<string | null> => {
    try {
      if (cachedToken) {
        return cachedToken;
      }

      const credentials = await Keychain.getGenericPassword({
        service: TOKEN_SERVICE,
      });

      if (credentials && credentials.password) {
        cachedToken = credentials.password;
        return credentials.password;
      }
      return null;
    } catch (error) {
      logger.error('SecureStorage:Get', error);
      return cachedToken;
    }
  },

  /**
   * Securely saves the phone number
   */
  savePhoneNumber: async (phone: string): Promise<boolean> => {
    try {
      cachedPhone = phone;
      await Keychain.setGenericPassword('user_phone', phone, {
        service: PHONE_SERVICE,
      });
      return true;
    } catch (error) {
      logger.error('SecureStorage:SavePhone', error);
      return false;
    }
  },

  /**
   * Retrieves the stored phone number
   */
  getPhoneNumber: async (): Promise<string | null> => {
    try {
      if (cachedPhone) {
        return cachedPhone;
      }

      const credentials = await Keychain.getGenericPassword({
        service: PHONE_SERVICE,
      });

      if (credentials && credentials.password) {
        cachedPhone = credentials.password;
        return credentials.password;
      }
      return null;
    } catch (error) {
      logger.error('SecureStorage:GetPhone', error);
      return cachedPhone;
    }
  },

  /**
   * Removes all auth credentials from secure storage (used on logout)
   */
  clearToken: async (): Promise<boolean> => {
    try {
      cachedToken = null;
      cachedPhone = null;
      await Keychain.resetGenericPassword({
        service: TOKEN_SERVICE,
      });
      await Keychain.resetGenericPassword({
        service: PHONE_SERVICE,
      });
      logger.info('SecureStorage', 'Credentials cleared successfully');
      return true;
    } catch (error) {
      logger.error('SecureStorage:Clear', error);
      return false;
    }
  },

  /**
   * Gets cached token synchronously
   */
  getCachedToken: (): string | null => {
    return cachedToken;
  },
};
