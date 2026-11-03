import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  OtpVerification: { phoneNumber: string; initialOtp?: string };
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
