import { useState, useEffect, useCallback } from 'react';

export const useOtpTimer = (initialSeconds = 60) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [resendOtp, setResendOtp] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      setResendOtp(true);
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setResendOtp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const resetTimer = useCallback((newSeconds = initialSeconds) => {
    setSecondsLeft(newSeconds);
    setResendOtp(false);
  }, [initialSeconds]);

  return { secondsLeft, resendOtp, resetTimer };
};

