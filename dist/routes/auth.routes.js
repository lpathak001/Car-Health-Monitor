"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = require("../services/auth.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Register endpoint
router.post('/register', rateLimit_middleware_1.authRateLimit, (0, validation_middleware_1.validate)(validation_middleware_1.registerSchema), async (req, res) => {
    try {
        const result = await auth_service_1.authService.register(req.body);
        logger_1.logger.info('User registration successful', {
            email: req.body.email,
            userId: result.user.id
        });
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: result
        });
    }
    catch (error) {
        const errorMessage = error.message;
        logger_1.logger.error('Registration failed', {
            email: req.body.email,
            error: errorMessage,
            ip: req.ip
        });
        if (errorMessage.includes('already exists')) {
            return res.status(409).json({
                error: 'user_exists',
                message: 'User already exists with this email address'
            });
        }
        res.status(400).json({
            error: 'registration_failed',
            message: 'Registration failed. Please try again.'
        });
    }
});
// Login endpoint
router.post('/login', rateLimit_middleware_1.authRateLimit, (0, validation_middleware_1.validate)(validation_middleware_1.loginSchema), async (req, res) => {
    try {
        const ipAddress = req.ip || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';
        const result = await auth_service_1.authService.login(req.body, ipAddress, userAgent);
        logger_1.logger.info('User login successful', {
            email: req.body.email,
            userId: result.user.id,
            ip: ipAddress
        });
        res.json({
            success: true,
            message: 'Login successful',
            data: result
        });
    }
    catch (error) {
        const errorMessage = error.message;
        logger_1.logger.error('Login failed', {
            email: req.body.email,
            error: errorMessage,
            ip: req.ip
        });
        if (errorMessage.includes('Invalid credentials')) {
            return res.status(401).json({
                error: 'invalid_credentials',
                message: 'Invalid email or password'
            });
        }
        if (errorMessage.includes('locked')) {
            return res.status(423).json({
                error: 'account_locked',
                message: 'Account is locked. Please contact support.'
            });
        }
        res.status(400).json({
            error: 'login_failed',
            message: 'Login failed. Please try again.'
        });
    }
});
// Refresh token endpoint
router.post('/refresh', rateLimit_middleware_1.strictRateLimit, (0, validation_middleware_1.validate)(validation_middleware_1.refreshTokenSchema), async (req, res) => {
    try {
        const result = await auth_service_1.authService.refreshToken(req.body.refresh_token);
        logger_1.logger.info('Token refresh successful', {
            userId: result.user.id
        });
        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: result
        });
    }
    catch (error) {
        const errorMessage = error.message;
        logger_1.logger.error('Token refresh failed', {
            error: errorMessage,
            ip: req.ip
        });
        if (errorMessage.includes('Invalid or expired')) {
            return res.status(401).json({
                error: 'invalid_refresh_token',
                message: 'Invalid or expired refresh token'
            });
        }
        res.status(400).json({
            error: 'token_refresh_failed',
            message: 'Token refresh failed. Please login again.'
        });
    }
});
// Logout endpoint
router.post('/logout', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.sub;
        const refreshToken = req.body.refresh_token;
        await auth_service_1.authService.logout(userId, refreshToken);
        logger_1.logger.info('User logout successful', { userId });
        res.json({
            success: true,
            message: 'Logout successful'
        });
    }
    catch (error) {
        logger_1.logger.error('Logout failed', {
            userId: req.user?.sub,
            error: error.message
        });
        res.status(400).json({
            error: 'logout_failed',
            message: 'Logout failed. Please try again.'
        });
    }
});
// Get current user profile
router.get('/me', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.sub;
        // This would typically fetch from user service
        // For now, return the token payload
        res.json({
            success: true,
            data: {
                id: req.user.sub,
                email: req.user.email,
                name: req.user.name
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get user profile failed', {
            userId: req.user?.sub,
            error: error.message
        });
        res.status(500).json({
            error: 'profile_fetch_failed',
            message: 'Failed to fetch user profile'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map