import OrderModel from '../models/Order.js';
import UserModel from '../models/User.js';

/**
 * Create a new order
 * POST /api/orders
 */
export const createOrder = async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;
    const userId = req.user.userId;

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ITEMS',
        message: 'Order must contain at least one item'
      });
    }

    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.price) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_ITEM',
          message: 'Each item must have productId, quantity, and price'
        });
      }
      totalAmount += item.price * item.quantity;
    }

    // Create order
    const order = await OrderModel.create({
      userId,
      items,
      totalAmount,
      paymentMethod
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.orderId,
        _id: order._id,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'FAILED_TO_CREATE_ORDER',
      message: 'Failed to create order. Please try again.'
    });
  }
};

/**
 * Get all orders for authenticated user
 * GET /api/orders
 */
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 10, skip = 0 } = req.query;

    const orders = await OrderModel.findByUserId(userId, {
      limit: parseInt(limit),
      skip: parseInt(skip)
    });

    res.json({
      success: true,
      data: {
        orders,
        count: orders.length
      }
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      error: 'FAILED_TO_FETCH_ORDERS',
      message: 'Failed to fetch orders'
    });
  }
};

/**
 * Get order by ID
 * GET /api/orders/:id
 */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const order = await OrderModel.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'ORDER_NOT_FOUND',
        message: 'Order not found'
      });
    }

    // Check ownership (unless admin)
    if (req.user.role === 'user' && order.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'You do not have permission to view this order'
      });
    }

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: 'FAILED_TO_FETCH_ORDER',
      message: 'Failed to fetch order'
    });
  }
};

/**
 * Update order status (admin only)
 * PUT /api/orders/:id
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, trackingNumber } = req.body;

    if (!orderStatus) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: 'Order status is required'
      });
    }

    // Update order status
    await OrderModel.updateOrderStatus(id, orderStatus);

    // Add tracking number if provided
    if (trackingNumber) {
      await OrderModel.addTrackingNumber(id, trackingNumber);
    }

    const updatedOrder = await OrderModel.findById(id);

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: { order: updatedOrder }
    });
  } catch (error) {
    if (error.message === 'Invalid order status') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: error.message
      });
    }

    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      error: 'FAILED_TO_UPDATE_ORDER',
      message: 'Failed to update order'
    });
  }
};

/**
 * Cancel order
 * DELETE /api/orders/:id
 */
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const order = await OrderModel.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'ORDER_NOT_FOUND',
        message: 'Order not found'
      });
    }

    // Check ownership (unless admin)
    if (req.user.role === 'user' && order.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'You do not have permission to cancel this order'
      });
    }

    // Can only cancel pending or confirmed orders
    if (!['pending', 'confirmed'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        error: 'CANNOT_CANCEL',
        message: 'Cannot cancel this order. Only pending and confirmed orders can be cancelled.'
      });
    }

    await OrderModel.cancelOrder(id);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        orderId: order.orderId,
        orderStatus: 'cancelled',
        paymentStatus: 'failed'
      }
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: 'FAILED_TO_CANCEL_ORDER',
      message: 'Failed to cancel order'
    });
  }
};

/**
 * Get all orders (admin only)
 * GET /api/orders/admin/all
 */
export const getAllOrders = async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;

    const orders = await OrderModel.findAll({
      limit: parseInt(limit),
      skip: parseInt(skip)
    });

    res.json({
      success: true,
      data: {
        orders,
        count: orders.length
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      error: 'FAILED_TO_FETCH_ORDERS',
      message: 'Failed to fetch orders'
    });
  }
};
