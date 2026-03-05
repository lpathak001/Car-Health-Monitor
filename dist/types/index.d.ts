export interface User {
    id: string;
    email: string;
    password_hash: string;
    name: string;
    phone?: string;
    status: 'active' | 'inactive' | 'locked';
    email_verified: boolean;
    failed_login_attempts: number;
    last_login_at?: Date;
    created_at: Date;
    updated_at: Date;
}
export interface UserProfile {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    date_of_birth?: Date;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
    preferences: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}
export interface RefreshToken {
    id: string;
    user_id: string;
    token_hash: string;
    expires_at: Date;
    revoked_at?: Date;
    created_at: Date;
}
export interface AuthenticationLog {
    id: string;
    user_id?: string;
    email: string;
    event_type: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'token_refresh' | 'password_change';
    success: boolean;
    ip_address: string;
    user_agent: string;
    failure_reason?: string;
    created_at: Date;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    phone?: string;
}
export interface AuthResponse {
    user: {
        id: string;
        email: string;
        name: string;
        email_verified: boolean;
    };
    access_token: string;
    refresh_token: string;
    expires_in: number;
}
export interface TokenPayload {
    sub: string;
    email: string;
    name: string;
    iat: number;
    exp: number;
    iss: string;
    aud: string;
}
export interface JWTValidationResult {
    valid: boolean;
    payload?: TokenPayload;
    error?: string;
}
export interface SecurityEvent {
    type: 'login_failure' | 'account_lockout' | 'suspicious_activity' | 'token_abuse' | 'brute_force';
    userId?: string;
    email: string;
    ipAddress: string;
    userAgent: string;
    details: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
}
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
            rateLimitInfo?: {
                limit: number;
                current: number;
                remaining: number;
                resetTime: Date;
            };
        }
    }
}
//# sourceMappingURL=index.d.ts.map