const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { 
  generateAccessToken, 
  generateRefreshToken,
  verifyRefreshToken
} = require('../utils/auth');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Register a new user
   */
  async register(userData, req) {
    const { email, password, name, organization, role } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = new User({
      email,
      password,
      name,
      organization,
      role: role || 'auditor'
    });

    await user.save();

    const accessToken = generateAccessToken({ userId: user._id });
    const refreshToken = generateRefreshToken({ userId: user._id });

    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    await AuditLog.logAction(user._id, 'user_created', {
      method: 'local',
      email: user.email,
      role: user.role
    }, req);

    return {
      user: user.toJSON(),
      tokens: { accessToken, refreshToken }
    };
  }

  /**
   * Handle Google OAuth user (find or create)
   */
  async handleGoogleAuth(profile, req) {
    const { id, emails, displayName, photos } = profile;
    const email = emails[0].value;
    const avatar = photos[0]?.value;

    let user = await User.findOne({ 
      $or: [{ googleId: id }, { email }] 
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = id;
        if (!user.avatar) user.avatar = avatar;
        await user.save();
        await AuditLog.logAction(user._id, 'account_linked', { method: 'google', email }, req);
      }
    } else {
      user = new User({
        googleId: id,
        email,
        name: displayName,
        avatar,
        isEmailVerified: true,
        role: 'auditor'
      });
      await user.save();
      await AuditLog.logAction(user._id, 'user_created', { method: 'google', email }, req);
    }

    const accessToken = generateAccessToken({ userId: user._id });
    const refreshToken = generateRefreshToken({ userId: user._id });

    user.refreshTokens.push({ token: refreshToken });
    await user.save();
    await user.updateLastLogin();

    return {
      accessToken,
      refreshToken
    };
  }

  /**
   * Handle login and token generation
   */
  async login(user, req) {
    const accessToken = generateAccessToken({ userId: user._id });
    const refreshToken = generateRefreshToken({ userId: user._id });

    user.refreshTokens.push({ token: refreshToken });
    await user.save();
    await user.updateLastLogin();

    return {
      user: user.toJSON(),
      tokens: { accessToken, refreshToken }
    };
  }

  /**
   * Refresh access token
   */
  async refreshTokens(refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      throw new Error('Invalid refresh token');
    }

    const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
    if (!tokenExists) {
      throw new Error('Invalid refresh token');
    }

    const newAccessToken = generateAccessToken({ userId: user._id });
    const newRefreshToken = generateRefreshToken({ userId: user._id });

    user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
    user.refreshTokens.push({ token: newRefreshToken });
    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  /**
   * Logout user
   */
  async logout(user, refreshToken) {
    if (refreshToken) {
      user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
    } else {
      user.refreshTokens = [];
    }
    await user.save();
  }
}

module.exports = new AuthService();
