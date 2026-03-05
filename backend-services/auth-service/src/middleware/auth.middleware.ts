import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../services/jwt.service';
import { cacheService } from '../services/cache.service';
import { logger } from '../utils/logger';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'authentication_required',
        message: 'Authorization header required'
      });
    }

    const token = authHeader.substring(7);
    
    // Check if token is blacklisted
    const tokenId = jwtService.decodeToken(token)?.jti;
    if (tokenId && await cacheService.isTokenBlacklisted(tokenId)) {
      return res.status(401).json({
        error: 'token_blacklisted',
        message: 'Token has been revoked'
      });
    }

    // Validate token
    const validation = jwtService.validateToken(token);

    if (!validation.valid) {
      return res.status(401).json({
        error: 'invalid_token',
        message: 'Invalid or expired token'
      });
    }

    // Add user context to request
    req.user = validation.payload;
    next();
  } catch (error) {
    logger.error('Authentication middleware error', { error: (error as Error).message });
    return res.status(500).json({
      error: 'authentication_error',
      message: 'Internal authentication error'
    });
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const validation = jwtService.validateToken(token);
      
      if (validation.valid) {
        req.user = validation.payload;
      }
    }
    
    next();
  } catch (error) {
    logger.error('Optional auth middleware error', { error: (error as Error).message });
    next(); // Continue without authentication
  }
};