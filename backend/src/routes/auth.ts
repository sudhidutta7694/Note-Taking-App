import { Router } from 'express';
import {
  register,
  login,
  loginWithOTP,
  verifyOTP,
  sendOTP,
  resendOTP,
  getProfile,
  debugUser,
  healthCheck,
} from '../controllers/authController';

const router = Router();

// ✅ Health check route - ADD THIS
router.get('/health', healthCheck);

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/login-otp', loginWithOTP);
router.post('/verify-otp', verifyOTP);
router.post('/send-otp', sendOTP);
router.post('/resend-otp', resendOTP);

// Debug route (remove in production)
router.get('/debug-user', debugUser);

// Protected routes
router.get('/me', getProfile);

export default router;
