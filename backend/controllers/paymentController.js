import crypto from 'crypto';
import OrderModel, { Order } from '../models/Order.js';
import { logger } from '../config/logger.js';

/**
 * Create a Razorpay order
 * POST /api/payments/create
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.userId;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'ORDER_ID_REQUIRED',
        message: 'Order ID is required'
      });
    }

    // Fetch order
    const order = await OrderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'ORDER_NOT_FOUND',
        message: 'Order not found'
      });
    }

    // Verify ownership
    if (order.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'You do not have permission to access this order'
      });
    }

    // Check if payment is already completed
    if (order.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'ALREADY_PAID',
        message: 'This order has already been paid'
      });
    }

    // Create Razorpay order (client will receive key_id and order creation)
    // NOTE: Actual Razorpay API call would happen here in production
    // For now, return a response structure that the frontend can use

    res.json({
      success: true,
      message: 'Payment order created',
      data: {
        orderId: order._id,
        amount: order.totalAmount,
        currency: 'INR',
        razorpayKeyId: process.env.RAZORPAY_KEY,
        receipt: order.orderId,
        // In production, you would call Razorpay API and get an order ID
        // razorpayOrderId: 'order_XXXXX'
      }
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({
      success: false,
      error: 'FAILED_TO_CREATE_PAYMENT',
      message: 'Failed to create payment order'
    });
  }
};

/**
 * Verify Razorpay payment signature
 * POST /api/payments/verify
 */
export const verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    const userId = req.user.userId;

    if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_PAYMENT_DATA',
        message: 'All payment verification data is required'
      });
    }

    // Fetch order
    const order = await OrderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'ORDER_NOT_FOUND',
        message: 'Order not found'
      });
    }

    // Verify ownership
    if (order.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'You do not have permission to verify this payment'
      });
    }

    // Verify Razorpay signature on server side (CRITICAL - never trust frontend)
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      console.error('Signature mismatch:', {
        expected: expectedSignature,
        received: razorpaySignature
      });

      return res.status(400).json({
        success: false,
        error: 'SIGNATURE_MISMATCH',
        message: 'Payment verification failed. Signature mismatch.'
      });
    }

    // Update order payment status to completed
    await OrderModel.updatePaymentStatus(orderId, 'completed', razorpayPaymentId);
    await OrderModel.updateRazorpayDetails(orderId, razorpayOrderId, razorpayPaymentId);

    // Update order status to confirmed
    await OrderModel.updateOrderStatus(orderId, 'confirmed');

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        orderId: order._id,
        paymentStatus: 'completed',
        orderStatus: 'confirmed'
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      error: 'PAYMENT_VERIFICATION_FAILED',
      message: 'Failed to verify payment'
    });
  }
};

/**
 * Handle Razorpay webhook
 * POST /api/payments/webhook
 */
export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      logger.warn('Webhook signature mismatch', {
        received: signature,
        expected: expectedSignature,
        event: req.body?.event
      });
      return res.status(400).json({
        success: false,
        error: 'SIGNATURE_MISMATCH',
        message: 'Webhook signature verification failed'
      });
    }

    // Handle webhook events
    const event = req.body.event;
    const eventData = req.body.payload.payment.entity;

    logger.info('Razorpay webhook received', {
      event,
      paymentId: eventData?.id,
      orderId: eventData?.order_id
    });

    if (event === 'payment.authorized' || event === 'payment.captured') {
      // Find order by razorpay order ID
      const order = await Order.findOne({ razorpayOrderId: eventData.order_id });

      if (order) {
        await OrderModel.updatePaymentStatus(order._id, 'completed', eventData.id);
        await OrderModel.updateOrderStatus(order._id, 'confirmed');

        logger.info('Payment completed via webhook', {
          orderId: order._id,
          paymentId: eventData.id,
          event
        });
      }
    } else if (event === 'payment.failed') {
      const order = await Order.findOne({ razorpayOrderId: eventData.order_id });

      if (order) {
        await OrderModel.updatePaymentStatus(order._id, 'failed');

        logger.warn('Payment failed via webhook', {
          orderId: order._id,
          paymentId: eventData.id,
          reason: eventData.error_reason
        });
      }
    } else {
      logger.info(`Webhook event ${event} received but not processed`);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({
      success: true,
      message: 'Webhook processed'
    });
  } catch (error) {
    logger.error('Webhook processing error', {
      error: error.message,
      stack: error.stack
    });
    // Still return 200 to prevent Razorpay from retrying
    res.status(200).json({
      success: false,
      message: 'Webhook processed with error'
    });
  }
};

export default {
  createPaymentOrder,
  verifyPayment,
  handleWebhook
};
