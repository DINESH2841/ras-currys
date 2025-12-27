import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getAllOrders
} from '../controllers/orderController.js';
import { authenticateToken, requirePhoneNumber, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Protected (authenticated + phone required)
 */
router.post('/', authenticateToken, requirePhoneNumber, createOrder);

/**
 * @route   GET /api/orders
 * @desc    Get all orders for authenticated user
 * @access  Protected
 */
router.get('/', authenticateToken, requirePhoneNumber, getUserOrders);

/**
 * @route   GET /api/orders/admin/all
 * @desc    Get all orders (admin only)
 * @access  Protected (admin)
 */
router.get('/admin/all', authenticateToken, requireAdmin, getAllOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Protected
 */
router.get('/:id', authenticateToken, requirePhoneNumber, getOrderById);

/**
 * @route   PUT /api/orders/:id
 * @desc    Update order status (admin only)
 * @access  Protected (admin)
 */
router.put('/:id', authenticateToken, requireAdmin, updateOrderStatus);

/**
 * @route   DELETE /api/orders/:id
 * @desc    Cancel order
 * @access  Protected
 */
router.delete('/:id', authenticateToken, requirePhoneNumber, cancelOrder);

export default router;
