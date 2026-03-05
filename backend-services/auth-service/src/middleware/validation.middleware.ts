import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
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

      logger.warn('Validation failed', {
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

// Validation schemas
export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .max(255)
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'string.max': 'Email must not exceed 255 characters'
    }),
  
  password: Joi.string()
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
  
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 100 characters',
      'string.empty': 'Name is required'
    }),
  
  phone: Joi.string()
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

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required'
    })
});

export const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string()
    .required()
    .messages({
      'string.empty': 'Refresh token is required'
    })
});

export const changePasswordSchema = Joi.object({
  current_password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Current password is required'
    }),
  
  new_password: Joi.string()
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

export const updateProfileSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 100 characters'
    }),
  
  phone: Joi.string()
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