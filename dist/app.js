"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const rateLimit_middleware_1 = require("./middleware/rateLimit.middleware");
const logger_1 = require("./utils/logger");
// Route imports
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);
// Global rate limiting
app.use(rateLimit_middleware_1.generalRateLimit);
// Request logging middleware
app.use((req, res, next) => {
    logger_1.logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});
// Routes
app.use('/health', health_routes_1.default);
app.use('/auth', auth_routes_1.default);
// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'Car Health Monitor - Authentication Service',
        version: process.env.npm_package_version || '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});
// 404 handler
app.use('*', (req, res) => {
    logger_1.logger.warn('Route not found', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip
    });
    res.status(404).json({
        error: 'not_found',
        message: 'The requested resource was not found',
        path: req.originalUrl
    });
});
// Global error handler
app.use((error, req, res, next) => {
    logger_1.logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url,
        ip: req.ip
    });
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(error.status || 500).json({
        error: 'internal_server_error',
        message: isDevelopment ? error.message : 'An internal server error occurred',
        ...(isDevelopment && { stack: error.stack })
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map