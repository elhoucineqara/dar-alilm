'use client';

import { useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetchApi('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'An error occurred');
        setLoading(false);
        return;
      }

      setSuccess(data.message);
      setEmail('');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&h=1080&fit=crop&auto=format)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/40 via-blue-900/30 to-teal-900/40"></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-md border-b border-gray-100 flex-shrink-0 shadow-sm z-10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-2 sm:gap-4 lg:gap-8">
              <Link href="/" className="flex items-center gap-1 sm:gap-2">
                <img src="/logo.svg" alt="Dar Al-Ilm Logo" className="w-6 h-6 sm:w-7 sm:h-7" />
                <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  <span className="hidden sm:inline">Dar Al-Ilm</span>
                  <span className="sm:hidden">DAI</span>
                </span>
              </Link>
            </div>
            <Link
              href="/login"
              className="text-xs sm:text-sm text-gray-700 hover:text-blue-600 font-medium transition-colors whitespace-nowrap"
            >
              <span className="hidden sm:inline">Back to Login</span>
              <span className="sm:hidden">Login</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-3 sm:px-4 lg:px-8 py-2 sm:py-4 overflow-auto relative z-10">
        <div className="w-full max-w-md">
          {/* Title Section */}
          <div className="text-center mb-3 sm:mb-4 animate-fade-in-left">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
              Forgot Your Password?
            </h1>
            <p className="text-xs sm:text-sm text-white drop-shadow-md" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
              Don't worry! Enter your email and we'll send you a reset link.
            </p>
          </div>

          {/* Form */}
          <div className="animate-fade-in-left">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 border border-cyan-100">
              <div className="text-center mb-3 sm:mb-4">
                <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-0.5">
                  Reset Your Password
                </h2>
                <p className="text-xs text-cyan-600">
                  We'll email you instructions to reset your password
                </p>
              </div>

              <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-lg bg-red-50 border-2 border-red-300 p-2">
                    <p className="text-xs text-red-700 font-medium">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="rounded-lg bg-green-50 border-2 border-green-300 p-2">
                    <p className="text-xs text-green-700 font-medium">{success}</p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-cyan-700 mb-0.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border-2 border-cyan-100 bg-cyan-50/50 px-2 py-1.5 text-xs text-gray-900 placeholder-cyan-300 focus:border-cyan-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-all"
                    placeholder="your@email.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 hover:from-cyan-700 hover:via-blue-700 hover:to-teal-700 active:from-cyan-800 active:via-blue-800 active:to-teal-800 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg hover:shadow-xl hover:shadow-cyan-300/50 transition-all duration-300 transform hover:scale-[1.02] active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>

                <div className="text-center pt-1 border-t border-cyan-100">
                  <p className="text-xs text-cyan-600">
                    Remember your password?{' '}
                    <Link
                      href="/login"
                      className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

