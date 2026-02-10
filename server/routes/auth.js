const express = require('express');
const passport = require('passport');
const crypto = require('crypto');

const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  generateSecureToken,
  encrypt,
  decrypt
} = require('../utils/auth');
const { authenticateToken, logAction } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin,
  validatePasswordChange,
  validatePasswordCreation,
  validateProfileUpdate,
  validateAIConfig,
  validateEmail,
  validatePasswordReset
} = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { email, password, name, organization, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
      organization,
      role: role || 'auditor' // Default role
    });

    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user._id });
    const refreshToken = generateRefreshToken({ userId: user._id });

    // Store refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    // Log registration
    await AuditLog.logAction(user._id, 'user_created', {
      method: 'local',
      email: user.email,
      role: user.role
    }, req);

    // Remove sensitive data
    const userResponse = user.toJSON();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', validateUserLogin, (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    try {
      if (err) {
        logger.error('Login authentication error:', err);
        return res.status(500).json({
          success: false,
          message: 'Authentication error'
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: info?.message || 'Invalid credentials'
        });
      }

      // Generate tokens
      const accessToken = generateAccessToken({ userId: user._id });
      const refreshToken = generateRefreshToken({ userId: user._id });

      // Store refresh token
      user.refreshTokens.push({ token: refreshToken });
      await user.save();

      // Update last login
      await user.updateLastLogin();

      // Remove sensitive data
      const userResponse = user.toJSON();

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  })(req, res, next);
});

/**
 * @route GET /api/auth/google
 * @desc Start Google OAuth flow
 * @access Public
 */
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

/**
 * @route GET /api/auth/google/callback
 * @desc Handle Google OAuth callback
 * @access Public
 */
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;

      // Generate tokens
      const accessToken = generateAccessToken({ userId: user._id });
      const refreshToken = generateRefreshToken({ userId: user._id });

      // Store refresh token
      user.refreshTokens.push({ token: refreshToken });
      await user.save();

      // Redirect to frontend with tokens
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`);

    } catch (error) {
      logger.error('Google callback error:', error);
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}/login?error=oauth_failed`);
    }
  }
);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Find user and check if refresh token exists
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({ userId: user._id });
    const newRefreshToken = generateRefreshToken({ userId: user._id });

    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
    user.refreshTokens.push({ token: newRefreshToken });
    await user.save();

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authenticateToken, logAction('logout'), async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = req.user;

    // Remove specific refresh token or all tokens
    if (refreshToken) {
      user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
    } else {
      user.refreshTokens = []; // Logout from all devices
    }

    await user.save();

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Get current user
 * @access Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Get user with AI config fields (including encrypted API keys for status check)
    const userWithAI = await User.findById(req.user._id).select('+aiConfig.models.openai.apiKey +aiConfig.models.gemini.apiKey +aiConfig.models.anthropic.apiKey +aiConfig.models.azure.apiKey +aiConfig.models.azure.endpoint');
    const user = userWithAI.toJSON();
    
    // Process AI config to include security indicators without exposing sensitive data
    if (user.aiConfig && user.aiConfig.models) {
      const processedModels = {};
      
      for (const [provider, config] of Object.entries(user.aiConfig.models)) {
        processedModels[provider] = {
          model: config.model || null,
          hasApiKey: !!config.apiKey,
          ...(provider === 'azure' && {
            hasEndpoint: !!config.endpoint,
            hasDeploymentName: !!config.deploymentName
          })
        };
      }
      
      user.aiConfig.models = processedModels;
    }
    
    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information'
    });
  }
});

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', authenticateToken, validateProfileUpdate, logAction('profile_update'), async (req, res) => {
  try {
    const { name, organization, email } = req.body;
    const user = req.user;

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email is already in use'
        });
      }
      user.email = email;
      user.isEmailVerified = false; // Re-verify email
    }

    if (name) user.name = name;
    if (organization !== undefined) user.organization = organization;

    await user.save();

    const userResponse = user.toJSON();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: userResponse }
    });

  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Profile update failed'
    });
  }
});

/**
 * @route PUT /api/auth/password
 * @desc Change or set password (handles both regular users and OAuth users)
 * @access Private
 */
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has an existing password (regular user vs OAuth user)
    const hasExistingPassword = !!user.password;
    
    // Basic validation
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation does not match'
      });
    }

    // Validate password strength
    const { validatePasswordStrength } = require('../utils/auth');
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors
      });
    }

    // For users with existing passwords, verify current password
    if (hasExistingPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        await AuditLog.logAction(user._id, 'password_change_failed', {
          reason: 'invalid_current_password',
          ip: req.ip
        }, req);

        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Check if new password is same as current
      if (currentPassword === newPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password must be different from current password'
        });
      }
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    // Invalidate all refresh tokens except current session for security
    const currentRefreshToken = req.headers['x-refresh-token'];
    if (currentRefreshToken) {
      user.refreshTokens = user.refreshTokens.filter(tokenObj => 
        tokenObj.token === currentRefreshToken
      );
    } else {
      user.refreshTokens = []; // Clear all if no current token
    }
    await user.save();

    // Log the action
    await AuditLog.logAction(user._id, hasExistingPassword ? 'password_changed' : 'password_set', {
      method: hasExistingPassword ? 'change' : 'creation',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }, req);

    res.json({
      success: true,
      message: hasExistingPassword 
        ? 'Password changed successfully' 
        : 'Password set successfully',
      data: {
        passwordSet: !hasExistingPassword,
        securityAction: 'refresh_tokens_invalidated'
      }
    });

  } catch (error) {
    logger.error('Password change/set error:', {
      error: error.message,
      userId: req.user?._id,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Password operation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/auth/password-status
 * @desc Check if user has a password set (for OAuth users)
 * @access Private
 */
router.get('/password-status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        hasPassword: !!user.password,
        isOAuthUser: !!user.googleId,
        authMethod: user.googleId ? 'oauth' : 'local'
      }
    });

  } catch (error) {
    logger.error('Password status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check password status'
    });
  }
});

/**
 * @route PUT /api/auth/ai-config
 * @desc Update AI configuration
 * @access Private
 */
router.put('/ai-config', authenticateToken, validateAIConfig, logAction('ai_config_update'), async (req, res) => {
  try {
    const { preferredProvider, model, apiKey, azureEndpoint, azureDeployment } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize aiConfig if it doesn't exist
    if (!user.aiConfig) {
      user.aiConfig = {
        preferredProvider: 'openai',
        models: {
          openai: { model: 'gpt-4o-mini' },
          gemini: { model: 'gemini-2.0-flash' },
          anthropic: { model: 'claude-3-sonnet' },
          azure: { model: 'gpt-4o' }
        }
      };
    }

    // Initialize models if they don't exist
    if (!user.aiConfig.models) {
      user.aiConfig.models = {
        openai: { model: 'gpt-4o-mini' },
        gemini: { model: 'gemini-2.0-flash' },
        anthropic: { model: 'claude-3-sonnet' },
        azure: { model: 'gpt-4o' }
      };
    }

    // Update preferred provider
    user.aiConfig.preferredProvider = preferredProvider;

    // Initialize the provider config if it doesn't exist
    if (!user.aiConfig.models[preferredProvider]) {
      user.aiConfig.models[preferredProvider] = {};
    }

    // Update model for the selected provider
    user.aiConfig.models[preferredProvider].model = model;

    // Encrypt and store API key
    user.aiConfig.models[preferredProvider].apiKey = encrypt(apiKey);

    // Handle Azure-specific fields
    if (preferredProvider === 'azure') {
      if (azureEndpoint) {
        user.aiConfig.models[preferredProvider].endpoint = encrypt(azureEndpoint);
      }
      if (azureDeployment) {
        user.aiConfig.models[preferredProvider].deploymentName = azureDeployment;
      }
    }

    // Save the updated user
    await user.save();

    // Log the successful configuration
    await AuditLog.logAction(user._id, 'ai_config_updated', {
      provider: preferredProvider,
      model: model,
      hasApiKey: true,
      isAzure: preferredProvider === 'azure'
    }, req);

    // Return response without sensitive data
    const responseConfig = {
      preferredProvider: user.aiConfig.preferredProvider,
      models: {}
    };

    // Build response with security indicators
    for (const [provider, config] of Object.entries(user.aiConfig.models)) {
      responseConfig.models[provider] = {
        model: config.model || null,
        hasApiKey: !!config.apiKey,
        ...(provider === 'azure' && {
          hasEndpoint: !!config.endpoint,
          hasDeploymentName: !!config.deploymentName
        })
      };
    }

    res.json({
      success: true,
      message: 'AI configuration saved successfully',
      data: { 
        aiConfig: responseConfig,
        provider: preferredProvider,
        model: model
      }
    });

  } catch (error) {
    logger.error('AI config update error:', {
      error: error.message,
      userId: req.user?._id,
      provider: req.body?.preferredProvider,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to save AI configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/auth/ai-config
 * @desc Get AI configuration
 * @access Private
 */
router.get('/ai-config', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize default config if none exists
    if (!user.aiConfig || !user.aiConfig.models) {
      const defaultConfig = {
        preferredProvider: 'openai',
        models: {
          openai: { model: 'gpt-4o-mini', hasApiKey: false },
          gemini: { model: 'gemini-2.0-flash', hasApiKey: false },
          anthropic: { model: 'claude-3-sonnet', hasApiKey: false },
          azure: { model: 'gpt-4o', hasApiKey: false, hasEndpoint: false, hasDeploymentName: false }
        }
      };

      return res.json({
        success: true,
        data: { aiConfig: defaultConfig }
      });
    }

    // Build response with security indicators (no actual API keys)
    const responseConfig = {
      preferredProvider: user.aiConfig.preferredProvider || 'openai',
      models: {}
    };

    const providers = ['openai', 'gemini', 'anthropic', 'azure'];
    
    for (const provider of providers) {
      const config = user.aiConfig.models[provider] || {};
      
      responseConfig.models[provider] = {
        model: config.model || (provider === 'openai' ? 'gpt-4o-mini' : 
                              provider === 'gemini' ? 'gemini-2.0-flash' :
                              provider === 'anthropic' ? 'claude-3-sonnet' : 'gpt-4o'),
        hasApiKey: !!config.apiKey,
        ...(provider === 'azure' && {
          hasEndpoint: !!config.endpoint,
          hasDeploymentName: !!config.deploymentName
        })
      };
    }

    res.json({
      success: true,
      data: { aiConfig: responseConfig }
    });

  } catch (error) {
    logger.error('Get AI config error:', {
      error: error.message,
      userId: req.user?._id,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve AI configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/auth/ai-config/credentials/:provider
 * @desc Get decrypted credentials for a specific provider (for internal use)
 * @access Private
 */
router.get('/ai-config/credentials/:provider', authenticateToken, async (req, res) => {
  try {
    const { provider } = req.params;
    const user = await User.findById(req.user._id);
    
    if (!user || !user.aiConfig || !user.aiConfig.models[provider]) {
      return res.status(404).json({
        success: false,
        message: 'Provider configuration not found'
      });
    }

    const config = user.aiConfig.models[provider];
    
    const credentials = {
      provider,
      model: config.model,
      apiKey: config.apiKey ? decrypt(config.apiKey) : null,
      ...(provider === 'azure' && {
        endpoint: config.endpoint ? decrypt(config.endpoint) : null,
        deploymentName: config.deploymentName || null
      })
    };

    // Log access to credentials
    await AuditLog.logAction(user._id, 'ai_credentials_accessed', {
      provider,
      hasApiKey: !!credentials.apiKey
    }, req);

    res.json({
      success: true,
      data: credentials
    });

  } catch (error) {
    logger.error('Get AI credentials error:', {
      error: error.message,
      userId: req.user?._id,
      provider: req.params.provider,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve credentials'
    });
  }
});

/**
 * @route PUT /api/auth/preferences
 * @desc Update user preferences
 * @access Private
 */
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { theme, density, language } = req.body;
    const user = req.user;

    const preferences = {};
    if (theme && ['light', 'dark', 'system'].includes(theme)) {
      preferences.theme = theme;
    }
    if (density && ['compact', 'comfortable'].includes(density)) {
      preferences.density = density;
    }
    if (language) {
      preferences.language = language;
    }

    await user.updatePreferences(preferences);

    // Get updated user data
    const updatedUser = await User.findById(user._id);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: { user: updatedUser.toJSON() }
    });

  } catch (error) {
    logger.error('Preferences update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences'
    });
  }
});

module.exports = router;
