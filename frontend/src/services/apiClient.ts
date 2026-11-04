/**
 * API Client for RAS Currys Backend
 * Replaces localStorage-based mockDatabase with actual HTTP calls
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 12_000;

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

const request = async (url: string, options: any = {}, authenticated = false) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  } as Record<string, string>;
  if (authenticated && token) headers['Authorization'] = `Bearer ${token}`;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res;
  } finally {
    window.clearTimeout(timeout);
  }
};
const authFetch = (url: string, options: any = {}) => request(url, options, true);

export const apiClient = {
  // ==================== PRODUCTS ====================
  async getProducts(page = 1, limit = 100, category = null, search = null) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    const res = await request(`${API_BASE}/products?${params}`);
    const data = await res.json();
    // Normalize id field from MongoDB _id
    const items = (data.items || []).map((p: any) => ({ ...p, id: p.id || p._id }));
    return { ...data, items };
  },

  async addProduct(product) {
    const res = await authFetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    const p = await res.json();
    return { ...(p.item || p), id: p.item?._id || p.id || p._id };
  },

  async updateProduct(id, changes) {
    const res = await authFetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes)
    });
    const p = await res.json();
    return { ...p, id: p.id || p._id };
  },

  async deleteProduct(id) {
    const res = await authFetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // ==================== AUTH ====================
  async login(email, password) {
    const res = await request(`${API_BASE}/auth/login`, {
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
    const res = await request(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: name, email, phoneNumber: phone, password })
    });
    const data = await res.json();
    return data;
  },

  async verifyEmail(email, otp) {
    const res = await request(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const data = await res.json();
    if (data.success && data.data?.token) {
      setAuthToken(data.data.token);
    }
    return data;
  },

  async forgotPassword(email) {
    const res = await request(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  async resetPassword(email, otp, newPassword) {
    const res = await request(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });
    return res.json();
  },

  async resendOTP(email) {
    const res = await request(`${API_BASE}/auth/resend-otp`, {
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
    const res = await authFetch(`${API_BASE}/users/${userId}`);
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
  async createOrder(items) {
    const res = await authFetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map(item => ({ productId: item.id, quantity: item.quantity })), paymentMethod: 'razorpay' })
    });
    const data = await res.json();
    return { ...data, id: data.data?._id, orderId: data.data?.orderId };
  },

  async getOrders(userId = null) {
    const res = await authFetch(`${API_BASE}/orders`);
    const data = await res.json();
    return data.data?.orders || [];
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
    const res = await authFetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket)
    });
    return res.json();
  },

  async getTickets(userId = null) {
    const res = await authFetch(`${API_BASE}/tickets`);
    const data = await res.json();
    return (data.tickets || []).map((t: any) => ({ ...t, id: t.id || t._id }));
  },

  async getAdminTickets(status = '') {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await authFetch(`${API_BASE}/tickets/admin${query}`);
    const data = await res.json();
    return (data.tickets || []).map((t: any) => ({ ...t, id: t.id || t._id }));
  },

  async chat(message) {
    const res = await request(`${API_BASE}/ai/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
    return res.json();
  },

  async generateProductDescription(name) {
    const res = await authFetch(`${API_BASE}/ai/product-description`, { method: 'POST', body: JSON.stringify({ name }) });
    return res.json();
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
