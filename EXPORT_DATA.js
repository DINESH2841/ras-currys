/**
 * EXPORT HELPER: Extract localStorage data as JSON file
 * 
 * Usage: Open this in browser DevTools console and paste the code
 * 
 * Steps:
 * 1. Open your app at http://localhost:3001
 * 2. Press F12 to open DevTools
 * 3. Click Console tab
 * 4. Paste this entire code and press Enter
 * 5. A JSON file will download automatically
 * 6. Use that file with import-data.js or the web migration tool
 */

(function exportLocalStorageData() {
  // Extract data from localStorage
  const products = JSON.parse(localStorage.getItem('ras_db_products') || '[]');
  const users = JSON.parse(localStorage.getItem('ras_db_users') || '[]');
  const orders = JSON.parse(localStorage.getItem('ras_db_orders') || '[]');
  const tickets = JSON.parse(localStorage.getItem('ras_db_tickets') || '[]');

  // Build export object
  const exportData = {
    exportDate: new Date().toISOString(),
    exportVersion: '1.0',
    dataCount: {
      products: products.length,
      users: users.length,
      orders: orders.length,
      tickets: tickets.length
    },
    data: {
      products,
      users,
      orders,
      tickets
    }
  };

  // Create blob and download
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ras-currys-export-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log('✅ Data exported successfully!');
  console.log('📊 Export summary:', exportData.dataCount);
  console.log('📁 File: ' + link.download);
  console.log('\nNext steps:');
  console.log('1. Use this file with: node import-data.js <file-path>');
  console.log('2. Or use the web migration tool at /migrate');
})();
