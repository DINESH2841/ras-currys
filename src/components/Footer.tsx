import React from 'react';
import { Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="mt-auto w-full border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
          <p className="text-gray-600 text-center sm:text-left">© 2025 RAS Currys. All rights reserved.</p>
          <a
            href="mailto:support@rascurrys.com"
            className="flex items-center gap-2 text-brand-700 hover:text-brand-800 underline underline-offset-4"
          >
            <Mail className="h-4 w-4" />
            <span>Get support: support@rascurrys.com</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
