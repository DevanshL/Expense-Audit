const { body, param, query, validationResult } = require('express-validator');
const { sanitizeInput, validatePasswordStrength } = require('../utils/auth');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

/**
 * Sanitize request body fields
 */
const sanitizeBody = (fields) => {
  return (req, res, next) => {
    fields.forEach(field => {
      if (req.body[field]) {
        req.body[field] = sanitizeInput(req.body[field]);
      }
    });
    next();
  };
};

/**
 * User registration validation
 */
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .custom((value) => {
      const validation = validatePasswordStrength(value);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('. '));
      }
      return true;
    }),
  
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-'\.]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, apostrophes, and periods'),
  
  body('organization')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Organization name cannot exceed 200 characters'),
  
  body('role')
    .optional()
    .isIn(['admin', 'auditor', 'viewer'])
    .withMessage('Role must be admin, auditor, or viewer'),
  
  sanitizeBody(['name', 'organization']),
  handleValidationErrors
];

/**
 * User login validation
 */
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * Password change validation
 */
const validatePasswordChange = [
  body('currentPassword')
    .optional()
    .custom((value, { req }) => {
      // Current password is required only if the user has an existing password
      // For Google OAuth users without a password, this field should be empty
      if (req.isPasswordUpdate && !value) {
        throw new Error('Current password is required');
      }
      return true;
    }),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .custom((value) => {
      const validation = validatePasswordStrength(value);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('. '));
      }
      return true;
    }),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Password creation validation (for OAuth users)
 */
const validatePasswordCreation = [
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .custom((value) => {
      const validation = validatePasswordStrength(value);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('. '));
      }
      return true;
    }),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Profile update validation
 */
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-'\.]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, apostrophes, and periods'),
  
  body('organization')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Organization name cannot exceed 200 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  sanitizeBody(['name', 'organization']),
  handleValidationErrors
];

/**
 * AI configuration validation
 */
const validateAIConfig = [
  body('preferredProvider')
    .isIn(['openai', 'gemini', 'anthropic', 'azure'])
    .withMessage('Provider must be openai, gemini, anthropic, or azure'),
  
  body('model')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Model selection is required'),
  
  body('apiKey')
    .trim()
    .isLength({ min: 10 })
    .withMessage('API key must be at least 10 characters'),
  
  body('azureEndpoint')
    .optional()
    .trim()
    .custom((value, { req }) => {
      if (req.body.preferredProvider === 'azure' && !value) {
        throw new Error('Azure endpoint is required for Azure provider');
      }
      if (value && !value.match(/^https?:\/\/.+/)) {
        throw new Error('Azure endpoint must be a valid URL');
      }
      return true;
    }),
  
  body('azureDeployment')
    .optional()
    .trim()
    .custom((value, { req }) => {
      if (req.body.preferredProvider === 'azure' && !value) {
        throw new Error('Azure deployment name is required for Azure provider');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * User ID parameter validation
 */
const validateUserId = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  handleValidationErrors
];

/**
 * Pagination validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Sort field is invalid'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
  
  handleValidationErrors
];

/**
 * Email validation
 */
const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  handleValidationErrors
];

/**
 * Password reset validation
 */
const validatePasswordReset = [
  body('token')
    .notEmpty()
    .isLength({ min: 32, max: 128 })
    .withMessage('Invalid reset token'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .custom((value) => {
      const validation = validatePasswordStrength(value);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('. '));
      }
      return true;
    }),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  sanitizeBody,
  validateUserRegistration,
  validateUserLogin,
  validatePasswordChange,
  validatePasswordCreation,
  validateProfileUpdate,
  validateAIConfig,
  validateUserId,
  validatePagination,
  validateEmail,
  validatePasswordReset
};
