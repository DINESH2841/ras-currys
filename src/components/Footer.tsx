import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="mt-auto w-full border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-600">
          <p className="text-center sm:text-left">© 2025 S. Dinesh. All rights reserved.</p>
          <a href="mailto:sevennidinesh@gmail.com" className="text-brand-700 hover:text-brand-800 underline underline-offset-2">
            Get support: sevennidinesh@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;import React from 'react';
import { Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white mt-auto border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          {/* Copyright */}
          <div className="text-gray-300 text-center sm:text-left">
            © 2025 S. Dinesh. All rights reserved.
          </div>

          {/* Support Email */}
          <div className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Get support:</span>
            <a 
              href="mailto:sevennidinesh@gmail.com" 
              className="text-brand-400 hover:text-brand-300 font-medium underline decoration-dotted underline-offset-4 transition-all"
            >
              sevennidinesh@gmail.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
