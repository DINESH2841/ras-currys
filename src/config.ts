/// <reference types="vite/client" />

// Environment Configuration
export const config = {
  // API Configuration
  geminiApiKey: import.meta.env.VITE_API_KEY || '',
  
  // App Configuration
  appName: 'RAS Currys',
  appDescription: 'Authentic Indian Flavors',
  
  // Session Configuration
  sessionExpiryHours: 24,
  
  // Order Configuration
  orderIdPrefix: 'ORDER',
  paymentGateway: 'PAYTM' as const,
  
  // Pagination
  defaultPageSize: 10,
  
  // Validation
  passwordMinLength: 8,
  nameMinLength: 2,
  
  // Environment
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Base URL (for production deployment)
  baseUrl: import.meta.env.VITE_BASE_URL || window.location.origin,
};

// Helper to check if required config is present
export const validateConfig = (): { valid: boolean; missing: string[] } => {
  const missing: string[] = [];
  
  if (!config.geminiApiKey && config.isProduction) {
    missing.push('VITE_API_KEY (required for Gemini AI support)');
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
};
