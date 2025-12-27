import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: [true, 'Product ID is required']
        },
        quantity: {
          type: Number,
          required: [true, 'Quantity is required'],
          min: [1, 'Quantity must be at least 1']
        },
        price: {
          type: Number,
          required: [true, 'Price is required'],
          min: [0, 'Price cannot be negative']
        }
      }
    ],
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'credit_card', 'debit_card', 'upi', 'net_banking'],
      required: [true, 'Payment method is required']
    },
    paymentId: {
      type: String,
      default: null
    },
    razorpayOrderId: {
      type: String,
      default: null,
      index: true
    },
    razorpayPaymentId: {
      type: String,
      default: null
    },
    shippingAddress: {
      type: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
      },
      required: false
    },
    trackingNumber: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Indexes for queries
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });

// Model methods
class OrderModel {
  /**
   * Create a new order
   */
  static async create({ userId, items, totalAmount, paymentMethod }) {
    try {
      const order = await Order.create({
        userId,
        items,
        totalAmount,
        paymentMethod,
        orderStatus: 'pending',
        paymentStatus: 'pending'
      });

      return {
        orderId: order.orderId,
        _id: order._id,
        userId: order.userId,
        items: order.items,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find order by ID
   */
  static async findById(orderId) {
    return await Order.findById(orderId).populate('userId', 'fullName email phoneNumber');
  }

  /**
   * Find order by orderId (custom ID)
   */
  static async findByOrderId(orderId) {
    return await Order.findOne({ orderId }).populate('userId', 'fullName email phoneNumber');
  }

  /**
   * Find orders by user ID
   */
  static async findByUserId(userId, options = {}) {
    const { limit = 10, skip = 0, sortBy = '-createdAt' } = options;

    return await Order.find({ userId })
      .populate('userId', 'fullName email phoneNumber')
      .sort(sortBy)
      .limit(limit)
      .skip(skip);
  }

  /**
   * Find all orders (admin)
   */
  static async findAll(options = {}) {
    const { limit = 20, skip = 0, sortBy = '-createdAt' } = options;

    return await Order.find()
      .populate('userId', 'fullName email phoneNumber')
      .sort(sortBy)
      .limit(limit)
      .skip(skip);
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(orderId, status) {
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      throw new Error('Invalid order status');
    }

    return await Order.updateOne(
      { _id: orderId },
      { $set: { orderStatus: status, updatedAt: new Date() } },
      { runValidators: false }
    );
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(orderId, paymentStatus, paymentId = null) {
    const validStatuses = ['pending', 'completed', 'failed'];

    if (!validStatuses.includes(paymentStatus)) {
      throw new Error('Invalid payment status');
    }

    const updateData = { paymentStatus, updatedAt: new Date() };
    if (paymentId) {
      updateData.paymentId = paymentId;
    }

    return await Order.updateOne(
      { _id: orderId },
      { $set: updateData },
      { runValidators: false }
    );
  }

  /**
   * Update Razorpay payment details
   */
  static async updateRazorpayDetails(orderId, razorpayOrderId, razorpayPaymentId = null) {
    const updateData = { razorpayOrderId, updatedAt: new Date() };
    if (razorpayPaymentId) {
      updateData.razorpayPaymentId = razorpayPaymentId;
    }

    return await Order.updateOne(
      { _id: orderId },
      { $set: updateData },
      { runValidators: false }
    );
  }

  /**
   * Cancel order
   */
  static async cancelOrder(orderId) {
    return await Order.updateOne(
      { _id: orderId },
      {
        $set: {
          orderStatus: 'cancelled',
          paymentStatus: 'failed',
          updatedAt: new Date()
        }
      },
      { runValidators: false }
    );
  }

  /**
   * Add tracking number
   */
  static async addTrackingNumber(orderId, trackingNumber) {
    return await Order.updateOne(
      { _id: orderId },
      { $set: { trackingNumber, updatedAt: new Date() } },
      { runValidators: false }
    );
  }
}

// Create Mongoose model
const Order = mongoose.model('Order', orderSchema);

export default OrderModel;
export { Order };
