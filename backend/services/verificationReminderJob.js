import mongoose from 'mongoose';
import UserModel, { User } from '../models/User.js';
import { sendSignupOTP } from './emailService.js';
import { logger } from '../config/logger.js';

const DAILY_LIMIT = Math.min(Math.max(Number(process.env.VERIFICATION_REMINDER_DAILY_LIMIT || 50), 1), 50);
const DAY_MS = 24 * 60 * 60 * 1000;

const usageSchema = new mongoose.Schema({
  day: { type: String, unique: true, required: true },
  sentCount: { type: Number, default: 0 }
}, { versionKey: false });
const VerificationReminderUsage = mongoose.models.VerificationReminderUsage || mongoose.model('VerificationReminderUsage', usageSchema);

const reserveDailySend = async () => {
  const day = new Date().toISOString().slice(0, 10);
  try {
    return await VerificationReminderUsage.findOneAndUpdate(
      { day, sentCount: { $lt: DAILY_LIMIT } },
      { $setOnInsert: { day }, $inc: { sentCount: 1 } },
      { upsert: true, new: true }
    );
  } catch (error) {
    // A concurrent Render instance may create today's record first; retry once.
    if (error?.code === 11000) return VerificationReminderUsage.findOneAndUpdate(
      { day, sentCount: { $lt: DAILY_LIMIT } }, { $inc: { sentCount: 1 } }, { new: true }
    );
    throw error;
  }
};

export const sendVerificationReminders = async () => {
  const cutoff = new Date(Date.now() - DAY_MS);
  const candidates = await User.find({
    emailVerified: false,
    createdAt: { $lt: cutoff },
    $or: [{ lastVerificationReminderAt: null }, { lastVerificationReminderAt: { $lt: cutoff } }]
  }).sort({ lastVerificationReminderAt: 1, createdAt: 1 }).limit(DAILY_LIMIT).select('_id email fullName');

  let attempted = 0;
  for (const candidate of candidates) {
    if (!await reserveDailySend()) break;
    attempted += 1;
    try {
      const { otp, fullName } = await UserModel.resendOTP(candidate.email);
      const result = await sendSignupOTP(candidate.email, fullName, otp);
      if (result.success) await User.updateOne({ _id: candidate._id }, { $set: { lastVerificationReminderAt: new Date() } });
    } catch (error) {
      logger.warn('Verification reminder failed', { userId: candidate._id.toString(), error: error.message });
    }
  }
  logger.info('Verification reminder sweep completed', { attempted, dailyLimit: DAILY_LIMIT });
};

export const startVerificationReminderJob = () => {
  if (process.env.ENABLE_VERIFICATION_REMINDER_SWEEP !== 'true') return;
  sendVerificationReminders().catch(error => logger.error('Verification reminder sweep failed', { error: error.message }));
  setInterval(() => sendVerificationReminders().catch(error => logger.error('Verification reminder sweep failed', { error: error.message })), DAY_MS).unref();
};
