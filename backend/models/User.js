import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

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
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[0-9]{10}$/, 'Phone number must be exactly 10 digits']
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
  otpExpiry: {
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
userSchema.index({ phoneNumber: 1 });
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
      
      // Generate 6-digit OTP
      const otpCode = crypto.randomInt(100000, 999999).toString();
      
      // OTP expires in 10 minutes
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      const user = await User.create({
        fullName,
        email: email.toLowerCase(),
        phoneNumber,
        passwordHash,
        role,
        otpCode,
        otpExpiry,
        emailVerified: false
      });

      return {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
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
   * Find user by email
   */
  static async findByEmail(email) {
    return await User.findOne({ email: email.toLowerCase() });
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
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email already verified');
    }

    if (!user.otpCode || user.otpCode !== otp) {
      throw new Error('Invalid OTP');
    }

    if (new Date() > new Date(user.otpExpiry)) {
      throw new Error('OTP expired');
    }

    // Mark email as verified and clear OTP
    user.emailVerified = true;
    user.otpCode = null;
    user.otpExpiry = null;
    await user.save();

    return {
      id: user._id,
      fullName: user.fullName,
      email: user.email
    };
  }

  /**
   * Generate new OTP for forgot password
   */
  static async generatePasswordResetOTP(email) {
    const user = await this.findByEmail(email);
    
    if (!user) {
      throw new Error('Email not registered');
    }

    if (!user.emailVerified) {
      throw new Error('Please verify your email first');
    }

    // Generate 6-digit OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otpCode = otpCode;
    user.otpExpiry = otpExpiry;
    await user.save();

    return { otp: otpCode, fullName: user.fullName };
  }

  /**
   * Reset password using OTP
   */
  static async resetPassword(email, otp, newPassword) {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.otpCode || user.otpCode !== otp) {
      throw new Error('Invalid OTP');
    }

    if (new Date() > new Date(user.otpExpiry)) {
      throw new Error('OTP expired');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password and clear OTP
    user.passwordHash = passwordHash;
    user.otpCode = null;
    user.otpExpiry = null;
    await user.save();

    return true;
  }

  /**
   * Resend OTP for unverified users
   */
  static async resendOTP(email) {
    const user = await this.findByEmail(email);
    
    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email already verified');
    }

    // Generate new OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otpCode = otpCode;
    user.otpExpiry = otpExpiry;
    await user.save();

    return { otp: otpCode, fullName: user.fullName };
  }

  /**
   * Get all users (admin only)
   */
  static async findAll() {
    return await User.find()
      .select('-passwordHash -otpCode -otpExpiry')
      .sort({ createdAt: -1 });
  }
}

// Create Mongoose model
const User = mongoose.model('User', userSchema);

export default UserModel;
export { User };
