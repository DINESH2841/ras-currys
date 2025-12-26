import UserModel from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import { sendSignupOTP, sendPasswordResetOTP, sendWelcomeEmail } from '../services/emailService.js';

/**
 * 1️⃣ USER REGISTRATION (SIGN UP) — EMAIL OTP VERIFIED
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered',
        message: 'This email is already associated with an account'
      });
    }

    // Create user and generate OTP
    const { user, otp } = await UserModel.create({
      fullName,
      email,
      phoneNumber,
      password
    });

    // Send OTP via Gmail SMTP
    const emailResult = await sendSignupOTP(email, fullName, otp);
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send OTP email',
        message: 'Account created but email delivery failed. Please contact support.'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for OTP verification.',
      data: {
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
        emailSent: true
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Registration failed',
      message: 'An error occurred during registration. Please try again.'
    });
  }
};

/**
 * 2️⃣ EMAIL OTP VERIFICATION (SIGN UP)
 * POST /api/auth/verify-email
 */
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Verify OTP and activate account (skip validation for legacy records)
    const user = await UserModel.verifyOTP(email, otp);

    // Find complete user data
    const fullUser = await UserModel.findByEmail(email);

    // Generate JWT token
    const token = generateToken({
      id: fullUser.id,
      email: fullUser.email,
      role: fullUser.role
    });

    // Send welcome email
    await sendWelcomeEmail(email, user.fullName);

    res.json({
      success: true,
      message: 'Email verified successfully. Welcome to RAS Currys!',
      data: {
        token,
        user: {
          id: fullUser.id,
          fullName: fullUser.full_name || fullUser.fullName || 'User',
          email: fullUser.email,
          phoneNumber: fullUser.phone_number || fullUser.phoneNumber || null,
          phoneVerified: fullUser.phone_verified ?? fullUser.phoneVerified ?? false,
          phoneRequired: !(fullUser.phone_number || fullUser.phoneNumber),
          role: fullUser.role,
          emailVerified: true
        }
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Verification failed',
      message: 'Invalid or expired OTP. Please try again.'
    });
  }
};

/**
 * 3️⃣ USER LOGIN (SIGN IN)
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await UserModel.findByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Check if email is verified (regular users only, admins bypass this)
    if (!user.emailVerified && user.role === 'user') {
      return res.status(403).json({
        success: false,
        error: 'Email not verified',
        message: 'Please verify your email before logging in. Check your inbox for OTP.',
        needsVerification: true,
        email: user.email
      });
    }

    // Verify password with bcrypt
    const isValidPassword = await UserModel.verifyPassword(password, user.passwordHash);
    
    // Temporary debug logging (remove after testing)
    console.log('[LOGIN DEBUG]', {
      email: normalizedEmail,
      foundUser: !!user,
      emailVerified: user.emailVerified,
      hasPasswordHash: !!user.passwordHash,
      passwordMatch: isValidPassword
    });

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber || null,
          phoneVerified: user.phoneVerified,
          phoneRequired: !user.phoneNumber,
          role: user.role,
          emailVerified: user.emailVerified
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: 'An error occurred during login. Please try again.'
    });
  }
};

/**
 * 4️⃣ FORGOT PASSWORD — OTP BASED (EMAIL)
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Generate OTP for password reset
    const { otp, fullName } = await UserModel.generatePasswordResetOTP(email);

    // Send OTP via Gmail SMTP
    const emailResult = await sendPasswordResetOTP(email, fullName, otp);
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send OTP email',
        message: 'Unable to send password reset email. Please try again later.'
      });
    }

    res.json({
      success: true,
      message: 'Password reset OTP sent to your email. Valid for 10 minutes.',
      data: {
        email,
        emailSent: true
      }
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    
    // Don't reveal if email exists for security
    if (error.message === 'Email not registered' || error.message === 'Please verify your email first') {
      return res.status(400).json({
        success: false,
        error: error.message,
        message: 'Please check your email and try again.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process request',
      message: 'An error occurred. Please try again.'
    });
  }
};

/**
 * 5️⃣ RESET PASSWORD USING OTP
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Reset password
    await UserModel.resetPassword(email, otp, newPassword);

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.',
      data: {
        email,
        passwordReset: true
      }
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Password reset failed',
      message: 'Invalid or expired OTP. Please request a new one.'
    });
  }
};

/**
 * Resend OTP for unverified users
 * POST /api/auth/resend-otp
 */
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Generate new OTP
    const { otp, fullName } = await UserModel.resendOTP(email);

    // Send OTP via Gmail SMTP
    const emailResult = await sendSignupOTP(email, fullName, otp);
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send OTP email',
        message: 'Unable to resend OTP. Please try again later.'
      });
    }

    res.json({
      success: true,
      message: 'New OTP sent to your email',
      data: {
        email,
        emailSent: true
      }
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to resend OTP',
      message: 'Unable to resend OTP. Please check your email and try again.'
    });
  }
};

/**
 * Add phone number for authenticated user
 * POST /api/auth/add-phone
 */
export const addPhoneNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    const result = await UserModel.addPhoneNumber(req.user.userId, phoneNumber);

    res.json({
      success: true,
      message: 'Phone number added',
      data: {
        phoneNumber: result.phoneNumber,
        phoneVerified: result.phoneVerified,
        phoneRequired: false
      }
    });
  } catch (error) {
    if (error.message === 'PHONE_EXISTS') {
      return res.status(409).json({
        success: false,
        error: 'PHONE_EXISTS',
        message: 'This phone number is already in use'
      });
    }

    res.status(400).json({
      success: false,
      error: error.message || 'Failed to add phone number',
      message: 'Unable to add phone number'
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName || user.full_name,
          email: user.email,
          phoneNumber: user.phoneNumber || user.phone_number,
          phoneVerified: user.phoneVerified ?? user.phone_verified,
          phoneRequired: !(user.phoneNumber || user.phone_number),
          role: user.role,
          emailVerified: user.emailVerified ?? user.email_verified,
          createdAt: user.createdAt || user.created_at
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user data'
    });
  }
};
