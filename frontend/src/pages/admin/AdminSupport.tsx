import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { SupportTicket } from '../../types';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const AdminSupport: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    const data = await apiClient.getTickets();
    // Sort by newest
    setTickets(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    setLoading(false);
  };

  const markResolved = async (id: string) => {
    const confirmed = window.confirm('Mark this ticket as resolved?');
    if (!confirmed) return;
    const ok = await apiClient.updateTicketStatus(id, 'resolved');
    if (ok) {
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'resolved' } : t));
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading) {
     return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-brand-600"/></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Support Tickets (AI Reported)</h1>
      
      <div className="grid gap-6">
        {tickets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
             <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
             <h3 className="text-lg font-medium text-gray-900">All Good!</h3>
             <p className="text-gray-500">No support tickets have been reported yet.</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded uppercase border ${getUrgencyColor(ticket.urgency)}`}>
                    {ticket.urgency}
                  </span>
                  <span className="text-sm text-gray-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(ticket.created_at).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{ticket.issueSummary}</h3>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Contact:</span> {ticket.userContact}
                </p>
                <p className="text-xs text-gray-400 mt-2">Ticket ID: {ticket.id}</p>
              </div>
              
              <div className="flex items-start md:items-center">
                {ticket.status === 'open' ? (
                  <button onClick={() => markResolved(ticket.id)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white">
                    Mark Resolved
                  </button>
                ) : (
                  <span className="px-3 py-1 text-xs font-bold rounded bg-green-100 text-green-800 border border-green-200">RESOLVED</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminSupport;