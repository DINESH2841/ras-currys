import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import Button from '../components/Button';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [otpSent, setOtpSent] = useState(false);
  const { login, signup, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/";

  // Phone validation
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    if (isForgotPassword) {
      if (!otpSent) {
        // Send OTP
        if (!validateEmail(email)) {
          setError('Please enter a valid email address');
          return;
        }
        try {
          const result = await (window as any).apiClient?.forgotPassword(email) || 
            (await fetch('http://localhost:5000/api/auth/forgot-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email })
            }).then(r => r.json()));
          if (result.success) {
            setOtpSent(true);
            setSuccess('OTP sent to your email');
          } else {
            setError(result.error || 'Failed to send OTP');
          }
        } catch (err: any) {
          setError(err.message || 'Failed to send OTP');
        }
      } else {
        // Verify OTP and reset password
        if (!otp || otp.length !== 6) {
          setError('Please enter a valid 6-digit OTP');
          return;
        }
        try {
          const result = await (window as any).apiClient?.resetPassword(email, otp, newPassword) ||
            (await fetch('http://localhost:5000/api/auth/reset-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, otp, newPassword })
            }).then(r => r.json()));
          if (result.success) {
            setSuccess('Password reset successfully! Redirecting to login...');
            setTimeout(() => {
              setIsForgotPassword(false);
              setOtpSent(false);
              setEmail('');
              setOtp('');
              setNewPassword('');
            }, 1500);
          } else {
            setError(result.error || 'Failed to reset password');
          }
        } catch (err: any) {
          setError(err.message || 'Failed to reset password');
        }
      }
      return;
    }

    // Validate email
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (isSignUp) {
      // Sign Up validation
      if (!name.trim() || name.trim().length < 2) {
        setError('Please enter your full name (at least 2 characters)');
        return;
      }

      if (!validatePhone(phone)) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        setError(passwordValidation.message);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      const result = await signup(name.trim(), email.toLowerCase().trim(), password, phone);
      if (result.success) {
        setSuccess('Registration successful! Check your email for the OTP.');
        setTimeout(() => {
          navigate('/verify-email', { state: { email: email.toLowerCase().trim() }, replace: true });
        }, 1200);
      } else {
        setError(result.message || 'Failed to create account. Please try again.');
      }
    } else {
      // Sign In validation
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      const result = await login(email.toLowerCase().trim(), password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        // If unverified, show a clearer message and offer resend OTP
        if (result.needsVerification) {
          setError('Please verify your email before logging in. Check your inbox for OTP.');
        } else {
          setError(result.message || 'Invalid email or password. Please try again.');
        }
      }
    }
  };

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setFieldErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordBlur = () => {
    if (password && isSignUp) {
      const validation = validatePassword(password);
      if (!validation.valid) {
        setFieldErrors(prev => ({ ...prev, password: validation.message }));
      } else {
        setFieldErrors(prev => ({ ...prev, password: '' }));
      }
    }
  };

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password strength validation
  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true, message: 'Strong password' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-orange-50 to-yellow-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-brand-600 mb-2">🍛 RAS Currys</h1>
          <h2 className="text-2xl font-extrabold text-gray-900">
            {isForgotPassword ? 'Reset Password' : (isSignUp ? 'Create your account' : 'Welcome back')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isForgotPassword ? 'Enter your email to reset your password' : (isSignUp ? 'Join us for authentic Indian flavors' : 'Sign in to continue your culinary journey')}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-xl sm:px-10 border border-gray-100">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    required={isSignUp}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  placeholder="you@example.com"
                  className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all ${
                    fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {!isForgotPassword && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={handlePasswordBlur}
                    placeholder={isSignUp ? 'Create a strong password' : 'Enter your password'}
                    className={`block w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all ${
                      fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {fieldErrors.password}
                  </p>
                )}
                {isSignUp && password && !fieldErrors.password && validatePassword(password).valid && (
                  <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Strong password
                  </p>
                )}
              </div>
            )}

            {isSignUp && (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  required={isSignUp}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit phone number"
                  maxLength={10}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required={isSignUp}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Passwords do not match
                  </p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Passwords match
                  </p>
                )}
              </div>
            )}

            {isForgotPassword && !otpSent && (
              <p className="text-sm text-gray-600">
                Enter your email address and we'll send you an OTP to reset your password.
              </p>
            )}

            {isForgotPassword && otpSent && (
              <>
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                    Enter OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit OTP"
                    maxLength={6}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-center tracking-widest"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Create new password"
                      className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{success}</span>
              </div>
            )}

            <div>
              <Button type="submit" className="w-full" isLoading={isLoading}>
                {isForgotPassword ? (otpSent ? 'Reset Password' : 'Send OTP') : (isSignUp ? 'Create Account' : 'Sign In')}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {isForgotPassword ? 'Back to sign in' : (isSignUp ? 'Already have an account?' : "Don't have an account?")}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {!isForgotPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                    setSuccess('');
                    setFieldErrors({});
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="w-full text-center py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                >
                  {isSignUp ? 'Sign in to existing account' : 'Create a new account'}
                </button>
              )}
              
              {!isSignUp && !isForgotPassword && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError('');
                      setSuccess('');
                      setEmail('');
                    }}
                    className="w-full text-center py-2 px-4 text-sm font-medium text-brand-600 hover:text-brand-700 focus:outline-none"
                  >
                    Forgot password?
                  </button>

                  {error && error.toLowerCase().includes('verify your email') && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => navigate('/verify-email', { state: { email } })}
                        className="w-full text-center py-2 px-4 text-sm font-medium text-brand-700 hover:text-brand-800 focus:outline-none border border-brand-200 rounded-lg"
                      >
                        Go to Verify Email
                      </button>
                    </div>
                  )}

                  {/* Resend OTP for unverified accounts */}
                  {error && error.toLowerCase().includes('verify your email') && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const rsp = await fetch('http://localhost:5000/api/auth/resend-otp', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email })
                          }).then(r => r.json());
                          if (rsp.success) {
                            setSuccess('OTP resent to your email. Please check your inbox.');
                          } else {
                            setError(rsp.message || rsp.error || 'Failed to resend OTP');
                          }
                        } catch (e: any) {
                          setError(e.message || 'Failed to resend OTP');
                        }
                      }}
                      className="w-full text-center py-2 px-4 text-sm font-medium text-brand-600 hover:text-brand-700 focus:outline-none"
                    >
                      Resend verification OTP
                    </button>
                  )}
                </>
              )}

              {isForgotPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setOtpSent(false);
                    setError('');
                    setSuccess('');
                    setEmail('');
                    setOtp('');
                    setNewPassword('');
                  }}
                  className="w-full text-center py-2 px-4 text-sm font-medium text-brand-600 hover:text-brand-700 focus:outline-none"
                >
                  Back to Sign In
                </button>
              )}
            </div>
          </div>

          {!isSignUp && !isForgotPassword && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-900 mb-2">Demo Accounts:</p>
              <div className="space-y-1 text-xs text-blue-800">
                <p>👤 Admin: <span className="font-mono">admin@ras.com</span> / <span className="font-mono">Admin123</span></p>
                <p>👤 User: <span className="font-mono">user@ras.com</span> / <span className="font-mono">User1234</span></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;