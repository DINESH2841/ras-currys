import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { User, UserRole } from '../../types';
import { useAuth } from '../../services/authContext';
import { Loader2, ShieldCheck, Trash2, AlertCircle } from 'lucide-react';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await apiClient.getUsers();
      // sort: SUPERADMIN first, then admins, then users
      const order = (r: string) => r === 'superadmin' ? 0 : r === 'admin' ? 1 : 2;
      setUsers(list.sort((a: any, b: any) => order(a.role) - order(b.role)));
    } catch (err) {
      setError('Failed to load users');
    }
    setLoading(false);
  };

  const changeRole = async (userId: string, role: string) => {
    setSavingId(userId);
    setError('');
    try {
      await apiClient.updateUserRole(userId, role);
      setMessage('Role updated successfully');
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
    }
    setSavingId(null);
    setTimeout(() => setMessage(''), 2000);
  };

  const handleDelete = async (userId: string, userName: string) => {
    const confirmed = window.confirm(`Delete "${userName}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeleting(userId);
    setError('');
    try {
      await apiClient.deleteUser(userId);
      setMessage('User deleted successfully');
      setUsers(users.filter(u => (u._id || u.id) !== userId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
    setDeleting(null);
    setTimeout(() => setMessage(''), 2000);
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-brand-600"/></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        {message && <span className="text-sm text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded">{message}</span>}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(u => {
              const userId = u._id || u.id;
              const isSuperAdmin = u.role === 'superadmin';
              const isCurrentUser = currentUser?.id === userId;

              return (
              <tr key={userId} className={isSuperAdmin ? 'bg-purple-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{u.phone || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {isSuperAdmin ? (
                    <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-100 border border-purple-300 px-2 py-1 rounded font-semibold uppercase text-xs">
                      <ShieldCheck className="h-4 w-4"/> SUPERADMIN
                    </span>
                  ) : (
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(userId, e.target.value)}
                      disabled={savingId === userId || isCurrentUser}
                      className={`text-xs font-semibold rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        u.role === 'admin' 
                          ? 'bg-blue-100 border-blue-300 text-blue-700' 
                          : 'bg-gray-100 border-gray-300 text-gray-700'
                      } ${savingId === userId || isCurrentUser ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <option value="user">USER</option>
                      <option value="admin">ADMIN</option>
                    </select>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {isSuperAdmin ? (
                    <span className="text-gray-400 text-xs font-medium">Immutable</span>
                  ) : (
                    <button
                      onClick={() => handleDelete(userId, u.name)}
                      disabled={deleting === userId || isCurrentUser}
                      className={`flex items-center gap-1 px-3 py-1 rounded text-red-600 border border-red-200 hover:bg-red-50 transition-colors text-xs font-medium ${
                        deleting === userId || isCurrentUser ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {deleting === userId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      {deleting === userId ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;