const cacheService = require('../services/CacheService');
const logger = require('../utils/logger');

// Mock Redis if it's not and we are in test environment
// For now, let's just test the service methods assuming Redis might be down or up
// The service is designed to fail gracefully if Redis is down

describe('CacheService', () => {
  it('should generate consistent keys', () => {
    const key1 = cacheService.generateKey('test', 'abc');
    const key2 = cacheService.generateKey('test', 'abc');
    expect(key1).toBe('test:abc');
    expect(key1).toBe(key2);
  });

  it('should handle get/set/del robustly even if Redis is disabled', async () => {
    // If Redis is not connected,isEnabled will be false
    // We expect these to not throw
    const key = 'test:robust';
    const val = { ok: true };
    
    await expect(cacheService.set(key, val)).resolves.not.toThrow();
    await expect(cacheService.get(key)).resolves.not.toThrow();
    await expect(cacheService.del(key)).resolves.not.toThrow();
  });
});
