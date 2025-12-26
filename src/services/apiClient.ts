/**
 * API Client for RAS Currys Backend
 * Replaces localStorage-based mockDatabase with actual HTTP calls
 */

const API_BASE = 'http://localhost:5000/api';

// JWT token storage
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('ras_auth_token', token);
  } else {
    localStorage.removeItem('ras_auth_token');
  }
};

const getAuthToken = () => {
  if (!authToken) {
    authToken = localStorage.getItem('ras_auth_token');
  }
  return authToken;
};

const authFetch = async (url: string, options: any = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  } as Record<string, string>;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  return res;
};

export const apiClient = {
  // ==================== PRODUCTS ====================
  async getProducts(page = 1, limit = 100, category = null, search = null) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    const res = await fetch(`${API_BASE}/products?${params}`);
    const data = await res.json();
    // Normalize id field from MongoDB _id
    const items = (data.items || []).map((p: any) => ({ ...p, id: p.id || p._id }));
    return { ...data, items };
  },

  async addProduct(product) {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    const p = await res.json();
    return { ...p, id: p.id || p._id };
  },

  async updateProduct(id, changes) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes)
    });
    const p = await res.json();
    return { ...p, id: p.id || p._id };
  },

  async deleteProduct(id) {
    const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // ==================== AUTH ====================
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    // Map to legacy shape expected by authContext
    if (data.success && data.data?.token) {
      setAuthToken(data.data.token);
      return { success: true, user: data.data.user };
    }
    // Pass-through verification hint
    return { success: false, message: data.message || data.error || 'Login failed', needsVerification: data.needsVerification, email: data.email };
  },

  async signup(name, email, password, phone) {
    // Use new register endpoint and field names
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: name, email, phoneNumber: phone, password })
    });
    const data = await res.json();
    return data;
  },

  async forgotPassword(email) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  async resetPassword(email, otp, newPassword) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });
    return res.json();
  },

  async resendOTP(email) {
    const res = await fetch(`${API_BASE}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  async getUsers() {
    const res = await fetch(`${API_BASE}/users`);
    return res.json();
  },

  async getUser(userId) {
    const res = await fetch(`${API_BASE}/users/${userId}`);
    return res.json();
  },

  async updateUser(userId, data) {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateUserRole(userId, role) {
    const res = await fetch(`${API_BASE}/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    return res.json();
  },

  async deleteUser(userId) {
    const res = await fetch(`${API_BASE}/users/${userId}`, { method: 'DELETE' });
    return res.json();
  },

  // ==================== ORDERS ====================
  async createOrder(userId, items, total) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, items, total_amount: total, payment_gateway: 'PAYTM' })
    });
    return res.json();
  },

  async getOrders(userId = null) {
    const params = userId ? `?user_id=${userId}` : '';
    const res = await fetch(`${API_BASE}/orders${params}`);
    return res.json();
  },

  async updateOrderStatus(orderId, status) {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    return res.json();
  },

  // ==================== SUPPORT TICKETS ====================
  async createTicket(ticket) {
    const res = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket)
    });
    return res.json();
  },

  async getTickets(userId = null) {
    const params = userId ? `?user_id=${userId}` : '';
    const res = await fetch(`${API_BASE}/tickets${params}`);
    const arr = await res.json();
    return (arr || []).map((t: any) => ({ ...t, id: t.id || t._id }));
  },

  async updateTicketStatus(ticketId, status) {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  }
};
