const express = require('express');
const { healthCheck, getStats } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route GET /api/health
 * @desc Basic health check
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const dbHealth = await healthCheck();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV,
      version: '1.0.0',
      database: dbHealth
    };

    // Determine overall status
    if (dbHealth.status !== 'healthy') {
      health.status = 'unhealthy';
      return res.status(503).json({
        success: false,
        data: health
      });
    }

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

/**
 * @route GET /api/health/detailed
 * @desc Detailed health check with system stats
 * @access Private (Admin)
 */
router.get('/detailed', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const dbHealth = await healthCheck();
    const dbStats = await getStats();
    
    const detailed = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: '1.0.0',
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      database: {
        ...dbHealth,
        stats: dbStats
      },
      requests: {
        // Add request statistics if needed
      }
    };

    // Determine overall status
    if (dbHealth.status !== 'healthy') {
      detailed.status = 'unhealthy';
      return res.status(503).json({
        success: false,
        data: detailed
      });
    }

    res.json({
      success: true,
      data: detailed
    });

  } catch (error) {
    logger.error('Detailed health check error:', error);
    res.status(503).json({
      success: false,
      message: 'Detailed health check failed',
      error: error.message
    });
  }
});

/**
 * @route GET /api/health/database
 * @desc Database-specific health check
 * @access Private (Admin)
 */
router.get('/database', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const dbHealth = await healthCheck();
    const dbStats = await getStats();
    
    const databaseHealth = {
      ...dbHealth,
      stats: dbStats,
      timestamp: new Date().toISOString()
    };

    if (dbHealth.status !== 'healthy') {
      return res.status(503).json({
        success: false,
        data: databaseHealth
      });
    }

    res.json({
      success: true,
      data: databaseHealth
    });

  } catch (error) {
    logger.error('Database health check error:', error);
    res.status(503).json({
      success: false,
      message: 'Database health check failed',
      error: error.message
    });
  }
});

/**
 * @route GET /api/health/readiness
 * @desc Kubernetes readiness probe
 * @access Public
 */
router.get('/readiness', async (req, res) => {
  try {
    // Check if the application is ready to serve requests
    const dbHealth = await healthCheck();
    
    if (dbHealth.status === 'healthy') {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready' });
    }
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

/**
 * @route GET /api/health/liveness
 * @desc Kubernetes liveness probe
 * @access Public
 */
router.get('/liveness', (req, res) => {
  // Simple liveness check - if this endpoint responds, the app is alive
  res.status(200).json({ status: 'alive' });
});

module.exports = router;
