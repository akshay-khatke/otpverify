import * as Keychain from 'react-native-keychain';
import { logger } from '../utils';

const TOKEN_SERVICE = 'com.otpverifyapp.auth_token';

let cachedToken: string | null = null;

export const secureStorage = {

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


  clearToken: async (): Promise<boolean> => {
    try {
      cachedToken = null;
      await Keychain.resetGenericPassword({
        service: TOKEN_SERVICE,
      });
      logger.info('SecureStorage', 'Token cleared successfully');
      return true;
    } catch (error) {
      logger.error('SecureStorage:Clear', error);
      return false;
    }
  },


  getCachedToken: (): string | null => {
    return cachedToken;
  },
};
