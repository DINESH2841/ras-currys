import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { Order, OrderStatus } from '../../types';
import { Loader2 } from 'lucide-react';

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await apiClient.getOrders();
      // Sort by created_at desc
      setOrders(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    // 1. Confirm with user
    // We use a timeout to let the select 'change' event bubble and UI paint before blocking with alert
    // This helps prevent UI freezing in a weird state in some browsers
    setTimeout(async () => {
        const confirmed = window.confirm(`Update status to ${newStatus}?`);
        
        if (!confirmed) {
            // Force a re-render to reset the select dropdown to its original value (from state)
            // This is needed because the browser might have visually changed the selection
            setOrders(prev => [...prev]);
            return;
        }

        setUpdatingId(orderId);
        try {
            // 2. Call API
            const updated = await apiClient.updateOrderStatus(orderId, newStatus);
            
            if (updated) {
                // 3. Update Local State safely
                setOrders(prevOrders => 
                    prevOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
                );
            } else {
                alert("Failed to update order status. Order might not exist.");
                setOrders(prev => [...prev]); // Revert
            }
        } catch (error) {
            console.error("Failed to update status", error);
            alert("An error occurred while updating status.");
            setOrders(prev => [...prev]); // Revert
        } finally {
            setUpdatingId(null);
        }
    }, 50);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.PAID: return 'bg-green-100 text-green-800 border-green-200';
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OrderStatus.FAILED: return 'bg-red-100 text-red-800 border-red-200';
      case OrderStatus.SHIPPED: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case OrderStatus.DELIVERED: return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
     return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-brand-600"/></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <button 
          onClick={fetchOrders}
          className="text-sm text-brand-600 hover:text-brand-800 font-medium"
        >
          Refresh List
        </button>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-600">#{order.id.replace('ord_', '')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.user_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative w-40">
                      {updatingId === order.id && (
                        <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] rounded-full flex items-center justify-center">
                           <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
                        </div>
                      )}
                      <div className="relative">
                        <select
                          key={`select-${order.id}-${order.status}`}
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className={`appearance-none block w-full pl-3 pr-8 py-1.5 text-xs font-bold rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-500 cursor-pointer transition-colors ${getStatusColor(order.status)} ${updatingId === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <option value={OrderStatus.PENDING}>PENDING</option>
                          <option value={OrderStatus.PAID}>PAID</option>
                          <option value={OrderStatus.SHIPPED}>SHIPPED</option>
                          <option value={OrderStatus.DELIVERED}>DELIVERED</option>
                          <option value={OrderStatus.FAILED}>FAILED</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-50">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">₹{order.total_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <div className="p-8 text-center text-gray-500">No orders found.</div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;