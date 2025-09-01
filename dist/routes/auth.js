"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
// ✅ Health check route - ADD THIS
router.get('/health', authController_1.healthCheck);
// Auth routes
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.post('/login-otp', authController_1.loginWithOTP);
router.post('/verify-otp', authController_1.verifyOTP);
router.post('/send-otp', authController_1.sendOTP);
router.post('/resend-otp', authController_1.resendOTP);
// Debug route (remove in production)
router.get('/debug-user', authController_1.debugUser);
// Protected routes
router.get('/me', authController_1.getProfile);
exports.default = router;
