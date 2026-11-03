export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.trim());
};

export const isValidOtp = (otp: string, length = 6): boolean => {
  const otpRegex = new RegExp(`^[0-9]{${length}}$`);
  return otpRegex.test(otp.trim());
};

