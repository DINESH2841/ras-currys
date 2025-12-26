import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../services/authContext';
import { useCart } from '../services/cartContext';
import { UserRole } from '../types';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path ? 'text-brand-600 font-semibold' : 'text-gray-600 hover:text-brand-600';

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-brand-600">RAS Currys</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className={isActive('/')}>Home</Link>
            <Link to="/products" className={isActive('/products')}>Our Menu</Link>
            <Link to="/contact" className={isActive('/contact')}>Contact & AI Help</Link>
            {user && (
              <Link to="/support" className={isActive('/support')}>My Support</Link>
            )}
            {(user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERADMIN) && (
              <Link to="/admin" className={isActive('/admin')}>Dashboard</Link>
            )}
          </div>

          {/* Right Side Icons */}
          <div className="hidden md:flex items-center space-x-6">
             {/* Cart */}
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-brand-600">
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Auth */}
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/orders" className="text-sm font-medium text-gray-700 hover:text-brand-600">
                  My Orders
                </Link>
                <Link to="/profile" className="text-sm font-medium text-gray-700 hover:text-brand-600">
                  Profile
                </Link>
                <div className="flex items-center space-x-2 border-l pl-4 border-gray-200">
                  <span className="text-sm text-gray-500">Hi, {user.name?.split(' ')[0] || 'User'}</span>
                  <button onClick={handleLogout} className="p-1 text-gray-400 hover:text-gray-600">
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-brand-600">Login</Link>
                <Link to="/register" className="text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700 transition">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <Link to="/cart" className="relative p-2 mr-4 text-gray-600">
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                  {totalItems}
                </span>
              )}
            </Link>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600 hover:text-gray-900 focus:outline-none">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50">Home</Link>
            <Link to="/products" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50">Menu</Link>
            <Link to="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50">Contact Support</Link>
            {(user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERADMIN) && (
              <Link to="/admin" className="block px-3 py-2 rounded-md text-base font-medium text-brand-600 hover:bg-brand-50">Admin Dashboard</Link>
            )}
            
            <div className="border-t border-gray-200 mt-4 pt-4">
              {user ? (
                <>
                  <div className="px-3 py-2 text-base font-medium text-gray-500">Signed in as {user.name}</div>
                  <Link to="/orders" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600">My Orders</Link>
                  <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600">My Profile</Link>
                  <Link to="/support" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600">My Support</Link>
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50">Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600">Login</Link>
                  <Link to="/register" className="block px-3 py-2 rounded-md text-base font-medium text-brand-600 hover:bg-brand-50">Register</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;