import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../services/authContext';
import { UserRole } from '../../types';
import { LayoutDashboard, ShoppingBag, Package, LogOut, LifeBuoy, Users } from 'lucide-react';
import { db } from '../../services/mockDatabase';
import Footer from '../../components/Footer';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openTicketsCount, setOpenTicketsCount] = useState(0);

  useEffect(() => {
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERADMIN)) {
      navigate('/');
    } else {
      // Fetch open tickets count
      fetchOpenTicketsCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchOpenTicketsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, navigate]);

  const fetchOpenTicketsCount = async () => {
    try {
      const tickets = await db.getTickets();
      const openCount = tickets.filter(t => t.status === 'open').length;
      setOpenTicketsCount(openCount);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
  };

  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERADMIN)) return null;

  const navItems = [
    { path: '/admin', label: 'Overview', icon: LayoutDashboard },
    { path: '/admin/products', label: 'Products', icon: Package },
    { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { path: '/admin/support', label: 'Support Tickets', icon: LifeBuoy, badge: openTicketsCount },
    { path: '/admin/users', label: 'Users', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <span className="text-xl font-bold tracking-wider">RAS Admin</span>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors relative ${
                  active 
                  ? 'bg-brand-600 text-white' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <div className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center">
            <span className="font-bold">RAS Admin</span>
             <button onClick={() => { logout(); navigate('/login'); }}>Sign Out</button>
        </div>
        <div className="p-8 flex-grow">
          <Outlet />
          <Footer />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;