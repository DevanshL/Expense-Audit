const AuthService = require('../services/AuthService');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');
const passport = require('passport');

class AuthController {
  async register(req, res) {
    try {
      const result = await AuthService.register(req.body, req);
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(error.message === 'User already exists' ? 409 : 500).json({
        success: false,
        message: error.message || 'Registration failed'
      });
    }
  }

  login(req, res, next) {
    passport.authenticate('local', async (err, user, info) => {
      try {
        if (err || !user) {
          const status = err ? 500 : 401;
          const message = err ? 'Authentication error' : (info?.message || 'Invalid credentials');
          
          if (!user) {
            await AuditLog.logAction(null, 'login_failed', {
              email: req.body.email,
              reason: message
            }, req);
          }

          return res.status(status).json({ success: false, message });
        }

        const result = await AuthService.login(user, req);
        res.json({
          success: true,
          message: 'Login successful',
          data: result
        });
      } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
      }
    })(req, res, next);
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw new Error('Refresh token required');

      const result = await AuthService.refreshTokens(refreshToken);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(401).json({ success: false, message: error.message });
    }
  }

  async logout(req, res) {
    try {
      const userId = req.user._id;
      await AuthService.logout(req.user, req.body.refreshToken);
      // Clear all AI chat sessions on logout — history won't survive a logout
      try {
        const ChatService = require('../services/ChatService');
        await ChatService.clearAllSessions(userId);
      } catch (_) { /* non-fatal */ }
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ success: false, message: 'Logout failed' });
    }
  }


  googleLogin(req, res, next) {
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      prompt: 'select_account'
    })(req, res, next);
  }

  googleCallback(req, res, next) {
    passport.authenticate('google', { session: false }, async (err, user, info) => {
      try {
        if (err || !user) {
          logger.error('Google Auth Error:', err || info);
          const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
          return res.redirect(`${frontendURL}/login?error=oauth_failed`);
        }

        const loginResult = await AuthService.login(user, req);
        const { accessToken, refreshToken } = loginResult.tokens;
        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendURL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`);
      } catch (error) {
        logger.error('Google Callback Exception:', error);
        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendURL}/login?error=server_error`);
      }
    })(req, res, next);
  }

  async getMe(req, res) {
    // Logic for returning processed user data (omitted for brevity in this initial pass)
    res.json({ success: true, data: { user: req.user.toJSON() } });
  }
}

module.exports = new AuthController();
