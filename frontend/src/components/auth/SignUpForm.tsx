'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// MUI Date Picker imports
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import TextField from '@mui/material/TextField';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// MUI theme to match design
const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
            '& fieldset': {
              borderColor: '#e2e8f0',
            },
            '&:hover fieldset': {
              borderColor: '#2563eb',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2563eb',
            },
          },
        },
      },
    },
  },
});

// ✅ Updated schema - removed password
const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  dateOfBirth: z.date({
    required_error: 'Please select your date of birth',
  }).refine((date) => date <= new Date(), {
    message: 'Date cannot be in the future',
  }),
  email: z.string().email('Invalid email address'),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  onOTPRequired: (email: string) => void;
}

interface ApiErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
}

export default function SignUpForm({ onOTPRequired }: SignUpFormProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      dateOfBirth: undefined,
      email: '',
    },
  });

  // Redirect authenticated users
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const onSubmit = async (data: SignUpFormValues) => {
    if (loading || submitted) {
      return;
    }

    setLoading(true);
    setSubmitted(true);

    try {
      const formattedData = {
        ...data,
        dateOfBirth: format(data.dateOfBirth, 'yyyy-MM-dd'),
      };

      await api.post('/api/auth/register', formattedData);
      
      toast.success("Account created! Please check your email (including spam folder) for OTP verification.");
      onOTPRequired(data.email);

    } catch (error: unknown) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as ApiErrorResponse;
        errorMessage = apiError.response?.data?.error || errorMessage;
      }

      if (errorMessage.includes('already registered and verified')) {
        toast.error('Email already registered. Please sign in instead.');
        router.push('/auth/login');
        return;
      } else if (errorMessage.includes('already registered')) {
        toast.error('Email already registered but not verified. Please complete verification.');
        onOTPRequired(data.email);
        return;
      } else {
        toast.error(errorMessage);
        setSubmitted(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
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

            <div className="w-full max-w-md space-y-8">
              {/* Header */}
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Sign up</h1>
                <p className="text-gray-600">Sign up to enjoy the feature of HD</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Your Name"
                    disabled={loading || submitted}
                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Date of Birth Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <Controller
                    name="dateOfBirth"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value || null}
                        onChange={(newValue) => field.onChange(newValue)}
                        disabled={loading || submitted}
                        maxDate={new Date()}
                        openTo="year"
                        views={['year', 'month', 'day']}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            variant="outlined"
                            error={!!errors.dateOfBirth}
                            helperText={errors.dateOfBirth?.message}
                            disabled={loading || submitted}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                height: '48px',
                                fontSize: '14px',
                              },
                            }}
                          />
                        )}
                      />
                    )}
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="Email"
                    disabled={loading || submitted}
                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading || submitted}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </div>
                  ) : submitted ? (
                    'Redirecting...'
                  ) : (
                    'Get OTP'
                  )}
                </Button>

                {/* Sign In Link */}
                <p className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </form>
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
      </LocalizationProvider>
    </ThemeProvider>
  );
}
