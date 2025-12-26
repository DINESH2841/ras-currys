/**
 * API Client for RAS Currys - Production Authentication
 */

const API_BASE = 'http://localhost:5000/api';

const apiClient = {
  // ==================== AUTHENTICATION ====================
  
  async register(fullName: string, email: string, phoneNumber: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, phoneNumber, password })
    });
    return res.json();
  },

  async verifyEmail(email: string, otp: string) {
    const res = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    return res.json();
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  async forgotPassword(email: string) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  async resetPassword(email: string, otp: string, newPassword: string) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });
    return res.json();
  },

  async resendOTP(email: string) {
    const res = await fetch(`${API_BASE}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  // ==================== PRODUCTS ====================
  
  async getProducts(page = 1, limit = 100) {
    const res = await fetch(`${API_BASE}/products?page=${page}&limit=${limit}`);
    return res.json();
  },

  async addProduct(product: any) {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return res.json();
  },

  async updateProduct(id: string, changes: any) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes)
    });
    return res.json();
  },

  async deleteProduct(id: string) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // ==================== ORDERS ====================
  
  async getOrders() {
    const res = await fetch(`${API_BASE}/orders`);
    return res.json();
  },

  async createOrder(userId: string, items: any[], totalAmount: number) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, items, totalAmount, status: 'pending' })
    });
    return res.json();
  },

  async updateOrderStatus(orderId: string, status: string) {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  // ==================== USERS ====================
  
  async getUsers() {
    const res = await fetch(`${API_BASE}/users`);
    return res.json();
  },

  async getUser(userId: string) {
    const res = await fetch(`${API_BASE}/users/${userId}`);
    return res.json();
  },

  async updateUser(userId: string, data: any) {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteUser(userId: string) {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async updateUserRole(userId: string, role: string) {
    const res = await fetch(`${API_BASE}/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    return res.json();
  },

  // ==================== SUPPORT TICKETS ====================
  
  async getTickets() {
    const res = await fetch(`${API_BASE}/tickets`);
    return res.json();
  },

  async createTicket(ticket: any) {
    const res = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket)
    });
    return res.json();
  },

  async updateTicketStatus(ticketId: string, status: string) {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  // ==================== STATS ====================
  
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    return res.json();
  }
};

export { apiClient };
export default apiClient;
