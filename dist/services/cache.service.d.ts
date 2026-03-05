export declare class CacheService {
    private client;
    private defaultTTL;
    constructor();
    cacheUserProfile(userId: string, profile: any): Promise<void>;
    getUserProfile(userId: string): Promise<any | null>;
    incrementRateLimit(identifier: string, windowSeconds: number): Promise<number>;
    getRateLimit(identifier: string): Promise<number>;
    blacklistToken(tokenId: string, expiresAt: Date): Promise<void>;
    isTokenBlacklisted(tokenId: string): Promise<boolean>;
    cacheSession(sessionId: string, sessionData: any, ttlSeconds: number): Promise<void>;
    getSession(sessionId: string): Promise<any | null>;
    invalidateSession(sessionId: string): Promise<void>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    get(key: string): Promise<any | null>;
    del(key: string): Promise<void>;
}
export declare const cacheService: CacheService;
//# sourceMappingURL=cache.service.d.ts.map