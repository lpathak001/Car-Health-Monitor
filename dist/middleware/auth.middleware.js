"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticateToken = void 0;
const jwt_service_1 = require("../services/jwt.service");
const cache_service_1 = require("../services/cache.service");
const logger_1 = require("../utils/logger");
const authenticateToken = async (req, res, next) => {
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
        const tokenId = jwt_service_1.jwtService.decodeToken(token)?.jti;
        if (tokenId && await cache_service_1.cacheService.isTokenBlacklisted(tokenId)) {
            return res.status(401).json({
                error: 'token_blacklisted',
                message: 'Token has been revoked'
            });
        }
        // Validate token
        const validation = jwt_service_1.jwtService.validateToken(token);
        if (!validation.valid) {
            return res.status(401).json({
                error: 'invalid_token',
                message: 'Invalid or expired token'
            });
        }
        // Add user context to request
        req.user = validation.payload;
        next();
    }
    catch (error) {
        logger_1.logger.error('Authentication middleware error', { error: error.message });
        return res.status(500).json({
            error: 'authentication_error',
            message: 'Internal authentication error'
        });
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const validation = jwt_service_1.jwtService.validateToken(token);
            if (validation.valid) {
                req.user = validation.payload;
            }
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Optional auth middleware error', { error: error.message });
        next(); // Continue without authentication
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.middleware.js.map