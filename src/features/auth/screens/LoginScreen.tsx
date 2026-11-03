import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../components';
import { Colors } from '../../../constants';
import { isValidPhoneNumber, isValidEmail, useResponsive } from '../../../utils';
import { authApi } from '../api/authApi';
import { RateLimitError } from '../../../services';
import { AuthStackParamList } from '../../../navigation/types';
import { LoginMode } from '../types';

const DEMO_PHONE = '9876543736';
const DEMO_EMAIL = 'john.doe@example.com';

export const LoginScreen: React.FC = () => {
  const [loginMode, setLoginMode] = useState<LoginMode>('phone');
  const [inputValue, setInputValue] = useState('');
  const [isAutoFill, setIsAutoFill] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState<number>(0);

  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isSmallDevice, isTablet, isLandscape, contentMaxWidth, horizontalPadding } =
    useResponsive();

  useEffect(() => {
    if (lockoutSecondsLeft <= 0) return;

    const interval = setInterval(() => {
      setLockoutSecondsLeft((prev) => {
        if (prev <= 1) {
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutSecondsLeft]);

  const handleModeSwitch = (mode: LoginMode) => {
    if (mode !== loginMode) {
      setLoginMode(mode);
      if (lockoutSecondsLeft === 0) {
        setErrorMessage(null);
      }
      if (isAutoFill) {
        setInputValue(mode === 'phone' ? DEMO_PHONE : DEMO_EMAIL);
      } else {
        setInputValue('');
      }
    }
  };

  const handleToggleAutoFill = () => {
    const nextState = !isAutoFill;
    setIsAutoFill(nextState);
    if (lockoutSecondsLeft === 0) {
      setErrorMessage(null);
    }

    if (nextState) {
      if (!inputValue.trim()) {
        setInputValue(loginMode === 'phone' ? DEMO_PHONE : DEMO_EMAIL);
      }
    } else {
      if (inputValue === DEMO_PHONE || inputValue === DEMO_EMAIL) {
        setInputValue('');
      }
    }
  };

  const handleTextChange = (text: string) => {
    if (errorMessage && lockoutSecondsLeft === 0) {
      setErrorMessage(null);
    }
    if (loginMode === 'phone') {
      const numericOnly = text.replace(/[^0-9]/g, '');
      setInputValue(numericOnly);
    } else {
      setInputValue(text.trim());
    }
  };

  const onSendOtp = async () => {
    if (lockoutSecondsLeft > 0) {
      setErrorMessage(
        `Too many attempts. Please wait ${lockoutSecondsLeft}s before requesting a new OTP.`
      );
      return;
    }

    const trimmed = inputValue.trim();
    setErrorMessage(null);

    if (!trimmed) {
      setErrorMessage(
        loginMode === 'phone'
          ? 'Please enter your 10-digit mobile number.'
          : 'Please enter your email address.'
      );
      return;
    }

    if (loginMode === 'phone') {
      if (!isValidPhoneNumber(trimmed)) {
        setErrorMessage(
          'Please enter a valid 10-digit mobile number (e.g. 9876543210).'
        );
        return;
      }
    } else {
      if (!isValidEmail(trimmed)) {
        setErrorMessage(
          'Please enter a valid email address (e.g. name@example.com).'
        );
        return;
      }
    }

    try {
      setLoading(true);
      const res = await authApi.requestLoginOtp({
        identifier: trimmed,
        type: loginMode,
      });

      if (res.success) {
        navigation.navigate('OtpVerification', {
          identifier: trimmed,
          loginType: loginMode,
          initialOtp: res.generatedOtp,
          phoneNumber: trimmed,
          autoFill: isAutoFill,
        });
      }
    } catch (err: any) {
      if (err instanceof RateLimitError || err.retryAfterSeconds) {
        const waitSec = err.retryAfterSeconds || 60;
        setLockoutSecondsLeft(waitSec);
        setErrorMessage(
          `Too many attempts. Please wait ${waitSec}s before requesting a new OTP.`
        );
      } else if (
        typeof err.message === 'string' &&
        err.message.includes('Too many attempts')
      ) {
        const match = err.message.match(/(\d+)\s*seconds/);
        const waitSec = match ? parseInt(match[1], 10) : 60;
        setLockoutSecondsLeft(waitSec);
        setErrorMessage(
          `Too many attempts. Please wait ${waitSec}s before requesting a new OTP.`
        );
      } else {
        setErrorMessage(err.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled =
    loading || inputValue.trim().length === 0 || lockoutSecondsLeft > 0;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingTop: Math.max(insets.top + 16, 24),
            paddingBottom: Math.max(insets.bottom + 16, 24),
            paddingHorizontal: horizontalPadding,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.card,
            { maxWidth: contentMaxWidth },
            isTablet && styles.cardTablet,
          ]}>
          <Text
            style={[
              styles.title,
              isSmallDevice && styles.titleSmall,
              isTablet && styles.titleTablet,
            ]}>
            Login
          </Text>
          <Text
            style={[
              styles.subtitle,
              isSmallDevice && styles.subtitleSmall,
              isLandscape && styles.subtitleLandscape,
            ]}>
            {loginMode === 'phone'
              ? 'Enter your 10-digit mobile number to receive an OTP'
              : 'Enter your email address to receive an OTP'}
          </Text>

          {/* Mode Switcher Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                loginMode === 'phone' && styles.tabButtonActive,
              ]}
              onPress={() => handleModeSwitch('phone')}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.tabText,
                  isSmallDevice && styles.tabTextSmall,
                  loginMode === 'phone' && styles.tabTextActive,
                ]}>
                Phone Number
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                loginMode === 'email' && styles.tabButtonActive,
              ]}
              onPress={() => handleModeSwitch('email')}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.tabText,
                  isSmallDevice && styles.tabTextSmall,
                  loginMode === 'email' && styles.tabTextActive,
                ]}>
                Email Address
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input Field with Dynamic Keyboard and Masking */}
          {loginMode === 'phone' ? (
            <View
              style={[
                styles.inputWrapper,
                errorMessage ? styles.inputWrapperError : null,
              ]}>
              <Text style={styles.prefixText}>+91</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="10-digit mobile number"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="number-pad"
                maxLength={10}
                value={inputValue}
                onChangeText={handleTextChange}
                editable={lockoutSecondsLeft === 0}
              />
            </View>
          ) : (
            <TextInput
              style={[
                styles.input,
                errorMessage ? styles.inputError : null,
              ]}
              placeholder="e.g. user@example.com"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={inputValue}
              onChangeText={handleTextChange}
              editable={lockoutSecondsLeft === 0}
            />
          )}

          {lockoutSecondsLeft > 0 ? (
            <View style={styles.lockoutBanner}>
              <View style={styles.lockoutTextContainer}>
                <Text style={styles.lockoutTitle}>Too Many Attempts</Text>
                <Text style={styles.lockoutDesc}>
                  Rate limit reached. Please wait{' '}
                  <Text style={styles.lockoutCountdownNumber}>
                    {lockoutSecondsLeft}s
                  </Text>{' '}
                  before requesting again.
                </Text>
              </View>
            </View>
          ) : errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}


          <TouchableOpacity
            style={[
              styles.checkboxContainer,
              isAutoFill && styles.checkboxContainerActive,
            ]}
            activeOpacity={0.7}
            onPress={handleToggleAutoFill}>
            <View
              style={[
                styles.checkboxBox,
                isAutoFill && styles.checkboxBoxChecked,
              ]}>
              {isAutoFill ? <Text style={styles.checkmarkIcon}>✓</Text> : null}
            </View>
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxTitle}>Auto-fill for testing</Text>
              <Text style={styles.checkboxSubtitle}>
                {isAutoFill
                  ? 'Checked: Auto-fills credentials & verification OTP code'
                  : 'Unchecked: Normal manual entry flow'}
              </Text>
            </View>
          </TouchableOpacity>

          <Button
            title={
              lockoutSecondsLeft > 0
                ? `Try again in ${lockoutSecondsLeft}s`
                : 'Send OTP'
            }
            onPress={onSendOtp}
            loading={loading}
            disabled={isButtonDisabled}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    alignSelf: 'center',
  },
  cardTablet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  titleSmall: {
    fontSize: 24,
  },
  titleTablet: {
    fontSize: 32,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  subtitleSmall: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  subtitleLandscape: {
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  tabTextSmall: {
    fontSize: 12,
  },
  tabTextActive: {
    fontWeight: '700',
    color: Colors.primary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: '#FFF5F5',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputWrapperError: {
    borderColor: Colors.error,
    backgroundColor: '#FFF5F5',
  },
  lockoutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E5',
    borderWidth: 1.5,
    borderColor: '#FFB74D',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  lockoutIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  lockoutTextContainer: {
    flex: 1,
  },
  lockoutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 2,
  },
  lockoutDesc: {
    fontSize: 13,
    color: '#B24700',
    lineHeight: 18,
  },
  lockoutCountdownNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  errorIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '500',
    flex: 1,
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    backgroundColor: '#F9F9FB',
    marginBottom: 20,
  },
  checkboxContainerActive: {
    borderColor: Colors.primary,
    backgroundColor: '#F0F6FF',
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#8E8E93',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 16,
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  checkboxSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  button: {
    marginTop: 4,
  },
});
