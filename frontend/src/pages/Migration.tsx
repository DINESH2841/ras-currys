import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Loader, Server, Database } from 'lucide-react';

// Migration function inline to avoid path issues
const migrateLocalStorageToMongoDB = async () => {
  const API_BASE = 'http://localhost:5000/api';
  
  // Get data from localStorage - check all possible keys
  let productsData = JSON.parse(localStorage.getItem('ras_db_products') || '[]');
  let usersData = JSON.parse(localStorage.getItem('ras_db_users') || '[]');
  let ordersData = JSON.parse(localStorage.getItem('ras_db_orders') || '[]');
  let ticketsData = JSON.parse(localStorage.getItem('ras_db_tickets') || '[]');

  // Debug: log what we found
  console.log('Found in localStorage:', {
    products: productsData.length,
    users: usersData.length,
    orders: ordersData.length,
    tickets: ticketsData.length,
    allKeys: Object.keys(localStorage).filter(k => k.startsWith('ras_'))
  });

  let stats = { products: 0, users: 0, orders: 0, tickets: 0 };

  // Migrate products
  for (const product of productsData) {
    try {
      await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      stats.products++;
    } catch (err) {
      console.warn('Skipped product:', product.name);
    }
  }

  // Migrate users
  for (const user of usersData) {
    try {
      await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.name, email: user.email, password: 'TempPassword123!' })
      });
      stats.users++;
    } catch (err) {
      console.warn('Skipped user:', user.email);
    }
  }

  // Migrate orders
  for (const order of ordersData) {
    try {
      await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      stats.orders++;
    } catch (err) {
      console.warn('Skipped order:', order.id);
    }
  }

  // Migrate tickets
  for (const ticket of ticketsData) {
    try {
      await fetch(`${API_BASE}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket)
      });
      stats.tickets++;
    } catch (err) {
      console.warn('Skipped ticket:', ticket.id);
    }
  }

  return stats;
};

type MigrationStatus = 'idle' | 'running' | 'success' | 'error';

interface MigrationResult {
  products: number;
  users: number;
  orders: number;
  tickets: number;
}

export default function MigrationPage() {
  const [status, setStatus] = useState<MigrationStatus>('idle');
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string>('');
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Check if backend is online (poll every 3 seconds)
  React.useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/products', {
          method: 'GET'
        });
        setBackendOnline(res.ok);
      } catch {
        setBackendOnline(false);
      }
    };
    
    // Check immediately
    checkBackend();
    
    // Then check every 3 seconds
    const interval = setInterval(checkBackend, 3000);
    
    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  const handleMigrate = async () => {
    if (!backendOnline) {
      setError('❌ Backend not running! Start: npm start in ras-currys-backend folder');
      return;
    }

    setStatus('running');
    setError('');
    setResult(null);

    try {
      const migrationResult = await migrateLocalStorageToMongoDB();
      setResult(migrationResult);
      setStatus('success');
    } catch (err: any) {
      setError(err.message || 'Migration failed');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Data Migration</h1>
          </div>
          <p className="text-gray-600">
            Migrate your existing data from browser localStorage to MongoDB
          </p>
        </div>

        {/* Backend Status */}
        <div
          className={`rounded-lg p-6 mb-6 flex items-center gap-3 ${
            backendOnline === null
              ? 'bg-gray-50 border border-gray-200'
              : backendOnline
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <Server
            className={`w-6 h-6 ${
              backendOnline === null
                ? 'text-gray-400'
                : backendOnline
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">Backend Status</h3>
            <p className="text-sm">
              {backendOnline === null
                ? 'Checking...'
                : backendOnline
                ? '✓ Backend is online at http://localhost:5000'
                : '✗ Backend not running. Run: npm start in ras-currys-backend/'}
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">Before You Start:</h3>
          <ol className="text-sm text-blue-800 space-y-2">
            <li>
              <strong>1. Start MongoDB:</strong> Install MongoDB or use MongoDB Atlas (cloud)
            </li>
            <li>
              <strong>2. Start Backend:</strong> Open terminal in `ras-currys-backend/` and run
              <code className="bg-blue-100 px-2 py-1 rounded ml-2">npm start</code>
            </li>
            <li>
              <strong>3. Verify Connection:</strong> Backend status should show green ✓ above
            </li>
            <li>
              <strong>4. Run Migration:</strong> Click the button below to import all data
            </li>
          </ol>
        </div>

        {/* Migration Button */}
        <button
          onClick={handleMigrate}
          disabled={status === 'running' || !backendOnline}
          className={`w-full py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center gap-3 transition-all ${
            status === 'running'
              ? 'bg-blue-400 text-white cursor-wait'
              : backendOnline
              ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
        >
          {status === 'running' && <Loader className="w-5 h-5 animate-spin" />}
          {status === 'success' && <CheckCircle className="w-5 h-5" />}
          {status === 'error' && <AlertCircle className="w-5 h-5" />}
          {status === 'idle' && 'Start Migration'}
          {status === 'running' && 'Migrating...'}
          {status === 'success' && 'Migration Complete!'}
          {status === 'error' && 'Retry Migration'}
        </button>

        {/* Results */}
        {result && status === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-green-900 mb-3">✓ All data migrated successfully!</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded p-3">
                    <div className="text-2xl font-bold text-green-600">{result.products}</div>
                    <div className="text-sm text-gray-600">Products</div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="text-2xl font-bold text-green-600">{result.users}</div>
                    <div className="text-sm text-gray-600">Users</div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="text-2xl font-bold text-green-600">{result.orders}</div>
                    <div className="text-sm text-gray-600">Orders</div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="text-2xl font-bold text-green-600">{result.tickets}</div>
                    <div className="text-sm text-gray-600">Support Tickets</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 border border-blue-200">
              <strong>Next Step:</strong> All users now need to use temporary password: <code>TempPassword123!</code> and change it on next login.
            </div>
          </div>
        )}

        {/* Errors */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">Migration Failed</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
