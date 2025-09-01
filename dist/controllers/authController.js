"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.healthCheck = exports.debugUser = exports.resendOTP = exports.sendOTP = exports.loginWithOTP = exports.login = exports.verifyOTP = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database"));
const jwt_1 = require("../utils/jwt");
const otp_1 = require("../utils/otp");
// Helper function to normalize emails consistently
const normalizeEmail = (email) => {
    return email.trim().toLowerCase();
};
// Helper function to safely get error message
const getErrorMessage = (error) => {
    if (error instanceof Error)
        return error.message;
    if (typeof error === 'string')
        return error;
    return 'Unknown error occurred';
};
// Updated passwordless registration with email normalization
const register = async (req, res) => {
    try {
        const { email, name, dateOfBirth } = req.body;
        console.log('🔍 Passwordless registration for:', email);
        // Normalize email consistently
        const normalizedEmail = normalizeEmail(email);
        console.log('📧 Normalized email:', normalizedEmail);
        // Check if user exists and is verified
        const existingUser = await database_1.default.user.findUnique({
            where: { email: normalizedEmail }
        });
        console.log('👤 Existing user found:', !!existingUser);
        console.log('✅ User verified:', existingUser?.verified);
        if (existingUser && existingUser.verified) {
            return res.status(400).json({ error: 'Email already registered and verified' });
        }
        // Create or update user (no password required)
        const user = await database_1.default.user.upsert({
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
        const otp = (0, otp_1.generateOTP)();
        const hashedOTP = await bcryptjs_1.default.hash(otp, 12);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        // Clear existing OTPs
        await database_1.default.oTP.updateMany({
            where: { email: normalizedEmail, used: false },
            data: { used: true },
        });
        // Create new OTP
        await database_1.default.oTP.create({
            data: {
                email: normalizedEmail,
                otp: hashedOTP,
                userId: user.id,
                expiresAt,
                used: false,
            },
        });
        console.log('🔄 Sending OTP to:', normalizedEmail);
        await (0, otp_1.sendOTPEmail)(normalizedEmail, otp);
        console.log('✅ OTP sent successfully');
        res.status(201).json({
            message: 'Registration successful. Please check your email for OTP verification.',
            userId: user.id
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};
exports.register = register;
// Updated OTP verification with auto-login
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        console.log('=== OTP Verification Debug ===');
        console.log('Email:', email);
        console.log('OTP received:', otp);
        // Normalize email
        const normalizedEmail = normalizeEmail(email);
        console.log('📧 Normalized email:', normalizedEmail);
        // Find valid OTP
        const otpRecord = await database_1.default.oTP.findFirst({
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
        const isValidOTP = await bcryptjs_1.default.compare(otp, otpRecord.otp);
        console.log('OTP comparison result:', isValidOTP);
        if (!isValidOTP) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }
        // Mark OTP as used and verify user
        await database_1.default.oTP.update({
            where: { id: otpRecord.id },
            data: { used: true },
        });
        const user = await database_1.default.user.update({
            where: { id: otpRecord.userId },
            data: {
                verified: true,
                updatedAt: new Date(),
            },
        });
        // Generate JWT token for auto-login
        const token = (0, jwt_1.generateToken)(user.id, user.email);
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
    }
    catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.verifyOTP = verifyOTP;
// FIXED - Updated passwordless login with proper email normalization
const login = async (req, res) => {
    try {
        const { email } = req.body;
        console.log('🔍 Passwordless login attempt for:', email);
        // Normalize email consistently with registration
        const normalizedEmail = normalizeEmail(email);
        console.log('📧 Normalized email for lookup:', normalizedEmail);
        // Find user with normalized email
        const user = await database_1.default.user.findUnique({
            where: { email: normalizedEmail },
        });
        console.log('👤 User found in database:', !!user);
        if (!user) {
            console.log('❌ User not found with email:', normalizedEmail);
            // Debug: Let's also search case-insensitively to see if there's a case mismatch
            const usersCaseInsensitive = await database_1.default.user.findMany({
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
        const otp = (0, otp_1.generateOTP)();
        const hashedOTP = await bcryptjs_1.default.hash(otp, 12);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        // Clear existing OTPs
        await database_1.default.oTP.updateMany({
            where: { email: normalizedEmail, used: false },
            data: { used: true },
        });
        // Create new OTP
        await database_1.default.oTP.create({
            data: {
                email: normalizedEmail,
                otp: hashedOTP,
                userId: user.id,
                expiresAt,
                used: false,
            },
        });
        console.log('🔄 Sending login OTP to:', normalizedEmail);
        await (0, otp_1.sendOTPEmail)(normalizedEmail, otp);
        console.log('✅ Login OTP sent successfully');
        res.json({
            message: 'OTP sent to your email. Please verify to login.',
            requiresOTP: true
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.login = login;
// Login with OTP verification
const loginWithOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        console.log('🔍 Login OTP verification for:', email);
        // Normalize email
        const normalizedEmail = normalizeEmail(email);
        // Find valid OTP
        const otpRecord = await database_1.default.oTP.findFirst({
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
        const isValidOTP = await bcryptjs_1.default.compare(otp, otpRecord.otp);
        if (!isValidOTP) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }
        // Mark OTP as used
        await database_1.default.oTP.update({
            where: { id: otpRecord.id },
            data: { used: true },
        });
        // Generate JWT token
        const token = (0, jwt_1.generateToken)(otpRecord.user.id, otpRecord.user.email);
        console.log('✅ Login successful via OTP');
        res.json({
            token,
            user: {
                id: otpRecord.user.id,
                email: otpRecord.user.email,
                name: otpRecord.user.name,
                verified: otpRecord.user.verified,
            },
        });
    }
    catch (error) {
        console.error('Login with OTP error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.loginWithOTP = loginWithOTP;
// Send OTP (for both registration and login)
const sendOTP = async (req, res) => {
    try {
        const { email, type = 'signup' } = req.body; // type: 'signup' or 'login'
        console.log('=== Send OTP Debug ===');
        console.log('Email:', email);
        console.log('Type:', type);
        // Normalize email
        const normalizedEmail = normalizeEmail(email);
        if (type === 'login') {
            // For login, user must exist and be verified
            const user = await database_1.default.user.findUnique({
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
        const otp = (0, otp_1.generateOTP)();
        const hashedOTP = await bcryptjs_1.default.hash(otp, 12);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        console.log('Generated OTP:', otp);
        // Clear existing OTPs
        await database_1.default.oTP.updateMany({
            where: { email: normalizedEmail, used: false },
            data: { used: true },
        });
        // Create new OTP
        await database_1.default.oTP.create({
            data: {
                email: normalizedEmail,
                otp: hashedOTP,
                expiresAt,
                used: false,
            },
        });
        console.log('🔄 Sending OTP email...');
        await (0, otp_1.sendOTPEmail)(normalizedEmail, otp);
        console.log('✅ OTP sent successfully');
        res.json({ message: 'OTP sent successfully' });
    }
    catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
};
exports.sendOTP = sendOTP;
// Resend OTP
const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        // Normalize email
        const normalizedEmail = normalizeEmail(email);
        const user = await database_1.default.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.verified) {
            return res.status(400).json({ error: 'Email already verified' });
        }
        // Generate new OTP
        const otp = (0, otp_1.generateOTP)();
        const hashedOTP = await bcryptjs_1.default.hash(otp, 12);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        // Clear existing OTPs
        await database_1.default.oTP.updateMany({
            where: { email: normalizedEmail, used: false },
            data: { used: true },
        });
        // Create new OTP
        await database_1.default.oTP.create({
            data: {
                email: normalizedEmail,
                otp: hashedOTP,
                userId: user.id,
                expiresAt,
                used: false,
            },
        });
        console.log('🔄 Resending OTP email...');
        await (0, otp_1.sendOTPEmail)(normalizedEmail, otp);
        console.log('✅ OTP resent successfully');
        res.json({ message: 'OTP sent successfully' });
    }
    catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.resendOTP = resendOTP;
// ✅ Fixed debug endpoint with proper error handling
const debugUser = async (req, res) => {
    try {
        const { email } = req.query;
        console.log('🔍 Debugging user for email:', email);
        const normalizedEmail = normalizeEmail(email);
        // Find user with exact match
        const user = await database_1.default.user.findUnique({
            where: { email: normalizedEmail },
            include: {
                otps: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });
        // Also search case-insensitively
        const users = await database_1.default.user.findMany({
            where: {
                email: {
                    contains: email,
                    mode: 'insensitive'
                }
            }
        });
        res.json({
            searchEmail: email,
            normalizedEmail,
            exactMatch: user,
            similarEmails: users,
            totalUsers: await database_1.default.user.count()
        });
    }
    catch (error) {
        console.error('Debug error:', error);
        // ✅ Fixed: Use helper function to safely get error message
        res.status(500).json({ error: getErrorMessage(error) });
    }
};
exports.debugUser = debugUser;
// ✅ Add health check endpoint
const healthCheck = async (req, res) => {
    try {
        // Test database connection
        await database_1.default.$queryRaw `SELECT 1`;
        res.json({
            status: 'Server is running',
            timestamp: new Date().toISOString(),
            database: 'Connected',
            port: process.env.PORT || 5000
        });
    }
    catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({
            status: 'Server error',
            error: getErrorMessage(error)
        });
    }
};
exports.healthCheck = healthCheck;
const getProfile = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const user = await database_1.default.user.findUnique({
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
    }
    catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};
exports.getProfile = getProfile;
