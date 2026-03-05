"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
const database_1 = require("../config/database");
const jwt_service_1 = require("./jwt.service");
const cache_service_1 = require("./cache.service");
const logger_1 = require("../utils/logger");
class AuthService {
    constructor() {
        this.bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    }
    async register(data) {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            // Check if user already exists
            const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [data.email.toLowerCase()]);
            if (existingUser.rows.length > 0) {
                throw new Error('User already exists with this email');
            }
            // Hash password
            const passwordHash = await bcrypt_1.default.hash(data.password, this.bcryptRounds);
            // Create user
            const userId = (0, uuid_1.v4)();
            const userResult = await client.query(`
        INSERT INTO users (id, email, password_hash, name, phone, status, email_verified, failed_login_attempts)
        VALUES ($1, $2, $3, $4, $5, 'active', false, 0)
        RETURNING id, email, name, email_verified, created_at
      `, [userId, data.email.toLowerCase(), passwordHash, data.name, data.phone]);
            const user = userResult.rows[0];
            // Create user profile
            await client.query(`
        INSERT INTO user_profiles (id, user_id, first_name, last_name, preferences)
        VALUES ($1, $2, $3, $4, $5)
      `, [(0, uuid_1.v4)(), userId, data.name.split(' ')[0], data.name.split(' ').slice(1).join(' '), '{}']);
            await client.query('COMMIT');
            // Generate tokens
            const accessToken = jwt_service_1.jwtService.generateToken({
                sub: user.id,
                email: user.email,
                name: user.name
            });
            const refreshToken = await this.createRefreshToken(user.id);
            // Log successful registration
            await this.logAuthEvent({
                user_id: user.id,
                email: user.email,
                event_type: 'login_success',
                success: true,
                ip_address: 'unknown',
                user_agent: 'registration'
            });
            logger_1.logger.info('User registered successfully', { userId: user.id, email: user.email });
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    email_verified: user.email_verified
                },
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_in: 900 // 15 minutes
            };
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.logger.error('Registration failed', {
                email: data.email,
                error: error.message
            });
            throw error;
        }
        finally {
            client.release();
        }
    }
    async login(data, ipAddress, userAgent) {
        try {
            // Get user
            const userResult = await database_1.pool.query(`
        SELECT id, email, password_hash, name, status, email_verified, failed_login_attempts
        FROM users 
        WHERE email = $1
      `, [data.email.toLowerCase()]);
            if (userResult.rows.length === 0) {
                await this.logAuthEvent({
                    email: data.email,
                    event_type: 'login_failure',
                    success: false,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    failure_reason: 'User not found'
                });
                throw new Error('Invalid credentials');
            }
            const user = userResult.rows[0];
            // Check if account is locked
            if (user.status === 'locked') {
                await this.logAuthEvent({
                    user_id: user.id,
                    email: user.email,
                    event_type: 'login_failure',
                    success: false,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    failure_reason: 'Account locked'
                });
                throw new Error('Account is locked. Please contact support.');
            }
            // Verify password
            const passwordValid = await bcrypt_1.default.compare(data.password, user.password_hash);
            if (!passwordValid) {
                // Increment failed login attempts
                const newFailedAttempts = user.failed_login_attempts + 1;
                const shouldLock = newFailedAttempts >= 5;
                await database_1.pool.query(`
          UPDATE users 
          SET failed_login_attempts = $1, status = $2, updated_at = NOW()
          WHERE id = $3
        `, [newFailedAttempts, shouldLock ? 'locked' : user.status, user.id]);
                await this.logAuthEvent({
                    user_id: user.id,
                    email: user.email,
                    event_type: 'login_failure',
                    success: false,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    failure_reason: 'Invalid password'
                });
                if (shouldLock) {
                    logger_1.logger.warn('Account locked due to failed login attempts', {
                        userId: user.id,
                        email: user.email
                    });
                }
                throw new Error('Invalid credentials');
            }
            // Reset failed login attempts and update last login
            await database_1.pool.query(`
        UPDATE users 
        SET failed_login_attempts = 0, last_login_at = NOW(), updated_at = NOW()
        WHERE id = $1
      `, [user.id]);
            // Generate tokens
            const accessToken = jwt_service_1.jwtService.generateToken({
                sub: user.id,
                email: user.email,
                name: user.name
            });
            const refreshToken = await this.createRefreshToken(user.id);
            // Log successful login
            await this.logAuthEvent({
                user_id: user.id,
                email: user.email,
                event_type: 'login_success',
                success: true,
                ip_address: ipAddress,
                user_agent: userAgent
            });
            logger_1.logger.info('User logged in successfully', { userId: user.id, email: user.email });
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    email_verified: user.email_verified
                },
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_in: 900 // 15 minutes
            };
        }
        catch (error) {
            logger_1.logger.error('Login failed', {
                email: data.email,
                error: error.message
            });
            throw error;
        }
    }
    async refreshToken(refreshTokenValue) {
        try {
            // Hash the refresh token to compare with stored hash
            const tokenHash = await bcrypt_1.default.hash(refreshTokenValue, 1);
            // Find valid refresh token
            const tokenResult = await database_1.pool.query(`
        SELECT rt.id, rt.user_id, rt.expires_at, u.email, u.name, u.email_verified
        FROM refresh_tokens rt
        JOIN users u ON rt.user_id = u.id
        WHERE rt.token_hash = $1 
        AND rt.expires_at > NOW() 
        AND rt.revoked_at IS NULL
        AND u.status = 'active'
      `, [tokenHash]);
            if (tokenResult.rows.length === 0) {
                throw new Error('Invalid or expired refresh token');
            }
            const tokenData = tokenResult.rows[0];
            // Generate new access token
            const accessToken = jwt_service_1.jwtService.generateToken({
                sub: tokenData.user_id,
                email: tokenData.email,
                name: tokenData.name
            });
            // Generate new refresh token and revoke old one
            const newRefreshToken = await this.createRefreshToken(tokenData.user_id);
            await database_1.pool.query(`
        UPDATE refresh_tokens 
        SET revoked_at = NOW() 
        WHERE id = $1
      `, [tokenData.id]);
            // Log token refresh
            await this.logAuthEvent({
                user_id: tokenData.user_id,
                email: tokenData.email,
                event_type: 'token_refresh',
                success: true,
                ip_address: 'unknown',
                user_agent: 'token_refresh'
            });
            logger_1.logger.info('Token refreshed successfully', { userId: tokenData.user_id });
            return {
                user: {
                    id: tokenData.user_id,
                    email: tokenData.email,
                    name: tokenData.name,
                    email_verified: tokenData.email_verified
                },
                access_token: accessToken,
                refresh_token: newRefreshToken,
                expires_in: 900 // 15 minutes
            };
        }
        catch (error) {
            logger_1.logger.error('Token refresh failed', { error: error.message });
            throw error;
        }
    }
    async logout(userId, refreshTokenValue) {
        try {
            if (refreshTokenValue) {
                const tokenHash = await bcrypt_1.default.hash(refreshTokenValue, 1);
                // Revoke refresh token
                await database_1.pool.query(`
          UPDATE refresh_tokens 
          SET revoked_at = NOW() 
          WHERE user_id = $1 AND token_hash = $2 AND revoked_at IS NULL
        `, [userId, tokenHash]);
            }
            // Clear cached user data
            await cache_service_1.cacheService.del(`user:profile:${userId}`);
            // Log logout
            const user = await database_1.pool.query('SELECT email FROM users WHERE id = $1', [userId]);
            if (user.rows.length > 0) {
                await this.logAuthEvent({
                    user_id: userId,
                    email: user.rows[0].email,
                    event_type: 'logout',
                    success: true,
                    ip_address: 'unknown',
                    user_agent: 'logout'
                });
            }
            logger_1.logger.info('User logged out successfully', { userId });
        }
        catch (error) {
            logger_1.logger.error('Logout failed', { userId, error: error.message });
            throw error;
        }
    }
    async createRefreshToken(userId) {
        const token = (0, uuid_1.v4)();
        const tokenHash = await bcrypt_1.default.hash(token, this.bcryptRounds);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
        await database_1.pool.query(`
      INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
      VALUES ($1, $2, $3, $4)
    `, [(0, uuid_1.v4)(), userId, tokenHash, expiresAt]);
        return token;
    }
    async logAuthEvent(event) {
        try {
            await database_1.pool.query(`
        INSERT INTO authentication_logs (id, user_id, email, event_type, success, ip_address, user_agent, failure_reason)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
                (0, uuid_1.v4)(),
                event.user_id || null,
                event.email,
                event.event_type,
                event.success,
                event.ip_address,
                event.user_agent,
                event.failure_reason || null
            ]);
        }
        catch (error) {
            logger_1.logger.error('Failed to log auth event', { error: error.message });
        }
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map