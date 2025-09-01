"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTPEmail = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
const sendOTPEmail = async (email, otp) => {
    console.log('=== SendGrid Debug Info ===');
    console.log('SENDGRID_API_KEY exists:', !!process.env.SENDGRID_API_KEY);
    console.log('SENDGRID_API_KEY starts with:', process.env.SENDGRID_API_KEY?.substring(0, 10));
    console.log('SENDER email:', process.env.SENDER);
    const senderEmail = process.env.SENDER;
    if (!senderEmail) {
        throw new Error('SENDER environment variable is not set');
    }
    if (!process.env.SENDGRID_API_KEY) {
        throw new Error('SENDGRID_API_KEY environment variable is not set');
    }
    const msg = {
        to: email,
        from: {
            email: senderEmail,
            name: 'HD Notes Team' // Optional: Add a friendly sender name
        },
        subject: 'Your OTP for HD Notes Verification',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3B82F6; margin-bottom: 10px;">HD Notes</h1>
          <h2 style="color: #374151; margin-top: 0;">Email Verification</h2>
        </div>
        
        <p style="color: #374151; font-size: 16px;">Your OTP for email verification is:</p>
        
        <div style="background-color: #F3F4F6; padding: 25px; text-align: center; border-radius: 8px; margin: 25px 0;">
          <h1 style="color: #3B82F6; font-size: 36px; margin: 0; letter-spacing: 5px;">${otp}</h1>
        </div>
        
        <p style="color: #6B7280; font-size: 14px;">
          ⏰ This OTP will expire in <strong>10 minutes</strong><br>
          🔒 For security reasons, do not share this code<br>
          ❌ If you didn't request this, please ignore this email
        </p>
      </div>
    `,
    };
    try {
        await mail_1.default.send(msg);
        console.log(`OTP email sent successfully to ${email}`);
    }
    catch (error) {
        console.error('Failed to send OTP email:', error);
        throw new Error('Failed to send verification email');
    }
};
exports.sendOTPEmail = sendOTPEmail;
