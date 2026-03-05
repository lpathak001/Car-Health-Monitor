import { LoginRequest, RegisterRequest, AuthResponse } from '../types';
export declare class AuthService {
    private bcryptRounds;
    constructor();
    register(data: RegisterRequest): Promise<AuthResponse>;
    login(data: LoginRequest, ipAddress: string, userAgent: string): Promise<AuthResponse>;
    refreshToken(refreshTokenValue: string): Promise<AuthResponse>;
    logout(userId: string, refreshTokenValue?: string): Promise<void>;
    private createRefreshToken;
    private logAuthEvent;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map