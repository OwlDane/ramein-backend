"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const DEFAULT_TTL = 60 * 60;
class CacheService {
    constructor(ttlSeconds = DEFAULT_TTL) {
        this.cache = new node_cache_1.default({
            stdTTL: ttlSeconds,
            checkperiod: ttlSeconds * 0.2,
            useClones: false
        });
    }
    get(key) {
        return this.cache.get(key);
    }
    set(key, value, ttl = DEFAULT_TTL) {
        return this.cache.set(key, value, ttl);
    }
    del(keys) {
        return this.cache.del(keys);
    }
    flush() {
        this.cache.flushAll();
    }
    generateVerificationKey(certificateNumber) {
        return `cert:verify:${certificateNumber}`;
    }
    generateCertificateKey(certificateId) {
        return `cert:data:${certificateId}`;
    }
    generateEventCertificatesKey(eventId, page, limit) {
        return `event:${eventId}:certs:${page}:${limit}`;
    }
}
exports.cacheService = new CacheService();
//# sourceMappingURL=cacheService.js.map