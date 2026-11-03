import React, { useRef, ElementRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
} from 'react-native';
import { Colors } from '../../../constants';

type TextInputInstance = ElementRef<typeof TextInput>;

interface OtpInputProps {
  length?: number;
  value: string;
  onChangeOtp: (otp: string) => void;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChangeOtp,
}) => {
  const inputs = useRef<Array<TextInputInstance | null>>([]);

  const handleChangeText = (text: string, index: number) => {
    const clearText = text.replace(/[^0-9]/g, '');
    const otpArray = value.split('');

    if (clearText.length > 1) {
      const pasteOtp = clearText.slice(0, length);
      onChangeOtp(pasteOtp);
      const focusIndex = Math.min(pasteOtp.length, length - 1);
      inputs.current[focusIndex]?.focus();
      return;
    }

    otpArray[index] = clearText;
    const newOtp = otpArray.join('');
    onChangeOtp(newOtp);

    if (clearText && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<{ key: string }>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputs.current[index] = ref;
          }}
          style={[styles.box, value[index] ? styles.boxActive : null]}
          keyboardType="number-pad"
          maxLength={1}
          value={value[index] || ''}
          onChangeText={(text) => handleChangeText(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          selectTextOnFocus
          textAlign="center"
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  box: {
    width: 48,
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  boxActive: {
    borderColor: Colors.primary,
  },
});
