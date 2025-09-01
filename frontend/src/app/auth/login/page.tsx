'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/api';

// ✅ Simple schema for email-only step, then email + OTP
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { setAuth, isAuthenticated } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      otp: '',
    },
  });

  const email = watch('email');
  const otp = watch('otp');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Resend cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP to email
  const sendLoginOTP = async (email: string) => {
    console.log('📤 Sending OTP to:', email);
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', { email });
      
      toast.success('✅ OTP sent to your email! Check inbox and spam folder.');
      setShowOtpInput(true);
      setValue('email', email);
      setResendCooldown(60);
      
    } catch (error: any) {
      console.error('❌ Send OTP error:', error);
      
      if (error.code === 'ERR_NETWORK' || error.message.includes('ERR_CONNECTION_REFUSED')) {
        toast.error('❌ Cannot connect to server. Please check if your backend is running.');
      } else if (error.response?.data?.error) {
        const errorMessage = error.response.data.error;
        if (errorMessage.includes('not found')) {
          toast.error('User not found. Please sign up first.');
          router.push('/auth/signup');
        } else if (errorMessage.includes('not verified')) {
          toast.error('Email not verified. Please complete signup first.');
          router.push('/auth/signup');
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error('Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and login
  const verifyOTPAndLogin = async (data: LoginFormValues) => {
    console.log('🔐 Verifying OTP...');
    
    if (!data.otp || data.otp.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/login-otp', {
        email: data.email,
        otp: data.otp,
      });

      const { token, user } = response;
      setAuth({ token, user });
      
      toast.success('✅ Login successful! Welcome back!');
      router.replace('/dashboard');

    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      if (error.response?.data?.error) {
        const errorMessage = error.response.data.error;
        if (errorMessage.includes('Invalid or expired OTP')) {
          toast.error('Invalid or expired OTP. Please try again or request a new OTP.');
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    console.log('🎯 Form submitted:', { email: data.email, hasOtp: !!data.otp });
    
    if (!showOtpInput) {
      // Step 1: Send OTP
      await sendLoginOTP(data.email);
    } else {
      // Step 2: Verify OTP and login
      await verifyOTPAndLogin(data);
    }
  };

  const handleResendOTP = async () => {
    const currentEmail = watch('email');
    if (!currentEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setResendLoading(true);
    try {
      await api.post('/api/auth/send-otp', { 
        email: currentEmail, 
        type: 'login' 
      });
      
      toast.success('✅ OTP resent! Check your email and spam folder.');
      setResendCooldown(60);
    } catch (error: any) {
      console.error('❌ Resend OTP error:', error);
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const isButtonDisabled = loading || (!showOtpInput && (!email || !!errors.email)) || (showOtpInput && (!otp || otp.length !== 6));

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Sign in</h1>
        <p className="text-gray-600">Please login to continue to your account.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-blue-600 mb-2">
            Email
          </label>
          <Input
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
              }
            })}
            type="email"
            placeholder="sudhisundar.dutta29@gmail.com"
            disabled={loading || showOtpInput}
            className={`w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.email ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : ''
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* OTP Field - Only show when OTP is required */}
        {showOtpInput && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OTP
            </label>
            <div className="relative">
              <Input
                {...register('otp', {
                  required: showOtpInput ? 'OTP is required' : false,
                  minLength: { value: 6, message: 'OTP must be 6 digits' },
                  maxLength: { value: 6, message: 'OTP must be 6 digits' }
                })}
                type={showOtp ? 'text' : 'password'}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                disabled={loading}
                className={`w-full h-12 px-4 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 text-center text-lg tracking-wider ${
                  errors.otp ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : ''
                }`}
                onInput={(e) => {
                  const value = e.currentTarget.value.replace(/\D/g, '').slice(0, 6);
                  setValue('otp', value);
                }}
              />
              <button
                type="button"
                onClick={() => setShowOtp(!showOtp)}
                disabled={loading}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:opacity-50"
              >
                {showOtp ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.otp && (
              <p className="mt-1 text-sm text-red-600">{errors.otp.message}</p>
            )}
          </div>
        )}

        {/* Resend OTP & Keep logged in - Only show when OTP input is visible */}
        {showOtpInput && (
          <div className="flex items-center justify-between">
            {resendCooldown > 0 ? (
              <span className="text-sm text-gray-500">
                Resend OTP in {resendCooldown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendLoading || loading}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 disabled:opacity-50"
              >
                {resendLoading ? 'Sending...' : 'Resend OTP'}
              </button>
            )}
            
            <div className="flex items-center">
              <input
                id="keep-logged-in"
                type="checkbox"
                checked={keepLoggedIn}
                onChange={(e) => setKeepLoggedIn(e.target.checked)}
                disabled={loading}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
              />
              <label htmlFor="keep-logged-in" className="ml-2 block text-sm text-gray-700 font-medium">
                Keep me logged in
              </label>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isButtonDisabled}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {showOtpInput ? 'Signing in...' : 'Sending OTP...'}
            </div>
          ) : (
            showOtpInput ? 'Sign in' : 'Send OTP'
          )}
        </Button>
      </form>

      {/* Sign Up Link */}
      <div className="mt-8 text-center">
        <p className="text-gray-600">
          Need an account?{' '}
          <Link 
            href="/auth/signup" 
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* ✅ Left Side - Form with Logo at Top-Left */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
        {/* ✅ Logo positioned at top-left */}
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

        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>

      {/* ✅ Right Side - Your Custom Background Image */}
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
