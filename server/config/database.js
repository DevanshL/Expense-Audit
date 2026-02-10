const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB
 */
const connectDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expenseaudit-ai';
    
    const options = {
      // Connection options
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
      
      // Authentication options (removed for local development)
      // authSource: 'admin',
      
      // SSL options
      ssl: process.env.NODE_ENV === 'production',
      
      // Replica set options
      readPreference: 'primary',
      
      // Write concern
      w: 'majority',
      wtimeoutMS: 5000,
      journal: true
    };

    // Connect to MongoDB
    await mongoose.connect(mongoURI, options);
    
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (error) => {
      logger.error('Mongoose connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('Mongoose connection closed through app termination');
        process.exit(0);
      } catch (error) {
        logger.error('Error closing mongoose connection:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

/**
 * Close database connection
 */
const closeDatabase = async () => {
  try {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
};

/**
 * Clear database (for testing)
 */
const clearDatabase = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Database clearing is only allowed in test environment');
  }
  
  try {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
    
    logger.info('Database cleared');
  } catch (error) {
    logger.error('Error clearing database:', error);
    throw error;
  }
};

/**
 * Create database indexes
 */
const createIndexes = async () => {
  try {
    // User indexes are defined in the model
    // Additional composite indexes can be created here
    
    const User = require('../models/User');
    const AuditLog = require('../models/AuditLog');
    
    // Ensure indexes are created
    await User.ensureIndexes();
    await AuditLog.ensureIndexes();
    
    logger.info('Database indexes created');
  } catch (error) {
    logger.error('Error creating database indexes:', error);
    throw error;
  }
};

/**
 * Database health check
 */
const healthCheck = async () => {
  try {
    await mongoose.connection.db.admin().ping();
    return {
      status: 'healthy',
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

/**
 * Get database statistics
 */
const getStats = async () => {
  try {
    const stats = await mongoose.connection.db.stats();
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
      objects: stats.objects
    };
  } catch (error) {
    logger.error('Error getting database stats:', error);
    throw error;
  }
};

module.exports = {
  connectDatabase,
  closeDatabase,
  clearDatabase,
  createIndexes,
  healthCheck,
  getStats
};
