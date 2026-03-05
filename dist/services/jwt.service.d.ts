import { TokenPayload, JWTValidationResult } from '../types';
export declare class JWTService {
    private secret;
    private expiresIn;
    private issuer;
    private audience;
    constructor();
    generateToken(payload: Omit<TokenPayload, 'iat' | 'exp' | 'iss' | 'aud'>): string;
    validateToken(token: string): JWTValidationResult;
    decodeToken(token: string): any;
    getTokenExpiry(token: string): Date | null;
}
export declare const jwtService: JWTService;
//# sourceMappingURL=jwt.service.d.ts.map