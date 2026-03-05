import { RedisClientType } from 'redis';
declare class RedisManager {
    private client;
    private isConnected;
    constructor();
    private setupEventHandlers;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getClient(): RedisClientType;
    isHealthy(): boolean;
    ping(): Promise<boolean>;
}
export declare const redisManager: RedisManager;
export default redisManager;
//# sourceMappingURL=redis.d.ts.map