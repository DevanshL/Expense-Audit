const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password not required for Google OAuth users
    },
    minlength: 8
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  role: {
    type: String,
    enum: ['admin', 'auditor', 'viewer'],
    default: 'auditor'
  },
  organization: {
    type: String,
    trim: true,
    maxlength: 200
  },
  // Google OAuth fields
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values but unique non-null values
  },
  avatar: {
    type: String,
    trim: true
  },
  // AI Configuration
  aiConfig: {
    preferredProvider: {
      type: String,
      enum: ['openai', 'gemini', 'anthropic', 'azure'],
      default: 'openai'
    },
    models: {
      openai: {
        model: {
          type: String,
          default: process.env.DEFAULT_OPENAI_MODEL || 'gpt-4o-mini'
        },
        apiKey: {
          type: String,
          select: false // Exclude from queries by default for security
        }
      },
      gemini: {
        model: {
          type: String,
          default: process.env.DEFAULT_GEMINI_MODEL || 'gemini-2.0-flash'
        },
        apiKey: {
          type: String,
          select: false
        }
      },
      anthropic: {
        model: {
          type: String,
          default: process.env.DEFAULT_ANTHROPIC_MODEL || 'claude-4-opus'
        },
        apiKey: {
          type: String,
          select: false
        }
      },
      azure: {
        model: {
          type: String,
          default: 'gpt-4o'
        },
        apiKey: {
          type: String,
          select: false
        },
        endpoint: {
          type: String,
          select: false
        },
        deploymentName: {
          type: String,
          select: false
        }
      }
    }
  },
  // Account management
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  refreshTokens: [{
    token: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: '30d'
    }
  }],
  // Usage statistics
  stats: {
    filesUploaded: {
      type: Number,
      default: 0
    },
    aiSummariesGenerated: {
      type: Number,
      default: 0
    },
    reportsGenerated: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  // UI Preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'light'
    },
    density: {
      type: String,
      enum: ['compact', 'comfortable'],
      default: 'comfortable'
    },
    language: {
      type: String,
      default: 'en'
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.refreshTokens;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      return ret;
    }
  }
});

// Indexes for performance
userSchema.index({ passwordResetToken: 1 }, { sparse: true });
userSchema.index({ emailVerificationToken: 1 }, { sparse: true });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, rounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to handle failed login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  return this.updateOne({ 
    lastLogin: new Date(),
    'stats.lastActivity': new Date()
  });
};

// Instance methods for updating statistics
userSchema.methods.incrementFileUploads = function() {
  return this.updateOne({ 
    $inc: { 'stats.filesUploaded': 1 },
    $set: { 'stats.lastActivity': new Date() }
  });
};

userSchema.methods.incrementAISummaries = function() {
  return this.updateOne({ 
    $inc: { 'stats.aiSummariesGenerated': 1 },
    $set: { 'stats.lastActivity': new Date() }
  });
};

userSchema.methods.incrementReports = function() {
  return this.updateOne({ 
    $inc: { 'stats.reportsGenerated': 1 },
    $set: { 'stats.lastActivity': new Date() }
  });
};

userSchema.methods.updatePreferences = function(preferences) {
  return this.updateOne({ 
    $set: { 
      preferences: { ...this.preferences, ...preferences },
      'stats.lastActivity': new Date()
    }
  });
};

// Static method to find by credentials
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ 
    email,
    isActive: true 
  }).select('+password');
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  if (user.isLocked) {
    throw new Error('Account temporarily locked due to too many failed login attempts');
  }
  
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    await user.incLoginAttempts();
    throw new Error('Invalid credentials');
  }
  
  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }
  
  await user.updateLastLogin();
  return user;
};

// Static method to get user with AI config
userSchema.statics.findWithAIConfig = async function(userId) {
  return this.findById(userId).select('+aiConfig.models.openai.apiKey +aiConfig.models.gemini.apiKey +aiConfig.models.anthropic.apiKey +aiConfig.models.azure.apiKey +aiConfig.models.azure.endpoint +aiConfig.models.azure.deploymentName');
};

module.exports = mongoose.model('User', userSchema);
