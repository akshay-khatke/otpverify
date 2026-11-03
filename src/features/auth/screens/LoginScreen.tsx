import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../../components';
import { Colors } from '../../../constants';
import { isValidPhoneNumber } from '../../../utils';
import { authApi } from '../api/authApi';
import { AuthStackParamList } from '../../../navigation/types';

export const LoginScreen: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const onSendOtp = async () => {
    if (!isValidPhoneNumber(phoneNumber)) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.requestLoginOtp({ phoneNumber });
      if (res.success) {
        navigation.navigate('OtpVerification', {
          phoneNumber,
          initialOtp: res.generatedOtp,
        });
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Text style={styles.subtitle}>
        Enter your mobile number to receive a verification code
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter Mobile Number "
        placeholderTextColor={Colors.textSecondary}
        keyboardType="phone-pad"
        maxLength={10}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
      />

      <Button
        title="Send OTP"
        onPress={onSendOtp}
        loading={loading}
        disabled={phoneNumber.length !== 10}
        style={styles.button}
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 28,
    lineHeight: 22,
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
    marginBottom: 20,
  },
  button: {
    marginTop: 8,
  },
});
