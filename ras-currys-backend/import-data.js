#!/usr/bin/env node

/**
 * IMPORT SCRIPT: Bulk import localStorage export JSON into MongoDB
 * Usage: node import-data.js <path-to-data.json>
 * 
 * Example:
 *   node import-data.js ./data.json
 * 
 * data.json format:
 * {
 *   "products": [...],
 *   "users": [...],
 *   "orders": [...],
 *   "tickets": [...]
 * }
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { Product, User, Order, SupportTicket } = require('./models');

const hashPassword = (password, salt = 'ras_salt_secret') => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password + salt).digest('hex');
};

async function importData(filePath) {
  try {
    console.log('🔄 Starting data import from JSON...\n');

    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ras_currys');
    console.log('✓ MongoDB connected\n');

    // Read and parse JSON file
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    console.log(`📦 Found data:`);
    console.log(`   Products: ${(data.products || []).length}`);
    console.log(`   Users: ${(data.users || []).length}`);
    console.log(`   Orders: ${(data.orders || []).length}`);
    console.log(`   Tickets: ${(data.tickets || []).length}\n`);

    // Import Products
    if (data.products && data.products.length > 0) {
      console.log('📤 Importing products...');
      let successCount = 0;
      for (const product of data.products) {
        try {
          await Product.create({
            name: product.name,
            price: product.price,
            category: product.category,
            description: product.description,
            image: product.image,
            created_at: product.created_at || new Date()
          });
          successCount++;
        } catch (err) {
          console.warn(`   ⚠️  Skipped: ${product.name} (${err.message})`);
        }
      }
      console.log(`   ✓ ${successCount}/${data.products.length} products imported\n`);
    }

    // Import Users
    if (data.users && data.users.length > 0) {
      console.log('👥 Importing users...');
      let successCount = 0;
      const tempPassword = hashPassword('TempPassword123!');

      for (const user of data.users) {
        try {
          await User.create({
            name: user.name,
            email: user.email,
            passwordHash: tempPassword,
            role: user.role || 'user',
            created_at: user.created_at || new Date()
          });
          successCount++;
        } catch (err) {
          console.warn(`   ⚠️  Skipped: ${user.email} (${err.message})`);
        }
      }
      console.log(`   ✓ ${successCount}/${data.users.length} users imported`);
      console.log(`   ⚠️  All users set to temporary password: TempPassword123!\n`);
    }

    // Import Orders
    if (data.orders && data.orders.length > 0) {
      console.log('📦 Importing orders...');
      let successCount = 0;

      for (const order of data.orders) {
        try {
          await Order.create({
            user_id: order.user_id,
            user_name: order.user_name,
            items: order.items,
            total_amount: order.total_amount,
            status: order.status || 'pending',
            gateway_order_id: order.gateway_order_id,
            payment_gateway: order.payment_gateway,
            payment_id: order.payment_id,
            created_at: order.created_at || new Date()
          });
          successCount++;
        } catch (err) {
          console.warn(`   ⚠️  Skipped order (${err.message})`);
        }
      }
      console.log(`   ✓ ${successCount}/${data.orders.length} orders imported\n`);
    }

    // Import Tickets
    if (data.tickets && data.tickets.length > 0) {
      console.log('🎫 Importing support tickets...');
      let successCount = 0;

      for (const ticket of data.tickets) {
        try {
          await SupportTicket.create({
            issueSummary: ticket.issueSummary,
            urgency: ticket.urgency || 'LOW',
            userContact: ticket.userContact,
            status: ticket.status || 'open',
            created_by_user_id: ticket.created_by_user_id,
            created_at: ticket.created_at || new Date()
          });
          successCount++;
        } catch (err) {
          console.warn(`   ⚠️  Skipped ticket (${err.message})`);
        }
      }
      console.log(`   ✓ ${successCount}/${data.tickets.length} tickets imported\n`);
    }

    console.log('✅ Data import complete!');
    console.log('\n⚠️  IMPORTANT:');
    console.log('   • Users now use temporary password: TempPassword123!');
    console.log('   • Users should change password on next login');
    console.log('   • Check MongoDB to verify all data was imported');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Get file path from command line arguments
const filePath = process.argv[2];

if (!filePath) {
  console.error('\n❌ Usage: node import-data.js <path-to-data.json>');
  console.error('\nExample:');
  console.error('   node import-data.js ./data.json');
  console.error('   node import-data.js C:\\path\\to\\exported-data.json');
  process.exit(1);
}

importData(path.resolve(filePath));
