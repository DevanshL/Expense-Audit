const { verifyAccessToken } = require('../utils/auth');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      await AuditLog.logFailedAction(
        decoded.userId,
        'token_validation',
        'User not found or inactive',
        { token: token.substring(0, 10) + '...' },
        req
      );
      
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    // Check if user account is locked
    if (user.isLocked) {
      await AuditLog.logFailedAction(
        user._id,
        'token_validation',
        'Account locked',
        {},
        req
      );
      
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked'
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id.toString();
    
    next();
  } catch (error) {
    logger.error('Token authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Middleware to check user roles
 * @param {String|Array} roles - Required role(s)
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      AuditLog.logFailedAction(
        req.user._id,
        'authorization_check',
        'Insufficient permissions',
        { requiredRoles: allowedRoles, userRole },
        req
      );

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Middleware to check specific permissions
 * @param {String} permission - Required permission
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const permissions = {
      admin: ['read', 'write', 'delete', 'manage_users', 'export'],
      auditor: ['read', 'write', 'export'],
      viewer: ['read']
    };

    const userPermissions = permissions[req.user.role] || [];

    if (!userPermissions.includes(permission)) {
      AuditLog.logFailedAction(
        req.user._id,
        'permission_check',
        'Permission denied',
        { requiredPermission: permission, userRole: req.user.role },
        req
      );

      return res.status(403).json({
        success: false,
        message: `Permission denied: ${permission} required`
      });
    }

    next();
  };
};

/**
 * Middleware to validate user owns resource or is admin
 * @param {String} userIdField - Field name containing user ID (default: 'userId')
 */
const requireOwnershipOrAdmin = (userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    const currentUserId = req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && resourceUserId !== currentUserId) {
      AuditLog.logFailedAction(
        req.user._id,
        'ownership_check',
        'Access denied to resource',
        { resourceUserId, currentUserId },
        req
      );

      return res.status(403).json({
        success: false,
        message: 'Access denied - insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Middleware to log user actions
 * @param {String} action - Action name
 */
const logAction = (action) => {
  return (req, res, next) => {
    // Store original send function
    const originalSend = res.send;
    
    // Override send function to log after response
    res.send = function(data) {
      // Call original send
      originalSend.call(this, data);
      
      // Log action if user is authenticated
      if (req.user) {
        const success = res.statusCode < 400;
        const details = {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          body: req.body ? Object.keys(req.body) : undefined,
          params: req.params,
          query: req.query
        };

        if (success) {
          AuditLog.logAction(req.user._id, action, details, req);
        } else {
          AuditLog.logFailedAction(
            req.user._id, 
            action, 
            `HTTP ${res.statusCode}`, 
            details, 
            req
          );
        }
      }
    };

    next();
  };
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive && !user.isLocked) {
        req.user = user;
        req.userId = user._id.toString();
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('Optional auth failed:', error.message);
  }
  
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission,
  requireOwnershipOrAdmin,
  logAction,
  optionalAuth
};
