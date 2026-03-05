"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtService = exports.JWTService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
class JWTService {
    constructor() {
        this.secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
        this.expiresIn = process.env.JWT_EXPIRES_IN || '15m';
        this.issuer = 'car-health-monitor-auth';
        this.audience = 'car-health-monitor-services';
    }
    generateToken(payload) {
        try {
            return jsonwebtoken_1.default.sign(payload, this.secret, {
                algorithm: 'HS256',
                expiresIn: this.expiresIn,
                issuer: this.issuer,
                audience: this.audience
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to generate JWT token', { error: error.message });
            throw new Error('Token generation failed');
        }
    }
    validateToken(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, this.secret, {
                algorithms: ['HS256'],
                issuer: this.issuer,
                audience: this.audience,
                clockTolerance: 30 // 30 seconds clock skew tolerance
            });
            return { valid: true, payload };
        }
        catch (error) {
            const errorMessage = error.message;
            logger_1.logger.debug('JWT validation failed', { error: errorMessage });
            return {
                valid: false,
                error: errorMessage
            };
        }
    }
    decodeToken(token) {
        try {
            return jsonwebtoken_1.default.decode(token);
        }
        catch (error) {
            logger_1.logger.error('Failed to decode JWT token', { error: error.message });
            return null;
        }
    }
    getTokenExpiry(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (decoded && decoded.exp) {
                return new Date(decoded.exp * 1000);
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get token expiry', { error: error.message });
            return null;
        }
    }
}
exports.JWTService = JWTService;
exports.jwtService = new JWTService();
//# sourceMappingURL=jwt.service.js.map