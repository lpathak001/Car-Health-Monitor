import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database';
import { jwtService } from './jwt.service';
import { cacheService } from './cache.service';
import { User, LoginRequest, RegisterRequest, AuthResponse, RefreshToken } from '../types';
import { logger } from '../utils/logger';

export class AuthService {
  private bcryptRounds: number;

  constructor() {
    this.bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [data.email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('User already exists with this email');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, this.bcryptRounds);

      // Create user
      const userId = uuidv4();
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
      `, [uuidv4(), userId, data.name.split(' ')[0], data.name.split(' ').slice(1).join(' '), '{}']);

      await client.query('COMMIT');

      // Generate tokens
      const accessToken = jwtService.generateToken({
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

      logger.info('User registered successfully', { userId: user.id, email: user.email });

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
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Registration failed', { 
        email: data.email, 
        error: (error as Error).message 
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async login(data: LoginRequest, ipAddress: string, userAgent: string): Promise<AuthResponse> {
    try {
      // Get user
      const userResult = await pool.query(`
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
      const passwordValid = await bcrypt.compare(data.password, user.password_hash);
      
      if (!passwordValid) {
        // Increment failed login attempts
        const newFailedAttempts = user.failed_login_attempts + 1;
        const shouldLock = newFailedAttempts >= 5;

        await pool.query(`
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
          logger.warn('Account locked due to failed login attempts', { 
            userId: user.id, 
            email: user.email 
          });
        }

        throw new Error('Invalid credentials');
      }

      // Reset failed login attempts and update last login
      await pool.query(`
        UPDATE users 
        SET failed_login_attempts = 0, last_login_at = NOW(), updated_at = NOW()
        WHERE id = $1
      `, [user.id]);

      // Generate tokens
      const accessToken = jwtService.generateToken({
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

      logger.info('User logged in successfully', { userId: user.id, email: user.email });

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
    } catch (error) {
      logger.error('Login failed', { 
        email: data.email, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  async refreshToken(refreshTokenValue: string): Promise<AuthResponse> {
    try {
      // Hash the refresh token to compare with stored hash
      const tokenHash = await bcrypt.hash(refreshTokenValue, 1);

      // Find valid refresh token
      const tokenResult = await pool.query(`
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
      const accessToken = jwtService.generateToken({
        sub: tokenData.user_id,
        email: tokenData.email,
        name: tokenData.name
      });

      // Generate new refresh token and revoke old one
      const newRefreshToken = await this.createRefreshToken(tokenData.user_id);
      
      await pool.query(`
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

      logger.info('Token refreshed successfully', { userId: tokenData.user_id });

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
    } catch (error) {
      logger.error('Token refresh failed', { error: (error as Error).message });
      throw error;
    }
  }

  async logout(userId: string, refreshTokenValue?: string): Promise<void> {
    try {
      if (refreshTokenValue) {
        const tokenHash = await bcrypt.hash(refreshTokenValue, 1);
        
        // Revoke refresh token
        await pool.query(`
          UPDATE refresh_tokens 
          SET revoked_at = NOW() 
          WHERE user_id = $1 AND token_hash = $2 AND revoked_at IS NULL
        `, [userId, tokenHash]);
      }

      // Clear cached user data
      await cacheService.del(`user:profile:${userId}`);

      // Log logout
      const user = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
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

      logger.info('User logged out successfully', { userId });
    } catch (error) {
      logger.error('Logout failed', { userId, error: (error as Error).message });
      throw error;
    }
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const token = uuidv4();
    const tokenHash = await bcrypt.hash(token, this.bcryptRounds);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await pool.query(`
      INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
      VALUES ($1, $2, $3, $4)
    `, [uuidv4(), userId, tokenHash, expiresAt]);

    return token;
  }

  private async logAuthEvent(event: {
    user_id?: string;
    email: string;
    event_type: string;
    success: boolean;
    ip_address: string;
    user_agent: string;
    failure_reason?: string;
  }): Promise<void> {
    try {
      await pool.query(`
        INSERT INTO authentication_logs (id, user_id, email, event_type, success, ip_address, user_agent, failure_reason)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        uuidv4(),
        event.user_id || null,
        event.email,
        event.event_type,
        event.success,
        event.ip_address,
        event.user_agent,
        event.failure_reason || null
      ]);
    } catch (error) {
      logger.error('Failed to log auth event', { error: (error as Error).message });
    }
  }
}

export const authService = new AuthService();