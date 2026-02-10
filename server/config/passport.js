const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * Local Strategy for email/password authentication
 */
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, email, password, done) => {
  try {
    const user = await User.findByCredentials(email, password);
    
    // Log successful login
    await AuditLog.logAction(user._id, 'login', {
      method: 'local',
      email: user.email
    }, req);
    
    return done(null, user);
  } catch (error) {
    logger.error('Local authentication error:', error);
    
    // Try to find user for logging failed attempt
    try {
      const user = await User.findOne({ email, isActive: true });
      if (user) {
        await AuditLog.logFailedAction(
          user._id,
          'failed_login',
          error.message,
          { method: 'local', email },
          req
        );
      }
    } catch (logError) {
      logger.error('Failed to log authentication error:', logError);
    }
    
    return done(null, false, { message: error.message });
  }
}));

/**
 * Google OAuth 2.0 Strategy
 */
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with this Google ID
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        // User exists, update last login and return
        await user.updateLastLogin();
        
        await AuditLog.logAction(user._id, 'login', {
          method: 'google',
          email: user.email,
          googleId: profile.id
        }, req);
        
        return done(null, user);
      }
      
      // Check if user exists with same email
      user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        // Link Google account to existing user
        user.googleId = profile.id;
        user.avatar = profile.photos[0]?.value;
        await user.save();
        
        await AuditLog.logAction(user._id, 'login', {
          method: 'google',
          action: 'account_linked',
          email: user.email,
          googleId: profile.id
        }, req);
        
        return done(null, user);
      }
      
      // Create new user
      user = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        avatar: profile.photos[0]?.value,
        isEmailVerified: true, // Google emails are pre-verified
        role: 'auditor' // Default role for new users
      });
      
      await user.save();
      
      await AuditLog.logAction(user._id, 'user_created', {
        method: 'google',
        email: user.email,
        googleId: profile.id
      }, req);
      
      await AuditLog.logAction(user._id, 'login', {
        method: 'google',
        email: user.email,
        googleId: profile.id
      }, req);
      
      return done(null, user);
    } catch (error) {
      logger.error('Google authentication error:', error);
      return done(error, null);
    }
  }));
} else {
  logger.warn('Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
}

/**
 * JWT Strategy for API authentication
 */
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  issuer: 'expenseaudit-ai',
  audience: 'expenseaudit-ai-users',
  passReqToCallback: true
}, async (req, payload, done) => {
  try {
    const user = await User.findById(payload.userId).select('-password');
    
    if (!user || !user.isActive) {
      return done(null, false);
    }
    
    if (user.isLocked) {
      return done(null, false);
    }
    
    return done(null, user);
  } catch (error) {
    logger.error('JWT authentication error:', error);
    return done(error, false);
  }
}));

/**
 * Serialize user for session
 */
passport.serializeUser((user, done) => {
  done(null, user._id);
});

/**
 * Deserialize user from session
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
