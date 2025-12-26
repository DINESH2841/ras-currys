import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../components/Button';
import { apiClient } from '../services/apiClient';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledEmail = (location.state as any)?.email || '';

  const [email, setEmail] = useState(prefilledEmail);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (val: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiClient.verifyEmail(email, otp);
      if (result.success && result.data?.user) {
        const user = result.data.user;
        // Persist session like login
        const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem('ras_user', JSON.stringify(user));
        localStorage.setItem('ras_session_expiry', expiryTime.toString());
        setSuccess('Email verified successfully! Redirecting...');
        setTimeout(() => navigate('/', { replace: true }), 1200);
      } else {
        setError(result.message || result.error || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    if (!validateEmail(email)) {
      setError('Enter a valid email to resend OTP');
      return;
    }
    setIsLoading(true);
    try {
      const rsp = await apiClient.resendOTP(email);
      if (rsp.success) setSuccess('New OTP sent to your email.');
      else setError(rsp.message || rsp.error || 'Failed to resend OTP');
    } catch (e: any) {
      setError(e.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-orange-50 to-yellow-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-brand-600 mb-2">🍛 RAS Currys</h1>
          <h2 className="text-2xl font-extrabold text-gray-900">Verify Your Email</h2>
          <p className="mt-2 text-sm text-gray-600">Enter the OTP we sent to your email</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-xl sm:px-10 border border-gray-100">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="your@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OTP</label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-center tracking-widest"
                  placeholder="6-digit OTP"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>Verify Email</Button>

            <div className="text-center mt-3">
              <button type="button" onClick={handleResend} className="text-sm text-brand-600 hover:text-brand-700 font-medium" disabled={isLoading}>
                Resend OTP
              </button>
            </div>

            <p className="text-center text-sm text-gray-600 mt-2">
              <button type="button" onClick={() => navigate('/login')} className="text-gray-600 hover:text-gray-700">
                ← Back to sign in
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
