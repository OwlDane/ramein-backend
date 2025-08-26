"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitRules = exports.RateLimitService = void 0;
const ioredis_1 = require("ioredis");
class RateLimitService {
    constructor(redisUrl) {
        this.defaultConfig = {
            windowMs: 15 * 60 * 1000,
            maxRequests: 100,
            message: 'Too many requests, please try again later.',
            statusCode: 429
        };
        this.memoryStore = {};
        if (redisUrl) {
            this.redis = new ioredis_1.Redis(redisUrl);
        }
        else {
            this.redis = null;
        }
    }
    createRateLimitMiddleware(rules) {
        return async (req, res, next) => {
            try {
                for (const rule of rules) {
                    const key = this.generateKey(rule.key, req);
                    const config = { ...this.defaultConfig, ...rule.config };
                    const isAllowed = await this.checkRateLimit(key, config);
                    if (!isAllowed) {
                        return res.status(config.statusCode).json({
                            error: config.message,
                            retryAfter: Math.ceil(config.windowMs / 1000)
                        });
                    }
                }
                next();
            }
            catch (error) {
                console.error('Rate limiting error:', error);
                next();
            }
        };
    }
    async checkRateLimit(key, config) {
        if (!this.redis) {
            return this.checkInMemoryRateLimit(key, config);
        }
        try {
            const current = await this.redis.get(key);
            const currentCount = current ? parseInt(current) : 0;
            if (currentCount >= config.maxRequests) {
                return false;
            }
            await this.redis.multi()
                .incr(key)
                .expire(key, Math.ceil(config.windowMs / 1000))
                .exec();
            return true;
        }
        catch (error) {
            console.error('Redis rate limit error:', error);
            return this.checkInMemoryRateLimit(key, config);
        }
    }
    checkInMemoryRateLimit(key, config) {
        const now = Date.now();
        const windowStart = now - config.windowMs;
        if (!this.memoryStore[key]) {
            this.memoryStore[key] = [];
        }
        this.memoryStore[key] = this.memoryStore[key].filter(timestamp => timestamp > windowStart);
        if (this.memoryStore[key].length >= config.maxRequests) {
            return false;
        }
        this.memoryStore[key].push(now);
        return true;
    }
    generateKey(ruleType, req) {
        var _a, _b, _c;
        switch (ruleType) {
            case 'ip':
                return `rate_limit:ip:${req.ip}`;
            case 'user':
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                return userId ? `rate_limit:user:${userId}` : `rate_limit:ip:${req.ip}`;
            case 'email':
                const email = ((_b = req.body) === null || _b === void 0 ? void 0 : _b.email) || ((_c = req.query) === null || _c === void 0 ? void 0 : _c.email);
                return email ? `rate_limit:email:${email}` : `rate_limit:ip:${req.ip}`;
            case 'endpoint':
                return `rate_limit:endpoint:${req.method}:${req.path}`;
            default:
                return `rate_limit:${ruleType}:${req.ip}`;
        }
    }
    async resetRateLimit(key) {
        if (this.redis) {
            await this.redis.del(key);
        }
        else {
            delete this.memoryStore[key];
        }
    }
    async getRateLimitStatus(key) {
        if (this.redis) {
            const current = await this.redis.get(key);
            const ttl = await this.redis.ttl(key);
            const currentCount = current ? parseInt(current) : 0;
            return {
                current: currentCount,
                limit: this.defaultConfig.maxRequests,
                resetTime: Date.now() + (ttl * 1000),
                remaining: Math.max(0, this.defaultConfig.maxRequests - currentCount)
            };
        }
        else {
            const now = Date.now();
            const windowStart = now - this.defaultConfig.windowMs;
            if (!this.memoryStore[key]) {
                this.memoryStore[key] = [];
            }
            this.memoryStore[key] = this.memoryStore[key].filter(timestamp => timestamp > windowStart);
            const currentCount = this.memoryStore[key].length;
            return {
                current: currentCount,
                limit: this.defaultConfig.maxRequests,
                resetTime: now + this.defaultConfig.windowMs,
                remaining: Math.max(0, this.defaultConfig.maxRequests - currentCount)
            };
        }
    }
    cleanupMemoryStore() {
        const now = Date.now();
        for (const key in this.memoryStore) {
            this.memoryStore[key] = this.memoryStore[key].filter(timestamp => now - timestamp < this.defaultConfig.windowMs);
            if (this.memoryStore[key].length === 0) {
                delete this.memoryStore[key];
            }
        }
    }
    startCleanupInterval(intervalMs = 60000) {
        setInterval(() => {
            this.cleanupMemoryStore();
        }, intervalMs);
    }
}
exports.RateLimitService = RateLimitService;
exports.RateLimitRules = {
    general: {
        key: 'ip',
        config: {
            windowMs: 15 * 60 * 1000,
            maxRequests: 100
        }
    },
    auth: {
        key: 'ip',
        config: {
            windowMs: 15 * 60 * 1000,
            maxRequests: 5
        }
    },
    emailVerification: {
        key: 'email',
        config: {
            windowMs: 5 * 60 * 1000,
            maxRequests: 3
        }
    },
    passwordReset: {
        key: 'email',
        config: {
            windowMs: 15 * 60 * 1000,
            maxRequests: 3
        }
    },
    eventRegistration: {
        key: 'user',
        config: {
            windowMs: 60 * 1000,
            maxRequests: 5
        }
    },
    fileUpload: {
        key: 'user',
        config: {
            windowMs: 60 * 1000,
            maxRequests: 10
        }
    }
};
//# sourceMappingURL=rateLimitService.js.map