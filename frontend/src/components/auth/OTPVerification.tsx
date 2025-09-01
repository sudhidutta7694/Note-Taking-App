'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface OTPVerificationProps {
  email: string;
  onBack: () => void;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  );
};

export default function OTPVerification({ email, onBack }: OTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { setAuth, isAuthenticated } = useAuth();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/verify-otp', {
        email,
        otp,
      });

      const { token, user, message } = response as {
        token: string;
        user: {
          id: string;
          email: string;
          name: string;
          verified: boolean;
        };
        message: string;
      };

      setAuth({ token, user });
      toast.success("Email verified successfully! Welcome to your dashboard! 🎉");
      router.replace('/dashboard');

    } catch (error: unknown) {
      console.error('OTP verification error:', error);

      const errorMessage = isApiError(error)
        ? error.response?.data?.error || 'OTP verification failed'
        : 'OTP verification failed';

      if (errorMessage.includes('Invalid or expired OTP')) {
        toast.error('Invalid or expired OTP. Please try again or request a new OTP.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      await api.post('/api/auth/resend-otp', { email });
      toast.success("OTP sent successfully! Please check your email inbox and spam folder.");
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: unknown) {
      const errorMessage = isApiError(error)
        ? error.response?.data?.error || 'Failed to resend OTP'
        : 'Failed to resend OTP';
      toast.error(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ✅ Left Side - OTP Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
        <div className="absolute top-6 left-6 flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="HD Logo"
            width={64}
            height={64}
            className="rounded-lg"
          />
          {/* <span className="text-gray-900 font-semibold text-xl">HD</span> */}
        </div>
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          {/* <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">HD</span>
            </div>
            <span className="text-gray-900 font-semibold text-xl">HD</span>
          </div> */}

          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Sign up</h1>
            <p className="text-gray-600">Sign up to enjoy the feature of HD</p>
          </div>

          {/* Email Display */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-sm text-gray-600 mb-1">Verification code sent to:</p>
            <p className="font-medium text-gray-900">{email}</p>
            <p className="text-xs text-gray-500 mt-1">
              Please check your email (including spam folder) for the OTP
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OTP
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type={showOtp ? "text" : "password"}
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                  }}
                  placeholder="Enter 6-digit OTP"
                  disabled={loading}
                  className="w-full h-12 px-4 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 text-center text-lg font-mono tracking-wider disabled:opacity-50"
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowOtp(!showOtp)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  {showOtp ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </div>
              ) : (
                'Sign up'
              )}
            </Button>

            {/* Resend OTP */}
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-sm text-gray-600">
                  Resend OTP in {countdown} seconds
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendLoading || loading}
                  className="text-sm text-blue-600 hover:underline disabled:opacity-50 font-medium"
                >
                  {resendLoading ? 'Sending...' : 'Resend OTP'}
                </button>
              )}
            </div>

            {/* Back Button */}
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="w-full text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              ← Back to sign up
            </button>
          </form>
        </div>
      </div>

      {/* ✅ Right Side - Blue Gradient Background */}
      <div className="hidden lg:flex flex-1 relative">
        <Image
          src="/background.jpg"
          alt="Background"
          fill
          style={{ objectFit: 'cover' }}
          priority
          className="absolute inset-0"
        />
      </div>
    </div>
  );
}
