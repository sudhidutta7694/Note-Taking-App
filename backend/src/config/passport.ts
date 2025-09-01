import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import prisma from './database';

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET as string,
  ignoreExpiration: false, // Ensure token expiration is checked
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      console.log('JWT Payload received:', payload); // Debug log
      
      // ✅ Ensure payload.id exists and is valid
      if (!payload.id) {
        console.error('JWT payload missing id field:', payload);
        return done(null, false);
      }

      const user = await prisma.user.findUnique({
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
      } else {
        console.error('User not found for JWT payload id:', payload.id);
        return done(null, false);
      }
    } catch (error) {
      console.error('JWT Strategy error:', error);
      return done(error, false);
    }
  })
);

export default passport;
