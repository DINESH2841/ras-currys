import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../services/authContext';
import { SupportTicket } from '../types';
import { Loader2, Clock } from 'lucide-react';

const MySupport: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const all = await apiClient.getTickets(user?.id || null);
      const mine = user ? all.filter((t: any) => t.created_by_user_id === user.id) : [];
      // Show newest first
      setTickets(mine.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setLoading(false);
    };
    load();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">My Support</h1>
        <p className="text-gray-600">Please sign in to view your support tickets.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-brand-600"/></div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Support Tickets</h1>
      {tickets.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No tickets created yet. Use the <span className="font-semibold">Contact & AI Help</span> page to raise an issue.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map(t => (
            <div key={t.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded uppercase border ${t.urgency === 'HIGH' ? 'bg-red-100 text-red-800 border-red-200' : t.urgency === 'MEDIUM' ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>{t.urgency}</span>
                    <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                      <Clock className="h-4 w-4"/> {new Date(t.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{t.issueSummary}</h3>
                  <p className="text-xs text-gray-500 mt-1">Contact: {t.userContact}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded border ${t.status === 'open' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-green-100 text-green-800 border-green-200'}`}>{t.status.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySupport;
