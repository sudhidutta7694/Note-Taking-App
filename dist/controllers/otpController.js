"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendOTP = exports.verifyOTP = exports.sendOTP = void 0;
const otp_1 = require("../utils/otp");
const database_1 = __importDefault(require("../config/database"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        // Check if user exists and is already verified
        const existingUser = await database_1.default.user.findUnique({
            where: { email }
        });
        if (existingUser && existingUser.verified) {
            return res.status(400).json({ error: 'Email already verified' });
        }
        // Generate OTP
        const otp = (0, otp_1.generateOTP)();
        const otpHash = await bcryptjs_1.default.hash(otp, 12);
        // Delete any existing unused OTPs for this email
        await database_1.default.oTP.deleteMany({
            where: {
                email,
                used: false
            }
        });
        // Create new OTP record
        await database_1.default.oTP.create({
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
            await database_1.default.user.create({
                data: {
                    email,
                    name: '', // Will be updated during registration
                    verified: false,
                }
            });
        }
        // Send OTP email
        await (0, otp_1.sendOTPEmail)(email, otp);
        res.json({ message: 'OTP sent successfully' });
    }
    catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
};
exports.sendOTP = sendOTP;
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        console.log('=== OTP Verification Debug ===');
        console.log('Email:', email);
        console.log('OTP received:', otp);
        // Find the most recent unused OTP for this email
        const otpRecord = await database_1.default.oTP.findFirst({
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
        const isValidOTP = await bcryptjs_1.default.compare(cleanOTP, otpRecord.otp);
        console.log('OTP comparison result:', isValidOTP);
        if (!isValidOTP) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }
        // Mark OTP as used
        await database_1.default.oTP.update({
            where: { id: otpRecord.id },
            data: { used: true }
        });
        // Mark user as verified
        await database_1.default.user.update({
            where: { email },
            data: { verified: true }
        });
        // Clean up old OTPs for this email
        await database_1.default.oTP.deleteMany({
            where: {
                email,
                id: { not: otpRecord.id }
            }
        });
        console.log('✅ OTP verified successfully');
        res.json({ message: 'Email verified successfully' });
    }
    catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
};
exports.verifyOTP = verifyOTP;
const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await database_1.default.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }
        if (user.verified) {
            return res.status(400).json({ error: 'Email already verified' });
        }
        // Generate new OTP
        const otp = (0, otp_1.generateOTP)();
        const otpHash = await bcryptjs_1.default.hash(otp, 12);
        // Delete existing unused OTPs
        await database_1.default.oTP.deleteMany({
            where: {
                email,
                used: false
            }
        });
        // Create new OTP record
        await database_1.default.oTP.create({
            data: {
                email,
                otp: otpHash,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                userId: user.id,
                used: false
            }
        });
        // Send OTP email
        await (0, otp_1.sendOTPEmail)(email, otp);
        res.json({ message: 'OTP sent successfully' });
    }
    catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ error: 'Failed to resend OTP' });
    }
};
exports.resendOTP = resendOTP;
