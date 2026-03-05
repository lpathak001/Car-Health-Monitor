import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { authRateLimit, strictRateLimit } from '../middleware/rateLimit.middleware';
import { 
  validate, 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema 
} from '../middleware/validation.middleware';
import { logger } from '../utils/logger';

const router = Router();

// Register endpoint
router.post('/register', 
  authRateLimit,
  validate(registerSchema),
  async (req: Request, res: Response) => {
    try {
      const result = await authService.register(req.body);
      
      logger.info('User registration successful', { 
        email: req.body.email,
        userId: result.user.id 
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      logger.error('Registration failed', { 
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
  }
);

// Login endpoint
router.post('/login',
  authRateLimit,
  validate(loginSchema),
  async (req: Request, res: Response) => {
    try {
      const ipAddress = req.ip || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      
      const result = await authService.login(req.body, ipAddress, userAgent);
      
      logger.info('User login successful', { 
        email: req.body.email,
        userId: result.user.id,
        ip: ipAddress
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      logger.error('Login failed', { 
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
  }
);

// Refresh token endpoint
router.post('/refresh',
  strictRateLimit,
  validate(refreshTokenSchema),
  async (req: Request, res: Response) => {
    try {
      const result = await authService.refreshToken(req.body.refresh_token);
      
      logger.info('Token refresh successful', { 
        userId: result.user.id 
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: result
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      logger.error('Token refresh failed', { 
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
  }
);

// Logout endpoint
router.post('/logout',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.sub;
      const refreshToken = req.body.refresh_token;
      
      await authService.logout(userId, refreshToken);
      
      logger.info('User logout successful', { userId });

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout failed', { 
        userId: req.user?.sub,
        error: (error as Error).message 
      });

      res.status(400).json({
        error: 'logout_failed',
        message: 'Logout failed. Please try again.'
      });
    }
  }
);

// Get current user profile
router.get('/me',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.sub;
      
      // This would typically fetch from user service
      // For now, return the token payload
      res.json({
        success: true,
        data: {
          id: req.user!.sub,
          email: req.user!.email,
          name: req.user!.name
        }
      });
    } catch (error) {
      logger.error('Get user profile failed', { 
        userId: req.user?.sub,
        error: (error as Error).message 
      });

      res.status(500).json({
        error: 'profile_fetch_failed',
        message: 'Failed to fetch user profile'
      });
    }
  }
);

export default router;