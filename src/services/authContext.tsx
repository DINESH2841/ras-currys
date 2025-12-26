import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { apiClient } from './apiClient';

interface AuthResult {
  success: boolean;
  message?: string;
  needsVerification?: boolean;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (name: string, email: string, password: string, phone: string) => Promise<AuthResult>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('ras_user');
    const sessionExpiry = localStorage.getItem('ras_session_expiry');
    
    if (storedUser && sessionExpiry) {
      const expiryTime = parseInt(sessionExpiry);
      if (Date.now() < expiryTime) {
        setUser(JSON.parse(storedUser));
      } else {
        // Session expired
        localStorage.removeItem('ras_user');
        localStorage.removeItem('ras_session_expiry');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const result = await apiClient.login(email, password);
      if (result.success && (result as any).user) {
        setUser((result as any).user);
        // Set session expiry to 24 hours
        const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem('ras_user', JSON.stringify((result as any).user));
        localStorage.setItem('ras_session_expiry', expiryTime.toString());
        return { success: true };
      }
      return { success: false, message: (result as any).message || 'Invalid email or password', needsVerification: (result as any).needsVerification, email: (result as any).email };
    } catch (error) {
      console.error("Login failed", error);
      return { success: false, message: 'An error occurred during login. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, phone: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const result = await apiClient.signup(name, email, password, phone);
      if (result.success) {
        return { success: true, message: result.message || 'Registration successful. Check your email for OTP.' };
      }
      return { success: false, message: result.message || result.error || 'Failed to create account' };
    } catch (error) {
      console.error("Signup failed", error);
      return { success: false, message: 'An error occurred during signup. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ras_user');
    localStorage.removeItem('ras_session_expiry');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);