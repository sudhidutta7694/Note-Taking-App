import { Request, Response } from 'express';
import { generateOTP, sendOTPEmail } from '../utils/otp';
import prisma from '../config/database';
import bcrypt from 'bcryptjs';

export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Check if user exists and is already verified
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser && existingUser.verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 12);

    // Delete any existing unused OTPs for this email
    await prisma.oTP.deleteMany({
      where: { 
        email,
        used: false 
      }
    });

    // Create new OTP record
    await prisma.oTP.create({
      data: {
        email,
        otp: otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        userId: existingUser?.id,
        used: false
      }
    });

    // Create user if doesn't exist
    if (!existingUser) {
      await prisma.user.create({
        data: {
          email,
          name: '', // Will be updated during registration
          verified: false,
        }
      });
    }

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    console.log('=== OTP Verification Debug ===');
    console.log('Email:', email);
    console.log('OTP received:', otp);

    // Find the most recent unused OTP for this email
    const otpRecord = await prisma.oTP.findFirst({
      where: { 
        email,
        used: false
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('OTP record found:', !!otpRecord);
    console.log('OTP expires at:', otpRecord?.expiresAt);

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    if (new Date() > otpRecord.expiresAt) {
      console.log('❌ OTP expired');
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // Verify OTP
    const cleanOTP = String(otp).trim();
    const isValidOTP = await bcrypt.compare(cleanOTP, otpRecord.otp);
    console.log('OTP comparison result:', isValidOTP);

    if (!isValidOTP) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { used: true }
    });

    // Mark user as verified
    await prisma.user.update({
      where: { email },
      data: { verified: true }
    });

    // Clean up old OTPs for this email
    await prisma.oTP.deleteMany({
      where: { 
        email,
        id: { not: otpRecord.id }
      }
    });

    console.log('✅ OTP verified successfully');
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};

export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (user.verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 12);

    // Delete existing unused OTPs
    await prisma.oTP.deleteMany({
      where: { 
        email,
        used: false 
      }
    });

    // Create new OTP record
    await prisma.oTP.create({
      data: {
        email,
        otp: otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        userId: user.id,
        used: false
      }
    });

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
};
