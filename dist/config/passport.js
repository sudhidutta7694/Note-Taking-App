"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_jwt_1 = require("passport-jwt");
const database_1 = __importDefault(require("./database"));
// JWT Strategy
const jwtOptions = {
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
    ignoreExpiration: false, // Ensure token expiration is checked
};
passport_1.default.use(new passport_jwt_1.Strategy(jwtOptions, async (payload, done) => {
    try {
        console.log('JWT Payload received:', payload); // Debug log
        // ✅ Ensure payload.id exists and is valid
        if (!payload.id) {
            console.error('JWT payload missing id field:', payload);
            return done(null, false);
        }
        const user = await database_1.default.user.findUnique({
            where: { id: payload.id },
            select: {
                id: true,
                email: true,
                name: true,
                verified: true,
                avatar: true,
            },
        });
        if (user) {
            console.log('User found for JWT:', user.id);
            return done(null, user);
        }
        else {
            console.error('User not found for JWT payload id:', payload.id);
            return done(null, false);
        }
    }
    catch (error) {
        console.error('JWT Strategy error:', error);
        return done(error, false);
    }
}));
exports.default = passport_1.default;
