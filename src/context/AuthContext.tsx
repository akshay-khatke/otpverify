import React, { createContext, useContext, useState, useEffect } from 'react';
import { secureStorage } from '../services/secureStorage';
import { logger } from '../utils';

interface AuthContextType {
  userToken: string | null;
  phoneNumber: string | null;
  isLoading: boolean;
  login: (token: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  userToken: null,
  phoneNumber: null,
  isLoading: true,
  login: async () => { },
  logout: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);


  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const token = await secureStorage.getToken();
        const storedPhone = await secureStorage.getPhoneNumber();

        if (token) {
          setUserToken(token);
          if (storedPhone) {
            setPhoneNumber(storedPhone);
          }
          logger.info('AuthContext', 'Existing session found with token');
        } else {
          logger.info('AuthContext', 'No existing session found');
        }
      } catch (error) {
        logger.error('AuthContext:CheckToken', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const login = async (token: string, phone?: string) => {
    try {
      await secureStorage.saveToken(token);
      setUserToken(token);

      if (phone) {
        await secureStorage.savePhoneNumber(phone);
        setPhoneNumber(phone);
      }

      logger.info('AuthContext', 'User authenticated successfully');
    } catch (error) {
      logger.error('AuthContext:Login', error);
    }
  };

  const logout = async () => {
    try {
      await secureStorage.clearToken();
      setUserToken(null);
      setPhoneNumber(null);
      logger.info('AuthContext', 'User logged out. Switching to AuthStack.');
    } catch (error) {
      logger.error('AuthContext:Logout', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ userToken, phoneNumber, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
