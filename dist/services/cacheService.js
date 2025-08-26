"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheKeys = exports.CacheService = void 0;
const ioredis_1 = require("ioredis");
class CacheService {
    constructor(config) {
        this.redis = null;
        this.memoryCache = new Map();
        this.memorySize = 0;
        this.config = {
            defaultTTL: 300,
            maxMemorySize: 100,
            enableRedis: false,
            ...config
        };
        this.initializeRedis();
        this.startCleanupInterval();
    }
    async initializeRedis() {
        if (!this.config.enableRedis || !this.config.redisUrl) {
            return;
        }
        try {
            this.redis = new ioredis_1.Redis(this.config.redisUrl, this.config.redisOptions);
            this.redis.on('error', (error) => {
                console.error('Redis connection error:', error);
                this.redis = null;
            });
            this.redis.on('connect', () => {
                console.log('Redis connected successfully');
            });
            await this.redis.ping();
        }
        catch (error) {
            console.error('Failed to connect to Redis:', error);
            this.redis = null;
        }
    }
    async set(key, value, ttl) {
        try {
            const cacheTTL = ttl || this.config.defaultTTL;
            const timestamp = Date.now();
            if (this.redis) {
                await this.redis.setex(key, cacheTTL, JSON.stringify(value));
                return true;
            }
            else {
                return this.setInMemory(key, value, cacheTTL, timestamp);
            }
        }
        catch (error) {
            console.error('Error setting cache:', error);
            return this.setInMemory(key, value, ttl || this.config.defaultTTL, Date.now());
        }
    }
    setInMemory(key, value, ttl, timestamp) {
        try {
            const item = {
                value,
                timestamp,
                ttl,
                accessCount: 0,
                lastAccessed: timestamp
            };
            const estimatedSize = this.estimateMemorySize(item);
            if (this.memorySize + estimatedSize > this.config.maxMemorySize * 1024 * 1024) {
                this.evictItems();
            }
            this.memoryCache.set(key, item);
            this.memorySize += estimatedSize;
            return true;
        }
        catch (error) {
            console.error('Error setting in-memory cache:', error);
            return false;
        }
    }
    async get(key) {
        try {
            if (this.redis) {
                const value = await this.redis.get(key);
                if (value) {
                    return JSON.parse(value);
                }
            }
            return this.getFromMemory(key);
        }
        catch (error) {
            console.error('Error getting from cache:', error);
            return this.getFromMemory(key);
        }
    }
    getFromMemory(key) {
        const item = this.memoryCache.get(key);
        if (!item) {
            return null;
        }
        if (Date.now() - item.timestamp > item.ttl * 1000) {
            this.memoryCache.delete(key);
            this.memorySize -= this.estimateMemorySize(item);
            return null;
        }
        item.accessCount++;
        item.lastAccessed = Date.now();
        return item.value;
    }
    async delete(key) {
        try {
            if (this.redis) {
                await this.redis.del(key);
            }
            const item = this.memoryCache.get(key);
            if (item) {
                this.memoryCache.delete(key);
                this.memorySize -= this.estimateMemorySize(item);
            }
            return true;
        }
        catch (error) {
            console.error('Error deleting cache:', error);
            return false;
        }
    }
    async exists(key) {
        try {
            if (this.redis) {
                return (await this.redis.exists(key)) === 1;
            }
            else {
                const item = this.memoryCache.get(key);
                if (!item)
                    return false;
                if (Date.now() - item.timestamp > item.ttl * 1000) {
                    this.memoryCache.delete(key);
                    this.memorySize -= this.estimateMemorySize(item);
                    return false;
                }
                return true;
            }
        }
        catch (error) {
            console.error('Error checking cache existence:', error);
            return false;
        }
    }
    async getStats() {
        return {
            redisConnected: this.redis !== null,
            memoryCacheSize: this.memoryCache.size,
            memoryCacheItems: this.memoryCache.size,
            memoryUsage: this.memorySize,
            config: this.config
        };
    }
    async clear() {
        try {
            if (this.redis) {
                await this.redis.flushdb();
            }
            this.memoryCache.clear();
            this.memorySize = 0;
            return true;
        }
        catch (error) {
            console.error('Error clearing cache:', error);
            return false;
        }
    }
    async mget(keys) {
        try {
            if (this.redis) {
                const values = await this.redis.mget(...keys);
                return values.map(value => value ? JSON.parse(value) : null);
            }
            else {
                return keys.map(key => this.getFromMemory(key));
            }
        }
        catch (error) {
            console.error('Error getting multiple cache items:', error);
            return keys.map(key => this.getFromMemory(key));
        }
    }
    async mset(items) {
        try {
            if (this.redis) {
                const pipeline = this.redis.pipeline();
                for (const item of items) {
                    const ttl = item.ttl || this.config.defaultTTL;
                    pipeline.setex(item.key, ttl, JSON.stringify(item.value));
                }
                await pipeline.exec();
                return true;
            }
            else {
                const timestamp = Date.now();
                for (const item of items) {
                    this.setInMemory(item.key, item.value, item.ttl || this.config.defaultTTL, timestamp);
                }
                return true;
            }
        }
        catch (error) {
            console.error('Error setting multiple cache items:', error);
            return false;
        }
    }
    async increment(key, value = 1) {
        try {
            if (this.redis) {
                return await this.redis.incrby(key, value);
            }
            else {
                const current = this.getFromMemory(key) || 0;
                const newValue = current + value;
                await this.set(key, newValue);
                return newValue;
            }
        }
        catch (error) {
            console.error('Error incrementing cache:', error);
            return 0;
        }
    }
    async decrement(key, value = 1) {
        return this.increment(key, -value);
    }
    async setex(key, ttl, value) {
        return this.set(key, value, ttl);
    }
    async getdel(key) {
        try {
            const value = await this.get(key);
            if (value !== null) {
                await this.delete(key);
            }
            return value;
        }
        catch (error) {
            console.error('Error in getdel:', error);
            return null;
        }
    }
    estimateMemorySize(item) {
        try {
            const jsonString = JSON.stringify(item.value);
            return Buffer.byteLength(jsonString, 'utf8');
        }
        catch (_a) {
            return 1024;
        }
    }
    evictItems() {
        if (this.memoryCache.size === 0)
            return;
        const items = Array.from(this.memoryCache.entries())
            .map(([key, item]) => ({ key, item }))
            .sort((a, b) => {
            if (a.item.accessCount !== b.item.accessCount) {
                return a.item.accessCount - b.item.accessCount;
            }
            return a.item.lastAccessed - b.item.lastAccessed;
        });
        for (const { key, item } of items) {
            if (this.memorySize <= this.config.maxMemorySize * 1024 * 1024 * 0.8) {
                break;
            }
            this.memoryCache.delete(key);
            this.memorySize -= this.estimateMemorySize(item);
        }
    }
    startCleanupInterval() {
        setInterval(() => {
            this.cleanupExpiredItems();
        }, 60000);
    }
    cleanupExpiredItems() {
        const now = Date.now();
        const expiredKeys = [];
        for (const [key, item] of this.memoryCache.entries()) {
            if (now - item.timestamp > item.ttl * 1000) {
                expiredKeys.push(key);
            }
        }
        for (const key of expiredKeys) {
            const item = this.memoryCache.get(key);
            if (item) {
                this.memoryCache.delete(key);
                this.memorySize -= this.estimateMemorySize(item);
            }
        }
        if (expiredKeys.length > 0) {
            console.log(`Cleaned up ${expiredKeys.length} expired cache items`);
        }
    }
    async shutdown() {
        try {
            if (this.redis) {
                await this.redis.quit();
            }
            this.memoryCache.clear();
            this.memorySize = 0;
        }
        catch (error) {
            console.error('Error during cache service shutdown:', error);
        }
    }
}
exports.CacheService = CacheService;
exports.CacheKeys = {
    EVENT: (id) => `event:${id}`,
    EVENT_LIST: (filters) => `events:list:${filters}`,
    EVENT_STATS: (date) => `events:stats:${date}`,
    USER: (id) => `user:${id}`,
    USER_PROFILE: (id) => `user:profile:${id}`,
    PARTICIPANT: (id) => `participant:${id}`,
    EVENT_PARTICIPANTS: (eventId) => `event:participants:${eventId}`,
    STATS_MONTHLY: (year) => `stats:monthly:${year}`,
    STATS_OVERALL: 'stats:overall',
    STATS_TOP_EVENTS: 'stats:top_events',
    SEARCH_RESULTS: (query) => `search:${query}`,
    FILE_URL: (id) => `file:url:${id}`,
    RATE_LIMIT: (key) => `rate_limit:${key}`,
    SESSION: (id) => `session:${id}`,
    CONFIG: (key) => `config:${key}`,
    API_RESPONSE: (endpoint, params) => `api:${endpoint}:${params}`
};
//# sourceMappingURL=cacheService.js.map