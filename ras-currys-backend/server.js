require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Product, User, Order, SupportTicket } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004', 'http://localhost:3005', 'http://127.0.0.1:3001'],
  credentials: true
}));

// ============ EMAIL SETUP ============
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Function to send OTP email
const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.GMAIL_EMAIL,
      to: email,
      subject: 'RAS Currys - Your OTP for Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #d97706; text-align: center;">RAS Currys 🍛</h2>
            <p style="color: #333; font-size: 16px;">Hello,</p>
            <p style="color: #333; font-size: 14px;">You requested a password reset. Use this OTP to proceed:</p>
            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
              <p style="font-size: 32px; font-weight: bold; color: #d97706; letter-spacing: 5px; margin: 0;">${otp}</p>
            </div>
            <p style="color: #666; font-size: 12px;">This OTP is valid for 10 minutes.</p>
            <p style="color: #333; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">RAS Currys - Authentic Indian Flavors</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Function to send signup verification email
const sendSignupEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.GMAIL_EMAIL,
      to: email,
      subject: 'RAS Currys - Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #d97706; text-align: center;">RAS Currys 🍛</h2>
            <p style="color: #333; font-size: 16px;">Welcome to RAS Currys!</p>
            <p style="color: #333; font-size: 14px;">Please verify your email using this OTP:</p>
            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
              <p style="font-size: 32px; font-weight: bold; color: #d97706; letter-spacing: 5px; margin: 0;">${otp}</p>
            </div>
            <p style="color: #666; font-size: 12px;">This OTP is valid for 10 minutes.</p>
            <p style="color: #333; font-size: 14px;">Thank you for joining us!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">RAS Currys - Authentic Indian Flavors</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Signup verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Utility: Hash password
const hashPassword = (password, salt = 'ras_salt_secret') => {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
};

// Utility: Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ============ MONGODB CONNECTION ============
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ras_currys', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✓ MongoDB connected'))
.catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  console.error('Ensure MongoDB is running (mongosh or MongoDB Compass)');
  process.exit(1);
});

// ============ PRODUCTS ============
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============ AUTHENTICATION ============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'Name, email, password, and phone are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate OTP for verification
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      phone,
      role: 'user',
      otp,
      otpExpiry,
      isEmailVerified: false
    });

    await user.save();

    // Send OTP email
    const emailSent = await sendSignupEmail(email, otp);

    res.status(201).json({
      success: true,
      message: 'Account created. OTP sent to your email.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// New endpoint to send OTP (for forgot password)
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'Email not found' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp);

    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send OTP email' });
    }

    res.json({ 
      success: true, 
      message: 'OTP sent to your email',
      email: email
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to verify OTP and reset password
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (!user.otpExpiry || Date.now() > user.otpExpiry) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    // Reset password
    user.passwordHash = hashPassword(newPassword);
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Password reset successfully' 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ USERS ============
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, { passwordHash: 0, otp: 0, otpExpiry: 0 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id, { passwordHash: 0, otp: 0, otpExpiry: 0 });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone, address },
      { new: true, select: '-passwordHash -otp -otpExpiry' }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id/role', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role === 'superadmin') {
      return res.status(403).json({ error: 'Cannot modify SUPERADMIN role' });
    }
    user.role = req.body.role;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role === 'superadmin') {
      return res.status(403).json({ error: 'Cannot delete SUPERADMIN' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ ORDERS ============
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============ SUPPORT TICKETS ============
app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await SupportTicket.find();
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tickets', async (req, res) => {
  try {
    const ticket = new SupportTicket(req.body);
    await ticket.save();
    res.status(201).json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/tickets/:id/status', async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============ STATS ============
app.get('/api/stats', async (req, res) => {
  try {
    const stats = {
      totalProducts: await Product.countDocuments(),
      totalUsers: await User.countDocuments(),
      totalOrders: await Order.countDocuments(),
      totalTickets: await SupportTicket.countDocuments(),
      paidOrders: await Order.countDocuments({ status: 'paid' }),
      resolvedTickets: await SupportTicket.countDocuments({ status: 'resolved' })
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ SERVER START ============
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log('📊 API ready for requests');
  console.log('🗄️  MongoDB connected\n');
});
