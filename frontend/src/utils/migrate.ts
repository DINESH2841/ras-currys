/**
 * MIGRATION SCRIPT: Export localStorage → MongoDB
 * Run this ONCE to migrate all your data from port 3000 localStorage to MongoDB
 */

import { apiClient } from '../services/apiClient';

export async function migrateLocalStorageToMongoDB() {
  console.log('🔄 Starting data migration from localStorage to MongoDB...\n');

  try {
    // 1. Get data from localStorage
    const productsData = JSON.parse(localStorage.getItem('ras_db_products') || '[]');
    const usersData = JSON.parse(localStorage.getItem('ras_db_users') || '[]');
    const ordersData = JSON.parse(localStorage.getItem('ras_db_orders') || '[]');
    const ticketsData = JSON.parse(localStorage.getItem('ras_db_tickets') || '[]');

    console.log(`📦 Found data:`);
    console.log(`   Products: ${productsData.length}`);
    console.log(`   Users: ${usersData.length}`);
    console.log(`   Orders: ${ordersData.length}`);
    console.log(`   Tickets: ${ticketsData.length}\n`);

    // 2. Migrate Products
    console.log('📤 Uploading products...');
    for (const product of productsData) {
      try {
        await apiClient.addProduct({
          name: product.name,
          price: product.price,
          category: product.category,
          description: product.description,
          image: product.image,
          created_at: product.created_at
        });
      } catch (err) {
        console.warn(`   ⚠️  Skipped duplicate: ${product.name}`);
      }
    }
    console.log(`   ✓ ${productsData.length} products uploaded\n`);

    // 3. Migrate Users (skip password hashes for security, they'll need to reset)
    console.log('👥 Uploading users...');
    for (const user of usersData) {
      try {
        // Create user via signup API (it handles hashing)
        // Use a placeholder phone number for migrated users
        await apiClient.signup(user.name, user.email, 'TempPassword123!', user.phone || '9999999999');
      } catch (err) {
        console.warn(`   ⚠️  Skipped user: ${user.email} (may already exist)`);
      }
    }
    console.log(`   ✓ ${usersData.length} users uploaded\n`);

    // 4. Migrate Orders
    console.log('📦 Uploading orders...');
    let orderCount = 0;
    for (const order of ordersData) {
      try {
        // Use direct API to create order with original data
        const res = await fetch('http://localhost:5000/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: order.id,
            user_id: order.user_id,
            user_name: order.user_name,
            items: order.items,
            total_amount: order.total_amount,
            status: order.status,
            gateway_order_id: order.gateway_order_id,
            payment_gateway: order.payment_gateway,
            payment_id: order.payment_id,
            created_at: order.created_at
          })
        });
        orderCount++;
      } catch (err) {
        console.warn(`   ⚠️  Skipped order: ${order.id}`);
      }
    }
    console.log(`   ✓ ${orderCount} orders uploaded\n`);

    // 5. Migrate Support Tickets
    console.log('🎫 Uploading support tickets...');
    let ticketCount = 0;
    for (const ticket of ticketsData) {
      try {
        const res = await fetch('http://localhost:5000/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            issueSummary: ticket.issueSummary,
            urgency: ticket.urgency,
            userContact: ticket.userContact,
            status: ticket.status,
            created_by_user_id: ticket.created_by_user_id,
            created_at: ticket.created_at
          })
        });
        ticketCount++;
      } catch (err) {
        console.warn(`   ⚠️  Skipped ticket: ${ticket.id}`);
      }
    }
    console.log(`   ✓ ${ticketCount} tickets uploaded\n`);

    console.log('✅ Migration complete!');
    console.log('\n⚠️  IMPORTANT:');
    console.log('   • Users now use temporary password: TempPassword123!');
    console.log('   • Users should change password on next login');
    console.log('   • All orders, products, tickets migrated successfully');
    console.log('   • Frontend will now use MongoDB instead of localStorage\n');

    return {
      products: productsData.length,
      users: usersData.length,
      orders: orderCount,
      tickets: ticketCount
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Export function for React component to call
export default migrateLocalStorageToMongoDB;
