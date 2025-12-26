import express from 'express';
import {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  resendOTP,
  getCurrentUser,
  addPhoneNumber
} from '../controllers/authController.js';
import {
  validateRegistration,
  validateLogin,
  validateOTP,
  validatePasswordReset,
  validateEmail,
  validatePhoneNumberOnly
} from '../middleware/validation.js';
import { authenticateToken, requirePhoneNumber } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user (sends OTP via email)
 * @access  Public
 */
router.post('/register', validateRegistration, register);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with OTP (activates account, returns JWT)
 * @access  Public
 */
router.post('/verify-email', validateOTP, verifyEmail);

/**
 * @route   POST /api/auth/login
 * @desc    Login user (requires verified email)
 * @access  Public
 */
router.post('/login', validateLogin, login);

/**
 * @route   POST /api/auth/add-phone
 * @desc    Add phone number for authenticated user
 * @access  Protected
 */
router.post('/add-phone', authenticateToken, validatePhoneNumberOnly, addPhoneNumber);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset OTP
 * @access  Public
 */
router.post('/forgot-password', validateEmail, forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using OTP
 * @access  Public
 */
router.post('/reset-password', validatePasswordReset, resetPassword);

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP for unverified users
 * @access  Public
 */
router.post('/resend-otp', validateEmail, resendOTP);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Protected (requires JWT) + Phone required
 */
router.get('/me', authenticateToken, requirePhoneNumber, getCurrentUser);

export default router;
