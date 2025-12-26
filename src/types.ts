export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: UserRole;
  token?: string; // Simulated JWT
  passwordHash?: string; // Hashed password (never sent to frontend in real app)
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'Currys' | 'Pickles';
  image: string;
  description: string;
  created_at: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  FAILED = 'failed'
}

export interface Order {
  id: string;
  user_id: string;
  user_name: string;
  items: CartItem[];
  total_amount: number;
  // Generic payment fields to support Paytm/Razorpay
  gateway_order_id?: string; // Used for Paytm Order ID
  payment_id?: string; // Bank Transaction ID
  payment_gateway: 'PAYTM' | 'RAZORPAY';
  status: OrderStatus;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  userContact: string;
  created_by_user_id?: string;
  issueSummary: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'open' | 'resolved';
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// Fix for missing JSX.IntrinsicElements in the current environment
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}  interface Window {
    Paytm?: {
      CheckoutJS?: {
        init: (config: any) => Promise<void>;
        invoke: () => void;
      };
    };
  }
