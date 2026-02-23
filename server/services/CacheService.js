const Redis = require('ioredis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isEnabled = false;

    if (process.env.REDIS_URL) {
      logger.warn('Redis init disabled locally to prevent crash loop.');
      this.isEnabled = false;
    } else {
      logger.warn('REDIS_URL not provided. Caching is disabled.');
    }
  }

  async get(key) {
    if (!this.isEnabled) return null;
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Error getting key ${key} from cache:`, error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    if (!this.isEnabled) return false;
    try {
      await this.client.set(
        key,
        JSON.stringify(value),
        'EX',
        ttlSeconds
      );
      return true;
    } catch (error) {
      logger.error(`Error setting key ${key} in cache:`, error);
      return false;
    }
  }

  async del(key) {
    if (!this.isEnabled) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Error deleting key ${key} from cache:`, error);
      return false;
    }
  }

  generateKey(prefix, identifier) {
    return `${prefix}:${identifier}`;
  }
}

module.exports = new CacheService();
