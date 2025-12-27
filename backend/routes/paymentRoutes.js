import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  handleWebhook
} from '../controllers/paymentController.js';
import { authenticateToken, requirePhoneNumber } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/payments/create
 * @desc    Create a Razorpay payment order
 * @access  Protected (authenticated + phone required)
 */
router.post('/create', authenticateToken, requirePhoneNumber, createPaymentOrder);

/**
 * @route   POST /api/payments/verify
 * @desc    Verify Razorpay payment signature
 * @access  Protected (authenticated + phone required)
 */
router.post('/verify', authenticateToken, requirePhoneNumber, verifyPayment);

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Razorpay webhook
 * @access  Public (signature verified)
 */
router.post('/webhook', handleWebhook);

export default router;
