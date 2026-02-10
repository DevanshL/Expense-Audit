const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'failed_login',
      'password_change',
      'profile_update',
      'ai_config_update',
      'data_upload',
      'analysis_run',
      'report_export',
      'user_created',
      'user_deleted',
      'role_changed',
      'ai_config_updated',
      'ai_summary_generated'
    ]
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  sessionId: {
    type: String,
    trim: true
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for performance
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

// TTL index to automatically delete logs after 1 year
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Static method to log user action
auditLogSchema.statics.logAction = async function(userId, action, details = {}, req = null) {
  const logData = {
    userId,
    action,
    details
  };
  
  if (req) {
    logData.ipAddress = req.ip || req.connection.remoteAddress;
    logData.userAgent = req.get('User-Agent');
    logData.sessionId = req.sessionID;
  }
  
  try {
    await this.create(logData);
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

// Static method to log failed action
auditLogSchema.statics.logFailedAction = async function(userId, action, errorMessage, details = {}, req = null) {
  const logData = {
    userId,
    action,
    details,
    success: false,
    errorMessage
  };
  
  if (req) {
    logData.ipAddress = req.ip || req.connection.remoteAddress;
    logData.userAgent = req.get('User-Agent');
    logData.sessionId = req.sessionID;
  }
  
  try {
    await this.create(logData);
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
