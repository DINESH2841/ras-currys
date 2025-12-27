import crypto from 'crypto';

const OTP_HASH_ALGORITHM = 'sha256';
const OTP_SECRET = process.env.OTP_HASH_SECRET || 'default-otp-secret-change-in-production';

/**
 * Hash OTP using HMAC-SHA256
 * @param {string} otp - Plain text OTP code
 * @returns {string} - Hashed OTP
 */
export const hashOTP = (otp) => {
  if (!otp) {
    throw new Error('OTP is required');
  }

  return crypto
    .createHmac(OTP_HASH_ALGORITHM, OTP_SECRET)
    .update(otp.toString())
    .digest('hex');
};

/**
 * Verify OTP by comparing with hash
 * @param {string} otp - Plain text OTP to verify
 * @param {string} otpHash - Hashed OTP from database
 * @returns {boolean} - True if OTP matches
 */
export const verifyOTP = (otp, otpHash) => {
  if (!otp || !otpHash) {
    return false;
  }

  const computedHash = hashOTP(otp);
  return computedHash === otpHash;
};

/**
 * Generate a random 6-digit OTP
 * @returns {string} - 6-digit OTP code
 */
export const generateOTPCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Get OTP expiry time (10 minutes from now)
 * @returns {Date} - Expiry timestamp
 */
export const getOTPExpiry = () => {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};

export default {
  hashOTP,
  verifyOTP,
  generateOTPCode,
  getOTPExpiry,
};
