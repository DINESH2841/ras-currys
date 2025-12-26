const mongoose = require('mongoose');

// Product Schema
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  category: { type: String, enum: ['Currys', 'Pickles'], required: true },
  description: String,
  image: String,
  created_at: { type: Date, default: Date.now }
});

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  phone: { type: String, default: null },
  address: { type: String, default: null },
  role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null },
  isEmailVerified: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

// Order Schema
const OrderSchema = new mongoose.Schema({
  user_id: String,
  user_name: String,
  items: [{
    id: String,
    name: String,
    price: Number,
    quantity: Number,
    category: String
  }],
  total_amount: Number,
  status: { type: String, enum: ['pending', 'paid', 'delivered', 'cancelled'], default: 'pending' },
  gateway_order_id: String,
  payment_gateway: String,
  payment_id: String,
  created_at: { type: Date, default: Date.now }
});

// Support Ticket Schema
const SupportTicketSchema = new mongoose.Schema({
  issueSummary: String,
  urgency: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
  userContact: String,
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  created_by_user_id: String,
  created_at: { type: Date, default: Date.now }
});

// Create models
const Product = mongoose.model('Product', ProductSchema);
const User = mongoose.model('User', UserSchema);
const Order = mongoose.model('Order', OrderSchema);
const SupportTicket = mongoose.model('SupportTicket', SupportTicketSchema);

module.exports = {
  Product,
  User,
  Order,
  SupportTicket,
  ProductSchema,
  UserSchema,
  OrderSchema,
  SupportTicketSchema
};
