declare module 'otp-generator' {
  interface Options {
    digits?: boolean;
    lowerCaseAlphabets?: boolean;
    upperCaseAlphabets?: boolean;
    specialChars?: boolean;
  }
  const otp: { generate: (length?: number, options?: Options) => string };
  export default otp;
}
