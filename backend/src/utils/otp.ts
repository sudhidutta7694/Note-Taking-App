import otpGenerator from 'otp-generator';
import { sendOTPEmail } from './email';

export const generateOTP = (): string => {
  return otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
};

export { sendOTPEmail };
