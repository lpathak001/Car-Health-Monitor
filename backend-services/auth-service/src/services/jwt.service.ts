import jwt, { SignOptions } from 'jsonwebtoken';
import { TokenPayload, JWTValidationResult } from '../types';
import { logger } from '../utils/logger';

export class JWTService {
  private secret: string;
  private expiresIn: string;
  private issuer: string;
  private audience: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '15m';
    this.issuer = 'car-health-monitor-auth';
    this.audience = 'car-health-monitor-services';
  }

  generateToken(payload: Omit<TokenPayload, 'iat' | 'exp' | 'iss' | 'aud'>): string {
    try {
      return jwt.sign(payload, this.secret, {
        algorithm: 'HS256',
        expiresIn: this.expiresIn,
        issuer: this.issuer,
        audience: this.audience
      } as SignOptions);
    } catch (error) {
      logger.error('Failed to generate JWT token', { error: (error as Error).message });
      throw new Error('Token generation failed');
    }
  }

  validateToken(token: string): JWTValidationResult {
    try {
      const payload = jwt.verify(token, this.secret, {
        algorithms: ['HS256'],
        issuer: this.issuer,
        audience: this.audience,
        clockTolerance: 30 // 30 seconds clock skew tolerance
      }) as TokenPayload;

      return { valid: true, payload };
    } catch (error) {
      const errorMessage = (error as Error).message;
      logger.debug('JWT validation failed', { error: errorMessage });
      
      return {
        valid: false,
        error: errorMessage
      };
    }
  }

  decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Failed to decode JWT token', { error: (error as Error).message });
      return null;
    }
  }

  getTokenExpiry(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      logger.error('Failed to get token expiry', { error: (error as Error).message });
      return null;
    }
  }
}

export const jwtService = new JWTService();