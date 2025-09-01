import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt';
import { generateOTP, sendOTPEmail } from '../utils/otp';
import { RegisterData, OTPData, AuthRequest } from '../types';

// Helper function to normalize emails consistently
const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

// Helper function to safely get error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error occurred';
};

// Updated passwordless registration with email normalization
export const register = async (req: Request, res: Response) => {
  try {
    const { email, name, dateOfBirth } = req.body;

    console.log('🔍 Passwordless registration for:', email);

    // Normalize email consistently
    const normalizedEmail = normalizeEmail(email);
    console.log('📧 Normalized email:', normalizedEmail);

    // Check if user exists and is verified
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    console.log('👤 Existing user found:', !!existingUser);
    console.log('✅ User verified:', existingUser?.verified);

    if (existingUser && existingUser.verified) {
      return res.status(400).json({ error: 'Email already registered and verified' });
    }

    // Create or update user (no password required)
    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        verified: false,
      },
      create: {
        email: normalizedEmail,
        name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        verified: false,
      },
    });

    console.log('👤 User created/updated:', user.id);

    // Generate and send OTP
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Clear existing OTPs
    await prisma.oTP.updateMany({
      where: { email: normalizedEmail, used: false },
      data: { used: true },
    });

    // Create new OTP
    await prisma.oTP.create({
      data: {
        email: normalizedEmail,
        otp: hashedOTP,
        userId: user.id,
        expiresAt,
        used: false,
      },
    });

    console.log('🔄 Sending OTP to:', normalizedEmail);
    await sendOTPEmail(normalizedEmail, otp);
    console.log('✅ OTP sent successfully');

    res.status(201).json({
      message: 'Registration successful. Please check your email for OTP verification.',
      userId: user.id
    });

  } catch (error: unknown) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Updated OTP verification with auto-login
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp }: OTPData = req.body;

    console.log('=== OTP Verification Debug ===');
    console.log('Email:', email);
    console.log('OTP received:', otp);

    // Normalize email
    const normalizedEmail = normalizeEmail(email);
    console.log('📧 Normalized email:', normalizedEmail);

    // Find valid OTP
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        email: normalizedEmail,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });

    console.log('OTP record found:', !!otpRecord);

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Verify OTP
    const isValidOTP = await bcrypt.compare(otp, otpRecord.otp);
    console.log('OTP comparison result:', isValidOTP);

    if (!isValidOTP) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Mark OTP as used and verify user
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    const user = await prisma.user.update({
      where: { id: otpRecord.userId! },
      data: { 
        verified: true,
        updatedAt: new Date(),
      },
    });

    // Generate JWT token for auto-login
    const token = generateToken(user.id, user.email);

    console.log('✅ OTP verified successfully - User authenticated');

    res.json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        verified: user.verified,
      },
    });

  } catch (error: unknown) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// FIXED - Updated passwordless login with proper email normalization
export const login = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    console.log('🔍 Passwordless login attempt for:', email);

    // Normalize email consistently with registration
    const normalizedEmail = normalizeEmail(email);
    console.log('📧 Normalized email for lookup:', normalizedEmail);

    // Find user with normalized email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    console.log('👤 User found in database:', !!user);
    
    if (!user) {
      console.log('❌ User not found with email:', normalizedEmail);
      
      // Debug: Let's also search case-insensitively to see if there's a case mismatch
      const usersCaseInsensitive = await prisma.user.findMany({
        where: {
          email: {
            contains: email,
            mode: 'insensitive'
          }
        }
      });
      
      console.log('🔍 Case-insensitive search results:', usersCaseInsensitive.length);
      usersCaseInsensitive.forEach(u => console.log('📧 Found email variant:', u.email));
      
      return res.status(400).json({ error: 'User not found. Please sign up first.' });
    }

    console.log('✅ User found - ID:', user.id, 'Verified:', user.verified);

    if (!user.verified) {
      console.log('❌ User exists but not verified');
      return res.status(400).json({
        error: 'Email not verified. Please complete verification first.',
        needsVerification: true
      });
    }

    // Generate and send OTP for login
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Clear existing OTPs
    await prisma.oTP.updateMany({
      where: { email: normalizedEmail, used: false },
      data: { used: true },
    });

    // Create new OTP
    await prisma.oTP.create({
      data: {
        email: normalizedEmail,
        otp: hashedOTP,
        userId: user.id,
        expiresAt,
        used: false,
      },
    });

    console.log('🔄 Sending login OTP to:', normalizedEmail);
    await sendOTPEmail(normalizedEmail, otp);
    console.log('✅ Login OTP sent successfully');

    res.json({
      message: 'OTP sent to your email. Please verify to login.',
      requiresOTP: true
    });

  } catch (error: unknown) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login with OTP verification
export const loginWithOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    console.log('🔍 Login OTP verification for:', email);

    // Normalize email
    const normalizedEmail = normalizeEmail(email);

    // Find valid OTP
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        email: normalizedEmail,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Verify OTP
    const isValidOTP = await bcrypt.compare(otp, otpRecord.otp);

    if (!isValidOTP) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Generate JWT token
    const token = generateToken(otpRecord.user!.id, otpRecord.user!.email);

    console.log('✅ Login successful via OTP');

    res.json({
      token,
      user: {
        id: otpRecord.user!.id,
        email: otpRecord.user!.email,
        name: otpRecord.user!.name,
        verified: otpRecord.user!.verified,
      },
    });

  } catch (error: unknown) {
    console.error('Login with OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Send OTP (for both registration and login)
export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { email, type = 'signup' } = req.body; // type: 'signup' or 'login'

    console.log('=== Send OTP Debug ===');
    console.log('Email:', email);
    console.log('Type:', type);

    // Normalize email
    const normalizedEmail = normalizeEmail(email);

    if (type === 'login') {
      // For login, user must exist and be verified
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found. Please sign up first.' });
      }

      if (!user.verified) {
        return res.status(400).json({ error: 'Email not verified. Please complete signup first.' });
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    console.log('Generated OTP:', otp);

    // Clear existing OTPs
    await prisma.oTP.updateMany({
      where: { email: normalizedEmail, used: false },
      data: { used: true },
    });

    // Create new OTP
    await prisma.oTP.create({
      data: {
        email: normalizedEmail,
        otp: hashedOTP,
        expiresAt,
        used: false,
      },
    });

    console.log('🔄 Sending OTP email...');
    await sendOTPEmail(normalizedEmail, otp);
    console.log('✅ OTP sent successfully');

    res.json({ message: 'OTP sent successfully' });

  } catch (error: unknown) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

// Resend OTP
export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Normalize email
    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Clear existing OTPs
    await prisma.oTP.updateMany({
      where: { email: normalizedEmail, used: false },
      data: { used: true },
    });

    // Create new OTP
    await prisma.oTP.create({
      data: {
        email: normalizedEmail,
        otp: hashedOTP,
        userId: user.id,
        expiresAt,
        used: false,
      },
    });

    console.log('🔄 Resending OTP email...');
    await sendOTPEmail(normalizedEmail, otp);
    console.log('✅ OTP resent successfully');

    res.json({ message: 'OTP sent successfully' });

  } catch (error: unknown) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ✅ Fixed debug endpoint with proper error handling
export const debugUser = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    
    console.log('🔍 Debugging user for email:', email);
    
    const normalizedEmail = normalizeEmail(email as string);
    
    // Find user with exact match
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        otps: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    // Also search case-insensitively
    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: email as string,
          mode: 'insensitive'
        }
      }
    });

    res.json({
      searchEmail: email,
      normalizedEmail,
      exactMatch: user,
      similarEmails: users,
      totalUsers: await prisma.user.count()
    });

  } catch (error: unknown) {
    console.error('Debug error:', error);
    // ✅ Fixed: Use helper function to safely get error message
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// ✅ Add health check endpoint
export const healthCheck = async (req: Request, res: Response) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'Server is running',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      port: process.env.PORT || 5000
    });
  } catch (error: unknown) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'Server error',
      error: getErrorMessage(error)
    });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        verified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user); // ✅ Return user directly (not wrapped in { user })
  } catch (error: unknown) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};
