import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { hashOTP, verifyOTP, generateOTPCode, getOTPExpiry } from '../utils/otpHelper.js';
import { logger } from '../config/logger.js';

const SALT_ROUNDS = 12; // Enterprise-grade bcrypt rounds

// User Schema
const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [255, 'Name must not exceed 255 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  phoneNumber: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    match: [/^[0-9]{10}$/, 'Phone number must be exactly 10 digits']
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  otpCode: {
    type: String,
    default: null
  },
  otpCodeHash: {
    type: String,
    default: null
  },
  otpExpiry: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  loginLockUntil: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 }, { unique: true, sparse: true });
userSchema.index({ otpCode: 1 });
userSchema.index({ emailVerified: 1 });

// Model methods
class UserModel {
  /**
   * Create a new user (registration)
   */
  static async create({ fullName, email, phoneNumber, password, role = 'user' }) {
    try {
      // Hash password with bcrypt
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      
      // Generate 6-digit OTP and hash it
      const otpCode = generateOTPCode();
      const otpCodeHash = hashOTP(otpCode);
      
      // OTP expires in 10 minutes
      const otpExpiry = getOTPExpiry();

      const user = await User.create({
        fullName,
        email: email.toLowerCase().trim(),
        phoneNumber: phoneNumber || undefined,
        phoneVerified: false,
        passwordHash,
        role,
        otpCode: null, // Don't store plain OTP anymore
        otpCodeHash,   // Store hashed OTP instead
        otpExpiry,
        emailVerified: false
      });

      return {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          phoneVerified: user.phoneVerified,
          role: user.role,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt
        },
        otp: otpCode
      };
    } catch (error) {
      if (error.code === 11000) { // Duplicate key error
        throw new Error('Email already registered');
      }
      throw error;
    }
  }

  /**
   * Find user by email (normalized)
   */
  static async findByEmail(email) {
    return await User.findOne({ email: email.toLowerCase().trim() });
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    return await User.findById(id).select('-passwordHash -otpCode -otpExpiry');
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, passwordHash) {
    return await bcrypt.compare(plainPassword, passwordHash);
  }

  /**
   * Verify OTP and activate account
   */
  static async verifyOTP(email, otp) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email already verified');
    }

    // Check OTP expiry first
    if (new Date() > new Date(user.otpExpiry)) {
      throw new Error('OTP expired');
    }

    // Verify hashed OTP
    if (!user.otpCodeHash || !verifyOTP(otp, user.otpCodeHash)) {
      throw new Error('Invalid OTP');
    }

    // Mark email as verified and clear OTP without re-validating legacy missing fields
    // CRITICAL: Do NOT touch passwordHash here
    await User.updateOne(
      { _id: user._id },
      { $set: { emailVerified: true, otpCode: null, otpCodeHash: null, otpExpiry: null } },
      { runValidators: false }
    );

    return {
      id: user._id,
      fullName: user.fullName || user.full_name || 'User',
      email: user.email
    };
  }
      throw new Error('OTP expired');
    }

    // Mark email as verified and clear OTP without re-validating legacy missing fields
    // CRITICAL: Do NOT touch passwordHash here
    await User.updateOne(
      { _id: user._id },
      { $set: { emailVerified: true, otpCode: null, otpExpiry: null } },
      { runValidators: false }
    );

    return {
      id: user._id,
      fullName: user.fullName || user.full_name || 'User',
      email: user.email
    };
  }

  /**
   * Add or update phone number for a user
   */
  static async addPhoneNumber(userId, phoneNumber) {
    const normalized = (phoneNumber || '').trim();

    if (!/^[0-9]{10}$/.test(normalized)) {
      throw new Error('Invalid phone number format');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // If the same number is already set, short-circuit
    if (user.phoneNumber === normalized) {
      return { phoneNumber: user.phoneNumber, phoneVerified: user.phoneVerified };
    }

    // Use updateOne to avoid triggering password re-hash or validation
    try {
      await User.updateOne(
        { _id: userId },
        { $set: { phoneNumber: normalized, phoneVerified: false } },
        { runValidators: false }
      );
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('PHONE_EXISTS');
      }
      throw error;
    }

    return { phoneNumber: normalized, phoneVerified: false };
  }

  /**
   * Generate new OTP for forgot password
   */
  static async generatePasswordResetOTP(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      throw new Error('Email not registered');
    }

    if (!user.emailVerified) {
      throw new Error('Please verify your email first');
    }

    // Generate 6-digit OTP and hash it
    const otpCode = generateOTPCode();
    const otpCodeHash = hashOTP(otpCode);
    const otpExpiry = getOTPExpiry();

    // Use updateOne to avoid touching passwordHash
    await User.updateOne(
      { _id: user._id },
      { $set: { otpCode: null, otpCodeHash, otpExpiry } },
      { runValidators: false }
    );

    return { otp: otpCode, fullName: user.fullName || user.full_name || 'User' };
  }

  /**
   * Reset password using OTP
   */
  static async resetPassword(email, otp, newPassword) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      throw new Error('User not found');
    }

    // Check OTP expiry first
    if (new Date() > new Date(user.otpExpiry)) {
      throw new Error('OTP expired');
    }

    // Verify hashed OTP
    if (!user.otpCodeHash || !verifyOTP(otp, user.otpCodeHash)) {
      throw new Error('Invalid OTP');
    }

    // Hash new password with bcrypt (ONLY allowed place besides registration)
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password and clear OTP without re-validating legacy missing fields
    await User.updateOne(
      { _id: user._id },
      { $set: { passwordHash, otpCode: null, otpCodeHash: null, otpExpiry: null } },
      { runValidators: false }
    );

    return true;
  }

  /**
   * Resend OTP for unverified users
   */
  static async resendOTP(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email already verified');
    }

    // Generate new OTP and hash it
    const otpCode = generateOTPCode();
    const otpCodeHash = hashOTP(otpCode);
    const otpExpiry = getOTPExpiry();

    // Use updateOne to avoid touching passwordHash
    await User.updateOne(
      { _id: user._id },
      { $set: { otpCode: null, otpCodeHash, otpExpiry } },
      { runValidators: false }
    );

    return { otp: otpCode, fullName: user.fullName || user.full_name || 'User' };
  }

  /**
   * Get all users (admin only)
   */
  static async findAll() {
    return await User.find()
      .select('-passwordHash -otpCode -otpExpiry')
      .sort({ createdAt: -1 });
  }

  /**
   * Check if account is locked due to too many failed login attempts
   */
  static async isAccountLocked(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return { locked: false };
    }

    if (user.loginLockUntil && new Date() < user.loginLockUntil) {
      return {
        locked: true,
        lockedUntil: user.loginLockUntil,
        message: 'Account is temporarily locked due to too many failed login attempts.'
      };
    }

    return { locked: false };
  }

  /**
   * Record failed login attempt
   */
  static async recordFailedLogin(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return;
    }

    const newAttempts = (user.loginAttempts || 0) + 1;
    const lockUntil = newAttempts >= 10 ? new Date(Date.now() + 15 * 60 * 1000) : null; // 15 min lock

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          loginAttempts: newAttempts,
          loginLockUntil: lockUntil
        }
      },
      { runValidators: false }
    );

    return { attempts: newAttempts, locked: !!lockUntil };
  }

  /**
   * Reset login attempts on successful login
   */
  static async resetLoginAttempts(email) {
    const normalizedEmail = email.toLowerCase().trim();

    await User.updateOne(
      { email: normalizedEmail },
      {
        $set: {
          loginAttempts: 0,
          loginLockUntil: null
        }
      },
      { runValidators: false }
    );
  }
}

// Create Mongoose model
const User = mongoose.model('User', userSchema);

export default UserModel;
export { User };
