
export const maskPhoneNumber = (
  phone?: string | null,
  visibleTrailingDigits = 3,
  countryCode = '+91'
): string => {
  if (!phone) {
    return '';
  }

  const cleanDigits = phone.replace(/[^0-9]/g, '');

  const nationalNumber =
    cleanDigits.length > 10 ? cleanDigits.slice(-10) : cleanDigits;

  if (nationalNumber.length <= visibleTrailingDigits) {
    return `${countryCode} ${nationalNumber}`;
  }

  const maskedPart = '*'.repeat(nationalNumber.length - visibleTrailingDigits);
  const visiblePart = nationalNumber.slice(-visibleTrailingDigits);

  return `${countryCode} ${maskedPart}${visiblePart}`;
};


export const maskEmail = (email?: string | null): string => {
  if (!email || !email.includes('@')) {
    return email || '';
  }

  const [username, domain] = email.split('@');

  if (username.length <= 2) {
    return `${username[0]}*@${domain}`;
  }

  const firstChar = username[0];
  const lastChar = username[username.length - 1];
  const maskedLength = Math.max(1, username.length - 2);

  return `${firstChar}${'*'.repeat(maskedLength)}${lastChar}@${domain}`;
};


export const maskIdentifier = (identifier?: string | null): string => {
  if (!identifier) return '';
  if (identifier.includes('@')) {
    return maskEmail(identifier);
  }
  return maskPhoneNumber(identifier);
};
