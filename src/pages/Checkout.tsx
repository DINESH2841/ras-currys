import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import { useCart } from '../services/cartContext';
import { apiClient } from '../services/apiClient';
import Button from '../components/Button';
import { Lock, ShieldCheck, Loader2, CreditCard, AlertCircle, MapPin } from 'lucide-react';
import { PAYTM_MID } from '../constants';

const Checkout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login?redirect=checkout');
    }
    if (!isLoading && user && items.length === 0) {
      navigate('/cart');
    }
  }, [user, items, navigate, isLoading]);

  const handlePaytmPayment = async () => {
    if (!user) return;

    // Check if user has address and phone
    if (!user.phone || !user.address) {
      setError('Please complete your profile with phone number and delivery address before ordering.');
      return;
    }

    setError('');
    setIsProcessing(true);

    try {
      // 1. Create Order in Database (PENDING state)
      const order = await apiClient.createOrder(user.id, items, totalPrice);
      console.log("Order Created:", order.id);

      // SIMULATION OF PAYTM FLOW
      await new Promise(r => setTimeout(r, 1000));
      
      const mockTxnToken = "txn_token_" + Math.random().toString(36).substr(2, 9);

      if (mockTxnToken) {
        const isSuccess = window.confirm(
          `Paytm Payment Gateway (Test Mode)\n\n` +
          `Merchant: RAS Currys\n` +
          `Order ID: ${order.id}\n` +
          `Amount: ₹${totalPrice}\n` +
          `Delivery: ${user.address}\n\n` +
          `Click OK to Simulate Success (Paid)\n` +
          `Click Cancel to Simulate Failure`
        );

        if (isSuccess) {
          const mockBankTxnId = `TXN_${Date.now()}`;
          await apiClient.updateOrderStatus(order.id, 'paid' as any);
          
          clearCart();
          navigate('/orders');
        } else {
           alert("Payment Cancelled or Failed.");
           await apiClient.updateOrderStatus(order.id, 'failed' as any);
        }
      }

    } catch (error) {
      console.error('Checkout error:', error);
      setError('Something went wrong during payment initialization.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!user || items.length === 0) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden grid md:grid-cols-2">
          
          {/* Order Summary */}
          <div className="p-8 bg-gray-50 border-r border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
            <ul className="space-y-4 mb-6">
              {items.map(item => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.name} x {item.quantity}</span>
                  <span className="font-medium">₹{item.price * item.quantity}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
              <span className="text-base font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-brand-700">₹{totalPrice}</span>
            </div>
          </div>

          {/* User Details & Payment */}
          <div className="p-8">
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Contact Information</h3>
              <p className="text-gray-900 font-medium">{user.name}</p>
              <p className="text-gray-600">{user.email}</p>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Shipping Address</h3>
              <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 border border-blue-100">
                Assuming default address for this demo.
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center mb-4">
                 <div className="h-8 w-12 bg-white border border-gray-200 rounded flex items-center justify-center mr-3">
                    <span className="font-bold text-blue-800 text-xs">Paytm</span>
                 </div>
                 <div>
                    <p className="text-sm font-medium text-gray-900">Pay via Paytm PG</p>
                    <p className="text-xs text-gray-500">UPI, Wallet, Cards, Netbanking</p>
                 </div>
              </div>

              <Button 
                onClick={handlePaytmPayment} 
                className="w-full flex items-center justify-center space-x-2 bg-[#002E6E] hover:bg-[#002E6E]/90" // Paytm Blueish color
                isLoading={isProcessing}
              >
                <Lock className="h-4 w-4" />
                <span>Pay ₹{totalPrice} securely</span>
              </Button>
            </div>
            
            <div className="mt-4 flex items-center justify-center text-xs text-gray-500 space-x-1">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <span>Secured by Paytm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;