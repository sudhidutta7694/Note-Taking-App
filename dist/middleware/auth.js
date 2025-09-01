"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = void 0;
const passport_1 = __importDefault(require("passport"));
const authenticateJWT = (req, res, next) => {
    // Debug: Log the Authorization header
    console.log('🔍 Auth Middleware - Authorization header:', req.headers.authorization);
    passport_1.default.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            console.error('❌ Authentication error:', err);
            return res.status(500).json({ error: 'Authentication error' });
        }
        if (!user) {
            console.error('❌ Authentication failed:', info?.message || 'Unknown reason');
            // More specific error messages
            if (!req.headers.authorization) {
                return res.status(401).json({ error: 'Authorization header missing' });
            }
            else if (!req.headers.authorization.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Invalid authorization header format. Use: Bearer <token>' });
            }
            else {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }
        }
        console.log('✅ Authentication successful for user:', user.userId);
        req.user = {
            userId: user?.userId || user?.id,
            email: user.email,
            name: user.name,
            verified: user.verified
        };
        console.log('✅ Authentication successful for user:', req.user.id);
        console.log('✅ req.user set to:', req.user); // Debug log
        next();
    })(req, res, next);
};
exports.authenticateJWT = authenticateJWT;
