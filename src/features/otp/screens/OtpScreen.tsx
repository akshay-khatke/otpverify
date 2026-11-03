import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Button } from '../../../components';
import { Colors } from '../../../constants';
import { isValidOtp } from '../../../utils';
import { OtpInput } from '../components/OtpInput';
import { useOtpTimer } from '../hooks/useOtpTimer';
import { otpApi, getActiveOtp } from '../api/otpApi';
import { useAuth } from '../../../context';
import { AuthStackParamList } from '../../../navigation/types';

export const OtpScreen: React.FC = () => {
  const { login } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AuthStackParamList, 'OtpVerification'>>();
  const phone = route.params?.phoneNumber || '';

  // Track the dynamically generated random OTP
  const [randomOtp, setRandomOtp] = useState<string>(() => {
    return route.params?.initialOtp || getActiveOtp(phone);
  });

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { secondsLeft, resendOtp, resetTimer } = useOtpTimer(30);

  useEffect(() => {
    console.log('====================================================');
    console.log(`📱 [OTP SCREEN READY] Mobile Number: +91 ${phone}`);
    console.log(`🔑 [RANDOM TEST OTP]: ${randomOtp}`);
    console.log('====================================================');
  }, [phone, randomOtp]);

  const handleVerify = async () => {
    if (!isValidOtp(otp, 6)) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-digit OTP code.');
      return;
    }

    try {
      setLoading(true);
      const res = await otpApi.verifyOtp({ phoneNumber: phone, otp });
      if (res.success && res.token) {
        // Automatically switches from Auth to App stack on token save
        await login(res.token);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!resendOtp) return;

    try {
      const res = await otpApi.resendOtp({ phoneNumber: phone });
      if (res.generatedOtp) {
        setRandomOtp(res.generatedOtp);
      }
      Alert.alert('OTP Sent', `A new random verification code has been sent: ${res.generatedOtp || ''}`);
      resetTimer(30);
      setOtp('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to resend OTP. Please try again.');
    }
  };

  const handleAutoFillMockOtp = () => {
    setOtp(randomOtp);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>OTP Verification</Text>
      <Text style={styles.subtitle}>
        We have sent a 6-digit verification code to +91 {phone}
      </Text>

      {/* On-screen Randomly Generated OTP Badge */}
      <TouchableOpacity
        style={styles.mockBadge}
        activeOpacity={0.8}
        onPress={handleAutoFillMockOtp}>
        <View style={styles.mockBadgeHeader}>
          <Text style={styles.mockBadgeTitle}>Random Generated OTP</Text>
          <Text style={styles.mockBadgeAction}>Tap to Fill</Text>
        </View>
        <Text style={styles.mockOtpCode}>{randomOtp}</Text>
      </TouchableOpacity>

      <OtpInput length={6} value={otp} onChangeOtp={setOtp} />

      <View style={styles.resendRow}>
        <Text style={styles.resendInfo}>Didn't receive the code? </Text>
        <TouchableOpacity onPress={handleResend} disabled={!resendOtp}>
          <Text style={[styles.resendText, !resendOtp && styles.disabledText]}>
            {resendOtp ? 'Resend OTP' : `(${secondsLeft}s)`}
          </Text>
        </TouchableOpacity>
      </View>

      <Button
        title="Verify Code"
        onPress={handleVerify}
        loading={loading}
        disabled={otp.length !== 6}
        style={styles.verifyButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
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
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  mockBadge: {
    backgroundColor: '#E8F2FF',
    borderWidth: 1.5,
    borderColor: '#B6D7FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
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
  mockBadgeAction: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  mockOtpCode: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 6,
    color: '#0047AB',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
  disabledText: {
    color: Colors.textSecondary,
    fontWeight: 'normal',
  },
  verifyButton: {
    marginTop: 8,
  },
});
