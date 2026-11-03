import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  OtpVerification: {
    identifier: string;
    loginType?: 'phone' | 'email';
    initialOtp?: string;
    phoneNumber?: string;
    autoFill?: boolean;
  };
};

export type AppStackParamList = {
  Home: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  MainApp: undefined;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type AppScreenProps<T extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, T>;
