import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../services/cartContext';
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';

const Cart: React.FC = () => {
  const { items, updateQuantity, removeItem, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trash2 className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't added any authentic flavors yet.</p>
          <Link to="/" className="inline-block w-full">
            <Button className="w-full">Start Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {items.map((item) => (
              <li key={item.id} className="p-6 flex flex-col sm:flex-row items-center">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="h-24 w-24 object-cover rounded-md mb-4 sm:mb-0"
                />
                
                <div className="sm:ml-6 flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{item.category}</p>
                  <p className="mt-1 text-sm font-medium text-brand-600">₹{item.price}</p>
                </div>

                <div className="mt-4 sm:mt-0 flex items-center justify-between w-full sm:w-auto">
                  <div className="flex items-center border border-gray-300 rounded-md mx-4">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 text-gray-600 hover:bg-gray-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-4 font-medium text-gray-900">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 text-gray-600 hover:bg-gray-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <button 
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="bg-gray-50 p-6 border-t border-gray-200">
            <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
              <p>Subtotal ({totalItems} items)</p>
              <p>₹{totalPrice}</p>
            </div>
            <p className="text-sm text-gray-500 mb-6">Shipping and taxes calculated at checkout.</p>
            <div className="flex flex-col sm:flex-row gap-4">
               <Link to="/" className="flex-1">
                <Button variant="outline" className="w-full">
                   <ArrowLeft className="h-4 w-4 mr-2" />
                   Continue Shopping
                </Button>
               </Link>
              <Button onClick={() => navigate('/checkout')} className="flex-1">
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;