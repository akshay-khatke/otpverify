import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../components';
import { Colors } from '../../../constants';
import { isValidOtp, maskIdentifier, appClipboard, useResponsive } from '../../../utils';
import { OtpInput, OtpInputRef } from '../components/OtpInput';
import { useOtpTimer } from '../hooks/useOtpTimer';
import { otpApi, getActiveOtp } from '../api/otpApi';
import { RateLimitError } from '../../../services';
import { useAuth } from '../../../context';
import { AuthStackParamList } from '../../../navigation/types';

export const OtpScreen: React.FC = () => {
  const { login } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AuthStackParamList, 'OtpVerification'>>();
  const identifier = route.params?.identifier || route.params?.phoneNumber || '';
  const loginType =
    route.params?.loginType || (identifier.includes('@') ? 'email' : 'phone');
  const autoFill = route.params?.autoFill ?? false;

  const insets = useSafeAreaInsets();
  const { isSmallDevice, isTablet, isLandscape, contentMaxWidth, horizontalPadding } =
    useResponsive();

  const [randomOtp, setRandomOtp] = useState<string>(() => {
    return route.params?.initialOtp || getActiveOtp(identifier);
  });

  const [otp, setOtp] = useState<string>(() => {
    return autoFill ? route.params?.initialOtp || getActiveOtp(identifier) : '';
  });
  const [isCopied, setIsCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState<number>(() => {
    return otpApi.getVerifyLockoutTime(identifier);
  });

  const initialResendWait = Math.max(60, otpApi.getResendLockoutTime(identifier));
  const { secondsLeft, resendOtp, resetTimer } = useOtpTimer(initialResendWait);

  const otpInputRef = useRef<OtpInputRef>(null);

  useEffect(() => {
    console.log(`OTP Screen ready Identifier: ${identifier} (${loginType})`);
    console.log(`Random Test OTP: ${randomOtp}`);
    console.log(`Auto-Fill Active: ${autoFill}`);
    if (lockoutSecondsLeft > 0) {
      console.log(`Active Lockout: ${lockoutSecondsLeft}s remaining`);
    }
  }, [identifier, loginType, randomOtp, autoFill, lockoutSecondsLeft]);

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

  const handleOtpChange = (newOtp: string) => {
    setOtp(newOtp);
    if (errorMessage && lockoutSecondsLeft === 0) {
      setErrorMessage(null);
    }
  };

  const handleCopyCode = () => {
    appClipboard.setString(randomOtp);
    setIsCopied(true);
    if (errorMessage && lockoutSecondsLeft === 0) {
      setErrorMessage(null);
    }
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const handlePasteCode = () => {
    if (lockoutSecondsLeft > 0) return;
    const code = appClipboard.getString() || randomOtp;
    if (!code) {
      setErrorMessage('No code copied yet. Please copy the code first.');
      return;
    }
    setOtp(code);
    setErrorMessage(null);
    otpInputRef.current?.paste(code);
  };

  const handleVerify = async () => {
    if (lockoutSecondsLeft > 0) {
      setErrorMessage(
        `Too many attempts. Please wait ${lockoutSecondsLeft}s before trying again.`
      );
      return;
    }

    setErrorMessage(null);

    if (!isValidOtp(otp, 6)) {
      setErrorMessage('Please enter a valid 6-digit OTP code.');
      return;
    }

    try {
      setLoading(true);
      const res = await otpApi.verifyOtp({
        identifier,
        phoneNumber: identifier,
        otp,
      });
      if (res.success && res.token) {
        await login(res.token, identifier);
      }
    } catch (err: any) {
      if (err instanceof RateLimitError || err.retryAfterSeconds) {
        const waitSec = err.retryAfterSeconds || 60;
        setLockoutSecondsLeft(waitSec);
        setErrorMessage(
          `Too many attempts. Please wait ${waitSec}s before trying again.`
        );
      } else if (
        typeof err.message === 'string' &&
        err.message.includes('Too many attempts')
      ) {
        const match = err.message.match(/(\d+)\s*seconds/);
        const waitSec = match ? parseInt(match[1], 10) : 60;
        setLockoutSecondsLeft(waitSec);
        setErrorMessage(
          `Too many attempts. Please wait ${waitSec}s before trying again.`
        );
      } else {
        setErrorMessage(err.message || 'OTP verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!resendOtp) return;
    setErrorMessage(null);

    try {
      const res = await otpApi.resendOtp({
        identifier,
        phoneNumber: identifier,
      });
      if (res.generatedOtp) {
        setRandomOtp(res.generatedOtp);
        if (autoFill) {
          setOtp(res.generatedOtp);
        }
      }
      Alert.alert(
        'OTP Sent',
        `OTP Sent Successfully`
      );
      resetTimer(60);
      if (!autoFill) {
        handleClearOtp();
      }
    } catch (err: any) {
      if (err instanceof RateLimitError || err.retryAfterSeconds) {
        const waitSec = err.retryAfterSeconds || 60;
        resetTimer(waitSec);
        setErrorMessage(
          `Too many resend attempts. Please wait ${waitSec}s before requesting a new OTP.`
        );
      } else if (
        typeof err.message === 'string' &&
        err.message.includes('Too many attempts')
      ) {
        const match = err.message.match(/(\d+)\s*seconds/);
        const waitSec = match ? parseInt(match[1], 10) : 60;
        resetTimer(waitSec);
        setErrorMessage(
          `Too many resend attempts. Please wait ${waitSec}s before requesting a new OTP.`
        );
      } else {
        setErrorMessage(err.message || 'Failed to resend OTP. Please try again.');
      }
    }
  };

  const handleClearOtp = () => {
    if (lockoutSecondsLeft > 0) return;
    setOtp('');
    setErrorMessage(null);
    otpInputRef.current?.clear();
  };

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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <Text
            style={[
              styles.title,
              isSmallDevice && styles.titleSmall,
              isTablet && styles.titleTablet,
            ]}>
            OTP Verification
          </Text>
          <Text
            style={[
              styles.subtitle,
              isSmallDevice && styles.subtitleSmall,
              isLandscape && styles.subtitleLandscape,
            ]}>
            We have sent a 6-digit verification code to{' '}
            <Text style={styles.highlightText}>{'+91 - ' + identifier}</Text>
          </Text>

          <TouchableOpacity
            style={[styles.mockBadge, isCopied && styles.mockBadgeCopied]}
            activeOpacity={0.8}
            onPress={handleCopyCode}>
            <View style={styles.mockBadgeHeader}>
              <Text
                style={[
                  styles.mockBadgeTitle,
                  isCopied && styles.mockBadgeTitleCopied,
                ]}>
                Generated OTP
              </Text>
              <Text
                style={[
                  styles.mockBadgeAction,
                  isCopied && styles.mockBadgeActionCopied,
                ]}>
                {isCopied ? 'Copied' : 'Copy Code'}
              </Text>
            </View>
            <Text
              style={[
                styles.mockOtpCode,
                isSmallDevice && styles.mockOtpCodeSmall,
                isCopied && styles.mockOtpCodeCopied,
              ]}>
              {randomOtp}
            </Text>
          </TouchableOpacity>

          {isCopied && otp.length < 6 && lockoutSecondsLeft === 0 ? (
            <TouchableOpacity
              style={styles.quickPasteBanner}
              activeOpacity={0.8}
              onPress={handlePasteCode}>
              <Text style={styles.quickPasteBannerText}>
                Click here to paste{' '}
                <Text style={styles.quickPasteBannerCode}>{randomOtp}</Text>
              </Text>
            </TouchableOpacity>
          ) : null}

          <OtpInput
            ref={otpInputRef}
            length={6}
            value={otp}
            onChangeOtp={handleOtpChange}
            editable={lockoutSecondsLeft === 0}
          />

          {lockoutSecondsLeft > 0 ? (
            <View style={styles.lockoutBanner}>
              <View style={styles.lockoutTextContainer}>
                <Text style={styles.lockoutTitle}>Too Many Attempts</Text>
                <Text style={styles.lockoutDesc}>
                  Verification locked for security. Please wait{' '}
                  <Text style={styles.lockoutCountdownNumber}>
                    {lockoutSecondsLeft}s
                  </Text>{' '}
                  before trying again.
                </Text>
              </View>
            </View>
          ) : errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.pasteButton,
                isCopied && styles.pasteButtonHighlighted,
                lockoutSecondsLeft > 0 && styles.actionButtonDisabled,
              ]}
              activeOpacity={0.7}
              onPress={handlePasteCode}
              disabled={lockoutSecondsLeft > 0}>
              <Text
                style={[
                  styles.pasteButtonText,
                  lockoutSecondsLeft > 0 && styles.disabledText,
                ]}>
                Paste Code
              </Text>
            </TouchableOpacity>

            {otp.length > 0 && lockoutSecondsLeft === 0 ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.clearButton]}
                activeOpacity={0.7}
                onPress={handleClearOtp}>
                <Text style={styles.clearButtonText}>✕ Clear OTP</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Resend OTP Row with live cooldown timer */}
          <View style={styles.resendRow}>
            <Text style={styles.resendInfo}>Didn't receive the code? </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={!resendOtp || lockoutSecondsLeft > 0}>
              {resendOtp && lockoutSecondsLeft === 0 ? (
                <Text style={styles.resendText}>Resend OTP</Text>
              ) : (
                <Text style={styles.countdownText}>({secondsLeft}s)</Text>
              )}
            </TouchableOpacity>
          </View>

          <Button
            title={
              lockoutSecondsLeft > 0
                ? `⏳ Try again in ${lockoutSecondsLeft}s`
                : 'Verify Code'
            }
            onPress={handleVerify}
            loading={loading}
            disabled={otp.length !== 6 || lockoutSecondsLeft > 0}
            style={styles.verifyButton}
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
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  titleSmall: {
    fontSize: 22,
  },
  titleTablet: {
    fontSize: 30,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  subtitleSmall: {
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 18,
  },
  subtitleLandscape: {
    marginBottom: 12,
  },
  highlightText: {
    color: Colors.text,
    fontWeight: '700',
  },
  mockBadge: {
    backgroundColor: '#E8F2FF',
    borderWidth: 1.5,
    borderColor: '#B6D7FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    alignItems: 'center',
  },
  mockBadgeCopied: {
    backgroundColor: '#EAF8EE',
    borderColor: '#82D69B',
  },
  mockBadgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
  },
  mockBadgeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  mockBadgeTitleCopied: {
    color: '#1B7F37',
  },
  mockBadgeAction: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  mockBadgeActionCopied: {
    color: '#1B7F37',
    textDecorationLine: 'none',
  },
  mockOtpCode: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 6,
    color: '#0047AB',
  },
  mockOtpCodeSmall: {
    fontSize: 22,
    letterSpacing: 4,
  },
  mockOtpCodeCopied: {
    color: '#1B7F37',
  },
  quickPasteBanner: {
    backgroundColor: '#EAF8EE',
    borderWidth: 1.5,
    borderColor: '#82D69B',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  quickPasteBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B7F37',
  },
  quickPasteBannerCode: {
    fontWeight: '800',
    letterSpacing: 2,
    textDecorationLine: 'underline',
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
    marginVertical: 10,
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
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  errorIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '500',
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 36,
    marginVertical: 10,
    gap: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  pasteButton: {
    backgroundColor: '#E8F2FF',
    borderWidth: 1,
    borderColor: '#B6D7FF',
  },
  pasteButtonHighlighted: {
    backgroundColor: '#EAF8EE',
    borderColor: '#82D69B',
  },
  pasteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  clearButton: {
    backgroundColor: '#F2F2F7',
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  resendInfo: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  resendText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  countdownText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '700',
  },
  disabledText: {
    color: Colors.textSecondary,
    fontWeight: 'normal',
  },
  verifyButton: {
    marginTop: 6,
  },
});
