import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { Order } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, recentOrders: [] as Order[] });
  const [weeklyData, setWeeklyData] = useState<{ name: string; orders: number; revenue: number }[]>([]);
  
  useEffect(() => {
    const load = async () => {
      try {
        const allStats = await apiClient.getStats();
        setStats(allStats);
        
        // Calculate weekly sales from orders
        const allOrders = await apiClient.getOrders();
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dailyStats = Array(7).fill(null).map((_, i) => {
          const dayDate = new Date(weekStart);
          dayDate.setDate(weekStart.getDate() + i);
          const dayEnd = new Date(dayDate);
          dayEnd.setDate(dayDate.getDate() + 1);
          
          const dayOrders = (allOrders || []).filter((o: any) => {
            const oDate = new Date(o.created_at);
            return oDate >= dayDate && oDate < dayEnd && o.status === 'paid';
          });
          const revenue = dayOrders.reduce((sum: number, o: any) => sum + o.total_amount, 0);
          
          return {
            name: dayNames[i],
            orders: dayOrders.length,
            revenue
          };
        });
        setWeeklyData(dailyStats);
      } catch (err) {
        console.error('Failed to load stats', err);
      }
    };
    load();
  }, []);

  const data = weeklyData;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">₹{stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Average Order Value</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            ₹{stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Weekly Sales</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;