import NodeCache from 'node-cache';

// Default TTL: 1 hour (in seconds)
const DEFAULT_TTL = 60 * 60;

class CacheService {
    private cache: NodeCache;
    
    constructor(ttlSeconds: number = DEFAULT_TTL) {
        this.cache = new NodeCache({
            stdTTL: ttlSeconds,
            checkperiod: ttlSeconds * 0.2, // Check for expired items every 20% of TTL
            useClones: false // Better performance as we don't need to clone objects
        });
    }

    /**
     * Get a value from cache
     */
    public get<T>(key: string): T | undefined {
        return this.cache.get<T>(key);
    }

    /**
     * Set a value in cache
     */
    public set<T>(key: string, value: T, ttl: number = DEFAULT_TTL): boolean {
        return this.cache.set(key, value, ttl);
    }

    /**
     * Delete a value from cache
     */
    public del(keys: string | string[]): number {
        return this.cache.del(keys);
    }

    /**
     * Clear all cache
     */
    public flush(): void {
        this.cache.flushAll();
    }

    /**
     * Generate a cache key for certificate verification
     */
    public generateVerificationKey(certificateNumber: string): string {
        return `cert:verify:${certificateNumber}`;
    }

    /**
     * Generate a cache key for certificate data
     */
    public generateCertificateKey(certificateId: string): string {
        return `cert:data:${certificateId}`;
    }

    /**
     * Generate a cache key for event certificates
     */
    public generateEventCertificatesKey(eventId: string, page: number, limit: number): string {
        return `event:${eventId}:certs:${page}:${limit}`;
    }
}

// Export a singleton instance
export const cacheService = new CacheService();
