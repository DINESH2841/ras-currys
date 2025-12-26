import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { Order, OrderStatus } from '../types';
import { useAuth } from '../services/authContext';
import { Loader2, Package, ArrowRight, ShoppingBag } from 'lucide-react';
import Button from '../components/Button';

const Orders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const data = await apiClient.getOrders(user.id);
      // Sort by newest first
      setOrders(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.PAID: return 'bg-green-100 text-green-800 border-green-200';
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OrderStatus.FAILED: return 'bg-red-100 text-red-800 border-red-200';
      case OrderStatus.DELIVERED: return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full border border-gray-100">
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-8 w-8 text-brand-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-8">You haven't placed any orders yet. Delicious food awaits!</p>
          <Link to="/" className="inline-block w-full">
            <Button className="w-full">Explore Menu</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <Link to="/">
            <Button variant="outline" size="sm">Continue Shopping</Button>
          </Link>
        </div>

        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="text-sm text-gray-500">Order ID</div>
                  <div className="font-mono font-medium text-gray-900">{order.id}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Date Placed</div>
                  <div className="font-medium text-gray-900">{new Date(order.created_at).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Amount</div>
                  <div className="font-bold text-brand-600 text-lg">₹{order.total_amount}</div>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-4">Items</h4>
                <ul className="divide-y divide-gray-100">
                  {order.items.map((item, index) => (
                    <li key={`${order.id}-${index}`} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.category}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-900">
                        <span className="text-gray-500 mr-2">{item.quantity} x</span>
                        ₹{item.price}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              {order.status === OrderStatus.PAID && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-500 flex items-center">
                    <Package className="h-4 w-4 mr-1" />
                    Estimated Delivery: 30-45 mins
                  </span>
                  <span className="text-xs text-gray-400">Payment ID: {order.payment_id}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Orders;