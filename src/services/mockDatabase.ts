import { Product, User, Order, UserRole, OrderStatus, SupportTicket } from '../types';

// Simulate password hashing (in production, use bcrypt or similar on backend)
const hashPassword = async (password: string): Promise<string> => {
  // Simple simulation - in production, use proper bcrypt hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'ras_salt_secret');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Initial Mock Data with hashed passwords
const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Butter Chicken Curry', price: 450, category: 'Currys', image: 'https://picsum.photos/id/1080/400/300', description: 'Rich creamy tomato sauce with tender chicken.', created_at: new Date().toISOString() },
  { id: '2', name: 'Rogan Josh', price: 520, category: 'Currys', image: 'https://picsum.photos/id/1060/400/300', description: 'Aromatic Kashmiri lamb curry.', created_at: new Date().toISOString() },
  { id: '3', name: 'Mango Pickle', price: 250, category: 'Pickles', image: 'https://picsum.photos/id/102/400/300', description: 'Traditional raw mango pickle with spices.', created_at: new Date().toISOString() },
  { id: '4', name: 'Paneer Tikka Masala', price: 380, category: 'Currys', image: 'https://picsum.photos/id/835/400/300', description: 'Grilled paneer cubes in spicy gravy.', created_at: new Date().toISOString() },
  { id: '5', name: 'Lemon Pickle', price: 200, category: 'Pickles', image: 'https://picsum.photos/id/292/400/300', description: 'Tangy and spicy lime pickle.', created_at: new Date().toISOString() },
  { id: '6', name: 'Goan Fish Curry', price: 550, category: 'Currys', image: 'https://picsum.photos/id/225/400/300', description: 'Coconut based spicy fish curry.', created_at: new Date().toISOString() },
  { id: '7', name: 'Mixed Vegetable Pickle', price: 220, category: 'Pickles', image: 'https://picsum.photos/id/30/400/300', description: 'Assorted vegetables pickled to perfection.', created_at: new Date().toISOString() },
  { id: '8', name: 'Dal Makhani', price: 300, category: 'Currys', image: 'https://picsum.photos/id/514/400/300', description: 'Slow cooked black lentils with cream.', created_at: new Date().toISOString() },
  { id: '9', name: 'Garlic Pickle', price: 280, category: 'Pickles', image: 'https://picsum.photos/id/366/400/300', description: 'Strong and spicy garlic pickle.', created_at: new Date().toISOString() },
  { id: '10', name: 'Chicken Chettinad', price: 480, category: 'Currys', image: 'https://picsum.photos/id/493/400/300', description: 'Spicy chicken curry from Tamil Nadu.', created_at: new Date().toISOString() },
];

// Users with hashed passwords - Admin123 and User1234
const INITIAL_USERS: User[] = [
  { 
    id: 'u1', 
    name: 'Admin User', 
    email: 'admin@ras.com', 
    role: UserRole.ADMIN,
    passwordHash: 'fe02d206c04b2cb334adab899f7c98dda133b2c57b82ef7dd8fd54cd1aa0a21d' // Admin123
  },
  { 
    id: 'u2', 
    name: 'John Doe', 
    email: 'user@ras.com', 
    role: UserRole.USER,
    passwordHash: 'cb64e4d6f9af5dc4f260e3f54355eba5e729870020a37b2efb2522b11c222c66' // User1234
  },
  {
    id: 'u3',
    name: 'Super Admin',
    email: 'dineshsevenni@gmail.com',
    role: UserRole.SUPERADMIN,
    passwordHash: 'c01434cbcb898b3ad97c148f516d82ae63754c7ca34ad0b86526988d42670db7' // dinesh1234
  }
];

// Helper to simulate DB delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockDatabase {
  private products: Product[];
  private users: User[];
  private orders: Order[];
  private tickets: SupportTicket[];

  constructor() {
    this.products = this.load('products', INITIAL_PRODUCTS);
    this.users = this.load('users', INITIAL_USERS);
    // Migrate existing local users to ensure password hashes for demo accounts
    this.migrateUsers();
    this.orders = this.load('orders', []);
    this.tickets = this.load('tickets', []);
  }

  private load<T>(key: string, fallback: T): T {
    const stored = localStorage.getItem(`ras_db_${key}`);
    return stored ? JSON.parse(stored) : fallback;
  }

  private save(key: string, data: any) {
    localStorage.setItem(`ras_db_${key}`, JSON.stringify(data));
  }

  // Migration: ensure demo accounts have password hashes even if old data is in localStorage
  private migrateUsers() {
    let changed = false;
    this.users = this.users.map((u) => {
      if (!('passwordHash' in u) || !u.passwordHash) {
        if (u.email?.toLowerCase() === 'admin@ras.com') {
          changed = true;
          return { ...u, passwordHash: 'fe02d206c04b2cb334adab899f7c98dda133b2c57b82ef7dd8fd54cd1aa0a21d' }; // Admin123
        }
        if (u.email?.toLowerCase() === 'user@ras.com') {
          changed = true;
          return { ...u, passwordHash: 'cb64e4d6f9af5dc4f260e3f54355eba5e729870020a37b2efb2522b11c222c66' }; // User1234
        }
      }
      return u;
    });

    // Ensure Super Admin account exists with expected role and password
    const superEmail = 'dineshsevenni@gmail.com';
    const idx = this.users.findIndex(u => u.email?.toLowerCase() === superEmail);
    if (idx === -1) {
      changed = true;
      this.users.push({
        id: 'u3',
        name: 'Super Admin',
        email: superEmail,
        role: UserRole.SUPERADMIN,
        passwordHash: 'c01434cbcb898b3ad97c148f516d82ae63754c7ca34ad0b86526988d42670db7' // dinesh1234
      });
    } else {
      const existing = this.users[idx];
      let updated = false;
      if (existing.role !== UserRole.SUPERADMIN) {
        this.users[idx] = { ...existing, role: UserRole.SUPERADMIN };
        updated = true;
      }
      if (!existing.passwordHash) {
        this.users[idx] = { ...this.users[idx], passwordHash: 'c01434cbcb898b3ad97c148f516d82ae63754c7ca34ad0b86526988d42670db7' };
        updated = true;
      }
      if (updated) changed = true;
    }
    if (changed) {
      this.save('users', this.users);
    }
  }

  // --- Product Methods ---
  async getProducts(page: number, limit: number, category?: string, search?: string): Promise<{ items: Product[], total: number }> {
    await delay(300);
    let filtered = [...this.products];

    if (category && category !== 'all') {
      filtered = filtered.filter(p => p.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return { items: filtered.slice(start, end), total };
  }

  async addProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    await delay(500);
    const newProduct: Product = {
      ...product,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    this.products.unshift(newProduct);
    this.save('products', this.products);
    return newProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    await delay(300);
    this.products = this.products.filter(p => p.id !== id);
    this.save('products', this.products);
    return true;
  }

  async updateProduct(id: string, changes: Partial<Product>): Promise<Product | null> {
    await delay(400);
    const idx = this.products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const updated: Product = { ...this.products[idx], ...changes };
    this.products[idx] = updated;
    this.save('products', this.products);
    return updated;
  }

  // --- Order Methods ---
  async createOrder(userId: string, items: any[], total: number): Promise<Order> {
    await delay(400);
    const user = this.users.find(u => u.id === userId);
    
    // Generate a unique order ID compatible with Paytm (alphanumeric, max 50 chars)
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const newOrder: Order = {
      id: orderId, // Internal ID same as Gateway ID for simplicity in this mock
      user_id: userId,
      user_name: user?.name || 'Unknown',
      items,
      total_amount: total,
      status: OrderStatus.PENDING,
      created_at: new Date().toISOString(),
      gateway_order_id: orderId,
      payment_gateway: 'PAYTM'
    };
    this.orders.unshift(newOrder);
    this.save('orders', this.orders);
    return newOrder;
  }

  async verifyPayment(orderId: string, paymentId: string, signature: string): Promise<Order | null> {
    // REDUCED DELAY for "faster" feeling
    await delay(200); 
    const orderIndex = this.orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return null;

    // Simulate Paytm status verification
    // In real backend: verify checksum and call Paytm Status API
    const updatedOrder = {
      ...this.orders[orderIndex],
      payment_id: paymentId, // Paytm Bank Txn ID
      status: OrderStatus.PAID
    };
    this.orders[orderIndex] = updatedOrder;
    this.save('orders', this.orders);
    return updatedOrder;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
    // Increased delay so the spinner is visible in UI
    await delay(800);
    const index = this.orders.findIndex(o => o.id === orderId);
    if (index === -1) return false;
    
    this.orders[index] = {
      ...this.orders[index],
      status: status
    };
    
    this.save('orders', this.orders);
    return true;
  }

  async getOrders(userId?: string): Promise<Order[]> {
    await delay(300);
    if (userId) {
      return this.orders.filter(o => o.user_id === userId);
    }
    return this.orders;
  }

  async getAllStats(): Promise<{ totalOrders: number; totalRevenue: number; recentOrders: Order[] }> {
    await delay(300);
    const totalOrders = this.orders.length;
    const totalRevenue = this.orders.reduce((sum, o) => o.status === OrderStatus.PAID ? sum + o.total_amount : sum, 0);
    return {
      totalOrders,
      totalRevenue,
      recentOrders: this.orders.slice(0, 5)
    };
  }

  // --- Support Ticket Methods ---
  async createTicket(ticket: Omit<SupportTicket, 'id' | 'created_at' | 'status'>): Promise<boolean> {
    await delay(300);
    const newTicket: SupportTicket = {
      ...ticket,
      id: `tkt_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      status: 'open'
    };
    this.tickets.unshift(newTicket);
    this.save('tickets', this.tickets);
    return true;
  }

  async getTickets(): Promise<SupportTicket[]> {
    await delay(300);
    return this.tickets;
  }

  async updateTicketStatus(ticketId: string, status: 'open' | 'resolved'): Promise<boolean> {
    await delay(300);
    const idx = this.tickets.findIndex(t => t.id === ticketId);
    if (idx === -1) return false;
    this.tickets[idx] = { ...this.tickets[idx], status };
    this.save('tickets', this.tickets);
    return true;
  }

  // --- Auth Methods ---
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> {
    await delay(500);
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return { success: false, message: 'No account found with this email address' };
    }

    // Verify password
    const hashedPassword = await hashPassword(password);
    if (user.passwordHash !== hashedPassword) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    // Remove passwordHash before returning user
    const { passwordHash, ...userWithoutPassword } = user;
    return { 
      success: true, 
      user: { ...userWithoutPassword, token: `mock_jwt_${user.id}` }
    };
  }

  async signup(name: string, email: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> {
    await delay(600);
    
    // Check if email already exists
    const existingUser = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return { success: false, message: 'An account with this email already exists' };
    }

    // Create new user
    const passwordHash = await hashPassword(password);
    const newUser: User = {
      id: `u${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name,
      email: email.toLowerCase(),
      role: UserRole.USER, // New signups are regular users
      passwordHash
    };

    this.users.push(newUser);
    this.save('users', this.users);

    // Remove passwordHash before returning user
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return { 
      success: true, 
      user: { ...userWithoutPassword, token: `mock_jwt_${newUser.id}` }
    };
  }

  // --- User Management (SuperAdmin) ---
  async getUsers(): Promise<User[]> {
    await delay(200);
    return this.users.map(({ passwordHash, ...u }) => u);
  }

  async updateUserRole(userId: string, role: UserRole): Promise<{ success: boolean; message?: string }> {
    await delay(300);
    const idx = this.users.findIndex(u => u.id === userId);
    if (idx === -1) return { success: false, message: 'User not found' };
    const user = this.users[idx];
    if (user.role === UserRole.SUPERADMIN) {
      return { success: false, message: 'Cannot modify SUPERADMIN role' };
    }
    this.users[idx] = { ...user, role };
    this.save('users', this.users);
    return { success: true };
  }
}

export const db = new MockDatabase();