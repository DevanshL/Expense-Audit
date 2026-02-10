const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload
 * @returns {String} JWT token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'expenseaudit-ai',
    audience: 'expenseaudit-ai-users'
  });
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - Token payload
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer: 'expenseaudit-ai',
    audience: 'expenseaudit-ai-users'
  });
};

/**
 * Verify JWT access token
 * @param {String} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'expenseaudit-ai',
    audience: 'expenseaudit-ai-users'
  });
};

/**
 * Verify JWT refresh token
 * @param {String} token - JWT refresh token
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
    issuer: 'expenseaudit-ai',
    audience: 'expenseaudit-ai-users'
  });
};

/**
 * Generate secure random token
 * @param {Number} length - Token length (default: 32)
 * @returns {String} Random token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Encrypt sensitive data
 * @param {String} text - Text to encrypt
 * @param {String} key - Encryption key (optional, uses default)
 * @returns {String} Encrypted text
 */
const encrypt = (text, key = null) => {
  const algorithm = 'aes-256-cbc';
  const secretKey = crypto.createHash('sha256').update(key || process.env.JWT_SECRET).digest();
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt sensitive data
 * @param {String} encryptedText - Encrypted text
 * @param {String} key - Decryption key (optional, uses default)
 * @returns {String} Decrypted text
 */
const decrypt = (encryptedText, key = null) => {
  try {
    const algorithm = 'aes-256-cbc';
    const secretKey = crypto.createHash('sha256').update(key || process.env.JWT_SECRET).digest();
    
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash API key for storage
 * @param {String} apiKey - API key to hash
 * @returns {String} Hashed API key
 */
const hashApiKey = (apiKey) => {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
};

/**
 * Validate password strength
 * @param {String} password - Password to validate
 * @returns {Object} Validation result
 */
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasNonalphas = /\W/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  
  if (!hasNonalphas) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: errors.length === 0 ? 'strong' : 
             errors.length <= 2 ? 'medium' : 'weak'
  };
};

/**
 * Sanitize user input
 * @param {String} input - Input to sanitize
 * @returns {String} Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Generate CSRF token
 * @returns {String} CSRF token
 */
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Rate limiting key generator
 * @param {Object} req - Express request object
 * @returns {String} Rate limiting key
 */
const getRateLimitKey = (req) => {
  return req.ip || req.connection.remoteAddress || 'unknown';
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateSecureToken,
  encrypt,
  decrypt,
  hashApiKey,
  validatePasswordStrength,
  sanitizeInput,
  generateCSRFToken,
  getRateLimitKey
};
