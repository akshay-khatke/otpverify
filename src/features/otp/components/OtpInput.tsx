import React, {
  useRef,
  ElementRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
  useWindowDimensions,
} from 'react-native';
import { Colors } from '../../../constants';

type TextInputInstance = ElementRef<typeof TextInput>;

export interface OtpInputRef {
  clear: () => void;
  focusFirst: () => void;
  paste: (code: string) => void;
}

interface OtpInputProps {
  length?: number;
  value: string;
  onChangeOtp: (otp: string) => void;
  editable?: boolean;
}

export const OtpInput = forwardRef<OtpInputRef, OtpInputProps>(
  ({ length = 6, value, onChangeOtp, editable = true }, ref) => {
    const inputs = useRef<Array<TextInputInstance | null>>([]);
    const { width } = useWindowDimensions();

    // Dynamically calculate responsive box sizing based on available screen width
    // Ensures boxes never overflow on small phones (e.g. 320px) and stay neatly centered on tablets
    const maxContainerWidth = Math.min(width - 32, 420);
    const gap = maxContainerWidth < 340 ? 4 : 8;
    const totalGaps = gap * (length - 1);
    const boxWidth = Math.min(
      52,
      Math.max(36, Math.floor((maxContainerWidth - totalGaps) / length))
    );
    const boxHeight = Math.round(boxWidth * 1.15);
    const fontSize = boxWidth < 40 ? 18 : 22;

    useImperativeHandle(ref, () => ({
      clear: () => {
        onChangeOtp('');
        inputs.current[0]?.focus();
      },
      focusFirst: () => {
        inputs.current[0]?.focus();
      },
      paste: (code: string) => {
        const cleanDigits = code.replace(/[^0-9]/g, '').slice(0, length);
        onChangeOtp(cleanDigits);
        const focusIndex = Math.min(cleanDigits.length, length - 1);
        inputs.current[focusIndex]?.focus();
      },
    }));

    const handleChangeText = (text: string, index: number) => {
      const clearText = text.replace(/[^0-9]/g, '');

      // Case 1: Pasting multiple digits directly (via context menu Paste or keyboard suggestion)
      if ((!value[index] && clearText.length > 1) || clearText.length > 2) {
        const pasteOtp = clearText.slice(0, length);
        onChangeOtp(pasteOtp);
        const focusIndex = Math.min(pasteOtp.length, length - 1);
        inputs.current[focusIndex]?.focus();
        return;
      }

      // Case 2: Overwriting an existing digit in a box
      if (clearText.length === 2 && value[index]) {
        const nextChar = clearText.slice(-1);
        const otpArray = value.split('');
        otpArray[index] = nextChar;
        const newOtp = otpArray.join('');
        onChangeOtp(newOtp);
        if (index < length - 1) {
          inputs.current[index + 1]?.focus();
        }
        return;
      }

      // Case 3: Normal single digit typing or deletion
      const otpArray = value.split('');
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
      <View style={[styles.container, { gap }]}>
        {Array.from({ length }).map((_, index) => (
          <TextInput
            key={index}
            ref={(inputRef) => {
              inputs.current[index] = inputRef;
            }}
            style={[
              styles.box,
              {
                width: boxWidth,
                height: boxHeight,
                fontSize,
              },
              value[index] ? styles.boxActive : null,
              !editable ? styles.boxDisabled : null,
            ]}
            editable={editable}
            keyboardType="number-pad"
            maxLength={length}
            value={value[index] || ''}
            onChangeText={(text) => handleChangeText(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            selectTextOnFocus
            textAlign="center"
            autoComplete="sms-otp"
            textContentType="oneTimeCode"
            contextMenuHidden={false}
          />
        ))}
      </View>
    );
  }
);

OtpInput.displayName = 'OtpInput';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: 16,
  },
  box: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    fontWeight: '700',
    color: Colors.text,
    backgroundColor: Colors.surface,
    padding: 0,
  },
  boxActive: {
    borderColor: Colors.primary,
  },
  boxDisabled: {
    backgroundColor: '#F2F2F7',
    borderColor: '#E5E5EA',
    opacity: 0.6,
  },
});
