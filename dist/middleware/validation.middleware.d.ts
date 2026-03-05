import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
export declare const validate: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const registerSchema: Joi.ObjectSchema<any>;
export declare const loginSchema: Joi.ObjectSchema<any>;
export declare const refreshTokenSchema: Joi.ObjectSchema<any>;
export declare const changePasswordSchema: Joi.ObjectSchema<any>;
export declare const updateProfileSchema: Joi.ObjectSchema<any>;
//# sourceMappingURL=validation.middleware.d.ts.map