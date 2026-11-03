import React, { createContext, useContext, useState, useEffect } from 'react';
import { secureStorage } from '../services/secureStorage';
import { logger } from '../utils';

interface AuthContextType {
  userToken: string | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  userToken: null,
  isLoading: true,
  login: async () => { },
  logout: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check existing token on app launch
  useEffect(() => {
    const checkExistingToken = async () => {
      try {
        const token = await secureStorage.getToken();
        if (token) {
          setUserToken(token);
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

    checkExistingToken();
  }, []);

  const login = async (token: string) => {
    try {
      await secureStorage.saveToken(token);
      setUserToken(token);
      logger.info('AuthContext', 'User authenticated successfully. Switching to AppStack.');
    } catch (error) {
      logger.error('AuthContext:Login', error);
    }
  };


  const logout = async () => {
    try {
      await secureStorage.clearToken();
      setUserToken(null); // Triggers automatic stack switch from App to Auth
      logger.info('AuthContext', 'User logged out. Switching to AuthStack.');
    } catch (error) {
      logger.error('AuthContext:Logout', error);
    }
  };

  return (
    <AuthContext.Provider value={{ userToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook to use AuthContext
export const useAuth = () => useContext(AuthContext);
