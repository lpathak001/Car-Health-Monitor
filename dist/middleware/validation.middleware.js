"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.changePasswordSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = exports.validate = void 0;
const joi_1 = __importDefault(require("joi"));
const logger_1 = require("../utils/logger");
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const validationErrors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value
            }));
            logger_1.logger.warn('Validation failed', {
                path: req.path,
                method: req.method,
                errors: validationErrors
            });
            return res.status(400).json({
                error: 'validation_failed',
                message: 'Request validation failed',
                details: validationErrors
            });
        }
        // Replace req.body with validated and sanitized data
        req.body = value;
        next();
    };
};
exports.validate = validate;
// Validation schemas
exports.registerSchema = joi_1.default.object({
    email: joi_1.default.string()
        .email()
        .lowercase()
        .max(255)
        .required()
        .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required',
        'string.max': 'Email must not exceed 255 characters'
    }),
    password: joi_1.default.string()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'string.empty': 'Password is required'
    }),
    name: joi_1.default.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name must not exceed 100 characters',
        'string.empty': 'Name is required'
    }),
    phone: joi_1.default.string()
        .pattern(/^\+?[\d\s\-\(\)]+$/)
        .min(10)
        .max(20)
        .optional()
        .messages({
        'string.pattern.base': 'Please provide a valid phone number',
        'string.min': 'Phone number must be at least 10 characters long',
        'string.max': 'Phone number must not exceed 20 characters'
    })
});
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string()
        .email()
        .lowercase()
        .required()
        .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required'
    }),
    password: joi_1.default.string()
        .required()
        .messages({
        'string.empty': 'Password is required'
    })
});
exports.refreshTokenSchema = joi_1.default.object({
    refresh_token: joi_1.default.string()
        .required()
        .messages({
        'string.empty': 'Refresh token is required'
    })
});
exports.changePasswordSchema = joi_1.default.object({
    current_password: joi_1.default.string()
        .required()
        .messages({
        'string.empty': 'Current password is required'
    }),
    new_password: joi_1.default.string()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
        'string.min': 'New password must be at least 8 characters long',
        'string.max': 'New password must not exceed 128 characters',
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'string.empty': 'New password is required'
    })
});
exports.updateProfileSchema = joi_1.default.object({
    name: joi_1.default.string()
        .trim()
        .min(2)
        .max(100)
        .optional()
        .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name must not exceed 100 characters'
    }),
    phone: joi_1.default.string()
        .pattern(/^\+?[\d\s\-\(\)]+$/)
        .min(10)
        .max(20)
        .optional()
        .allow('')
        .messages({
        'string.pattern.base': 'Please provide a valid phone number',
        'string.min': 'Phone number must be at least 10 characters long',
        'string.max': 'Phone number must not exceed 20 characters'
    })
});
//# sourceMappingURL=validation.middleware.js.map