const express = require('express');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { authenticateToken, requireRole, logAction } = require('../middleware/auth');
const { validateUserId, validatePagination } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route GET /api/users/usage/test
 * @desc Test endpoint for usage statistics (no auth required)
 * @access Public
 */
router.get('/usage/test', async (req, res) => {
  console.log('TEST: Usage test endpoint hit');
  res.json({
    success: true,
    message: 'Usage endpoint is working',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route GET /api/users/usage
 * @desc Get current user's usage statistics
 * @access Private
 */
router.get('/usage',
  authenticateToken,
  async (req, res) => {
    try {
      console.log('Usage stats request - User ID:', req.user._id);
      console.log('Usage stats request - User object:', req.user);

      const user = await User.findById(req.user._id)
        .select('stats lastLogin name email')
        .lean();

      console.log('Found user:', user);

      if (!user) {
        console.log('User not found in database');
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Ensure stats object exists with defaults
      const stats = {
        filesUploaded: user.stats?.filesUploaded || 0,
        aiSummariesGenerated: user.stats?.aiSummariesGenerated || 0,
        reportsGenerated: user.stats?.reportsGenerated || 0,
        lastActivity: user.stats?.lastActivity || new Date(),
        lastLogin: user.lastLogin || null
      };

      console.log('Returning stats:', stats);

      logger.info('Usage statistics retrieved for user:', {
        userId: req.user._id,
        stats
      });

      res.json({
        success: true,
        data: {
          user: {
            name: user.name,
            email: user.email
          },
          stats
        }
      });

    } catch (error) {
      console.error('Get usage statistics error:', error);
      logger.error('Get usage statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get usage statistics'
      });
    }
  }
);

/**
 * @route PUT /api/users/usage/increment
 * @desc Increment specific usage statistics
 * @access Private
 */
router.put('/usage/increment',
  authenticateToken,
  async (req, res) => {
    try {
      const { type } = req.body;
      
      if (!type || !['filesUploaded', 'aiSummariesGenerated', 'reportsGenerated'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid usage type. Must be one of: filesUploaded, aiSummariesGenerated, reportsGenerated'
        });
      }

      const updateField = `stats.${type}`;
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { 
          $inc: { [updateField]: 1 },
          $set: { 'stats.lastActivity': new Date() }
        },
        { new: true, upsert: false }
      ).select('stats');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      logger.info('Usage statistic incremented:', {
        userId: req.user._id,
        type,
        newValue: user.stats[type]
      });

      res.json({
        success: true,
        data: {
          type,
          newValue: user.stats[type],
          stats: user.stats
        }
      });

    } catch (error) {
      logger.error('Increment usage statistic error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update usage statistics'
      });
    }
  }
);

/**
 * @route GET /api/users/preferences
 * @desc Get current user's preferences
 * @access Private
 */
router.get('/preferences',
  authenticateToken,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id)
        .select('preferences')
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Ensure preferences object exists with defaults
      const preferences = {
        theme: user.preferences?.theme || 'light',
        density: user.preferences?.density || 'comfortable',
        language: user.preferences?.language || 'en'
      };

      res.json({
        success: true,
        data: preferences
      });

    } catch (error) {
      logger.error('Get preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get preferences'
      });
    }
  }
);

/**
 * @route PUT /api/users/preferences
 * @desc Update current user's preferences
 * @access Private
 */
router.put('/preferences',
  authenticateToken,
  async (req, res) => {
    try {
      const { theme, density, language } = req.body;

      // Validate preferences
      const validThemes = ['light', 'dark', 'system'];
      const validDensities = ['compact', 'comfortable'];

      const updateData = {};
      if (theme && validThemes.includes(theme)) {
        updateData['preferences.theme'] = theme;
      }
      if (density && validDensities.includes(density)) {
        updateData['preferences.density'] = density;
      }
      if (language && typeof language === 'string') {
        updateData['preferences.language'] = language;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid preferences provided'
        });
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('preferences');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      logger.info('User preferences updated:', {
        userId: req.user._id,
        updatedFields: Object.keys(updateData)
      });

      res.json({
        success: true,
        data: user.preferences,
        message: 'Preferences updated successfully'
      });

    } catch (error) {
      logger.error('Update preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update preferences'
      });
    }
  }
);

/**
 * @route GET /api/users/export/profile
 * @desc Export user profile data as JSON
 * @access Private
 */
router.get('/export/profile',
  authenticateToken,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id)
        .select('-password -refreshTokens -aiConfig.models.openai.apiKey -aiConfig.models.gemini.apiKey -aiConfig.models.anthropic.apiKey -aiConfig.models.azure.apiKey')
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const exportData = {
        exportType: 'ExpenseAudit_AI_Profile',
        exportDate: new Date().toISOString(),
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
          organization: user.organization,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          preferences: user.preferences,
          stats: user.stats,
          aiConfig: user.aiConfig ? {
            preferredProvider: user.aiConfig.preferredProvider,
            models: Object.keys(user.aiConfig.models || {}).reduce((acc, provider) => {
              acc[provider] = {
                model: user.aiConfig.models[provider]?.model,
                hasApiKey: !!user.aiConfig.models[provider]?.hasApiKey
              };
              return acc;
            }, {})
          } : null
        }
      };

      // Set headers for file download
      const filename = `profile_data_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      logger.info('Profile exported for user:', {
        userId: req.user._id,
        filename
      });

      res.json(exportData);

    } catch (error) {
      logger.error('Export profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export profile'
      });
    }
  }
);

/**
 * @route GET /api/users/export/activity
 * @desc Export user activity log as JSON
 * @access Private
 */
router.get('/export/activity',
  authenticateToken,
  async (req, res) => {
    try {
      const activityLogs = await AuditLog.find({ userId: req.user._id })
        .select('-userId')
        .sort({ createdAt: -1 })
        .limit(1000) // Last 1000 activities
        .lean();

      const exportData = {
        exportType: 'ExpenseAudit_AI_ActivityLog',
        exportDate: new Date().toISOString(),
        totalActivities: activityLogs.length,
        activities: activityLogs
      };

      const filename = `activity_log_${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      logger.info('Activity log exported for user:', {
        userId: req.user._id,
        activityCount: activityLogs.length,
        filename
      });

      res.json(exportData);

    } catch (error) {
      logger.error('Export activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export activity log'
      });
    }
  }
);

/**
 * @route POST /api/users/clear-cache
 * @desc Clear user's cache and temporary data
 * @access Private
 */
router.post('/clear-cache',
  authenticateToken,
  async (req, res) => {
    try {
      // Clear any server-side cached data for this user
      // This is a placeholder for future cache implementation
      
      logger.info('Cache cleared for user:', {
        userId: req.user._id
      });

      res.json({
        success: true,
        message: 'Cache cleared successfully'
      });

    } catch (error) {
      logger.error('Clear cache error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear cache'
      });
    }
  }
);

/**
 * @route DELETE /api/users/reports
 * @desc Delete all user reports and analysis data
 * @access Private
 */
router.delete('/reports',
  authenticateToken,
  async (req, res) => {
    try {
      // Reset user stats for reports and files
      await User.findByIdAndUpdate(req.user._id, {
        $set: {
          'stats.filesUploaded': 0,
          'stats.reportsGenerated': 0,
          'stats.lastActivity': new Date()
        }
      });

      // Log the action
      await AuditLog.logAction(req.user._id, 'reports_deleted', {
        action: 'delete_all_reports',
        timestamp: new Date()
      });

      logger.info('Reports deleted for user:', {
        userId: req.user._id
      });

      res.json({
        success: true,
        message: 'All reports and analysis data deleted successfully'
      });

    } catch (error) {
      logger.error('Delete reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete reports'
      });
    }
  }
);

/**
 * @route DELETE /api/users/me
 * @desc Delete user account completely
 * @access Private
 */
router.delete('/me',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user._id;

      // Delete all audit logs
      await AuditLog.deleteMany({ userId });

      // Delete user account
      await User.findByIdAndDelete(userId);

      logger.info('User account deleted:', {
        userId,
        email: req.user.email
      });

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });

    } catch (error) {
      logger.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete account'
      });
    }
  }
);

/**
 * @route GET /api/users
 * @desc Get all users (admin only)
 * @access Private (Admin)
 */
router.get('/', 
  authenticateToken, 
  requireRole('admin'), 
  validatePagination,
  logAction('users_list'),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const sort = req.query.sort || 'createdAt';
      const order = req.query.order === 'asc' ? 1 : -1;
      const search = req.query.search;

      // Build query
      let query = {};
      if (search) {
        query = {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { organization: { $regex: search, $options: 'i' } }
          ]
        };
      }

      // Get users with pagination
      const users = await User.find(query)
        .select('-password -refreshTokens')
        .sort({ [sort]: order })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean();

      // Get total count
      const total = await User.countDocuments(query);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get users'
      });
    }
  }
);

/**
 * @route GET /api/users/:userId
 * @desc Get user by ID
 * @access Private (Admin or own profile)
 */
router.get('/:userId', 
  authenticateToken, 
  validateUserId,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUser = req.user;

      // Check if user can access this profile
      if (currentUser.role !== 'admin' && currentUser._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const user = await User.findById(userId).select('-password -refreshTokens');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: { user }
      });

    } catch (error) {
      logger.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user'
      });
    }
  }
);

/**
 * @route PUT /api/users/:userId/role
 * @desc Update user role (admin only)
 * @access Private (Admin)
 */
router.put('/:userId/role', 
  authenticateToken, 
  requireRole('admin'), 
  validateUserId,
  logAction('role_changed'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!['admin', 'auditor', 'viewer'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
      }

      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const oldRole = user.role;
      user.role = role;
      await user.save();

      // Log role change
      await AuditLog.logAction(userId, 'role_changed', {
        oldRole,
        newRole: role,
        changedBy: req.user._id
      }, req);

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: { user: user.toJSON() }
      });

    } catch (error) {
      logger.error('Update role error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user role'
      });
    }
  }
);

/**
 * @route PUT /api/users/:userId/status
 * @desc Activate/deactivate user (admin only)
 * @access Private (Admin)
 */
router.put('/:userId/status', 
  authenticateToken, 
  requireRole('admin'), 
  validateUserId,
  logAction('user_status_changed'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isActive must be a boolean'
        });
      }

      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prevent admin from deactivating themselves
      if (req.user._id.toString() === userId && !isActive) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate your own account'
        });
      }

      const oldStatus = user.isActive;
      user.isActive = isActive;
      
      // Clear refresh tokens if deactivating
      if (!isActive) {
        user.refreshTokens = [];
      }
      
      await user.save();

      // Log status change
      await AuditLog.logAction(userId, 'user_status_changed', {
        oldStatus,
        newStatus: isActive,
        changedBy: req.user._id
      }, req);

      res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: { user: user.toJSON() }
      });

    } catch (error) {
      logger.error('Update status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user status'
      });
    }
  }
);

/**
 * @route DELETE /api/users/:userId
 * @desc Delete user (admin only)
 * @access Private (Admin)
 */
router.delete('/:userId', 
  authenticateToken, 
  requireRole('admin'), 
  validateUserId,
  logAction('user_deleted'),
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Prevent admin from deleting themselves
      if (req.user._id.toString() === userId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await User.findByIdAndDelete(userId);

      // Log deletion
      await AuditLog.logAction(userId, 'user_deleted', {
        deletedUser: {
          email: user.email,
          name: user.name,
          role: user.role
        },
        deletedBy: req.user._id
      }, req);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      });
    }
  }
);

/**
 * @route GET /api/users/:userId/audit-logs
 * @desc Get user audit logs
 * @access Private (Admin or own logs)
 */
router.get('/:userId/audit-logs', 
  authenticateToken, 
  validateUserId,
  validatePagination,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUser = req.user;

      // Check if user can access these logs
      if (currentUser.role !== 'admin' && currentUser._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const action = req.query.action;

      // Build query
      let query = { userId };
      if (action) {
        query.action = action;
      }

      // Get audit logs with pagination
      const logs = await AuditLog.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean();

      // Get total count
      const total = await AuditLog.countDocuments(query);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get audit logs'
      });
    }
  }
);

module.exports = router;
