'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import SignUpForm from '@/components/auth/SignUpForm';
import OTPVerification from '@/components/auth/OTPVerification';

export default function SignUpPage() {
  const [showOTP, setShowOTP] = useState(false);
  const [email, setEmail] = useState('');
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // ✅ Redirect authenticated users immediately
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log('🔄 Authenticated user accessing signup page - redirecting to dashboard');
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleOTPRequired = (userEmail: string) => {
    console.log('📧 OTP required for:', userEmail);
    setEmail(userEmail);
    setShowOTP(true);
  };

  const handleBackToSignUp = () => {
    console.log('🔙 Returning to signup form');
    setShowOTP(false);
    setEmail('');
  };

  // ✅ Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // ✅ Don't render anything for authenticated users
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showOTP ? (
        <OTPVerification email={email} onBack={handleBackToSignUp} />
      ) : (
        <SignUpForm onOTPRequired={handleOTPRequired} />
      )}
    </div>
  );
}
