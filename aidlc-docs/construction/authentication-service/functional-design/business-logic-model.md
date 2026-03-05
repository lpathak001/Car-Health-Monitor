# Authentication Service - Business Logic Model

## Core Business Workflows

### User Registration Workflow

#### Registration with Vehicle Information Required
```
1. User provides registration data:
   - Email address
   - Password (8+ characters, mixed case)
   - Full name
   - Phone number (optional)
   - Initial vehicle information (VIN, make, model, year)
   - Notification preferences

2. System validates input data:
   - Email format validation
   - Password strength validation (8+ chars, mixed case)
   - Vehicle information validation
   - Duplicate email check

3. System creates user account:
   - Generate unique user ID
   - Hash password using bcrypt
   - Store user data in normalized tables
   - Set account status to "pending_verification"

4. System sends email verification:
   - Generate time-limited verification token (24 hours)
   - Send verification email with activation link
   - Store verification token with expiration

5. User clicks verification link:
   - Validate verification token
   - Check token expiration
   - Activate user account (status = "active")
   - Auto-login user with JWT tokens

6. System completes registration:
   - Generate access token (15 minutes expiry)
   - Generate refresh token (7 days expiry)
   - Return tokens to client
   - Log successful registration
```

### Authentication Workflow

#### JWT Access + Refresh Token Pattern
```
1. User login attempt:
   - User provides email and password
   - System validates credentials against database
   - Check account status (must be "active")
   - Verify account not locked

2. Failed authentication handling:
   - Increment failed attempt counter
   - Lock account after 5 failed attempts (15-minute lockout)
   - Return generic error message: "Invalid credentials"
   - Log failed attempt with IP address

3. Successful authentication:
   - Generate access token (JWT, 15 minutes expiry)
     - Payload: user_id, email, name, issued_at, expires_at
   - Generate refresh token (secure random, 7 days expiry)
   - Store refresh token in database with expiration
   - Reset failed attempt counter
   - Log successful login
   - Return both tokens to client

4. Token refresh workflow:
   - Client sends refresh token when access token expires
   - Validate refresh token exists and not expired
   - Generate new access token (15 minutes)
   - Rotate refresh token (new 7-day token)
   - Invalidate old refresh token
   - Return new token pair
```

### Password Management Workflow

#### Password Reset with Time-Limited Tokens
```
1. Password reset request:
   - User provides email address
   - System validates email exists
   - Generate secure reset token (1-hour expiry)
   - Send reset email with token link
   - Log reset request

2. Password reset completion:
   - User clicks reset link with token
   - Validate token exists and not expired
   - Present password reset form
   - User enters new password
   - Validate password strength (8+ chars, mixed case)
   - Hash new password with bcrypt
   - Update user password in database
   - Invalidate reset token
   - Invalidate all existing refresh tokens
   - Log password change
   - Send confirmation email
```

### Account Security Workflow

#### Basic Login Attempt Limiting
```
1. Failed login tracking:
   - Track failed attempts per email address
   - Store attempt count and last attempt timestamp
   - Reset counter on successful login

2. Account lockout logic:
   - Lock account after 5 consecutive failed attempts
   - Lockout duration: 15 minutes
   - During lockout: reject all login attempts
   - Auto-unlock after lockout period expires
   - Log lockout events

3. Security monitoring:
   - Log all authentication events
   - Track suspicious patterns (multiple IPs, rapid attempts)
   - Generate security alerts for admin review
```

## Token Management Logic

### JWT Token Structure
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user_id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "iat": 1640995200,
    "exp": 1640996100
  }
}
```

### Refresh Token Rotation
```
1. Token refresh request:
   - Validate current refresh token
   - Generate new access token (15 min)
   - Generate new refresh token (7 days)
   - Store new refresh token in database
   - Invalidate old refresh token
   - Return new token pair

2. Token security:
   - Refresh tokens are cryptographically secure random strings
   - Stored hashed in database
   - Single-use tokens (invalidated after use)
   - Automatic cleanup of expired tokens
```

### Cross-Service Token Validation
```
1. Service receives request with JWT:
   - Extract JWT from Authorization header
   - Validate JWT signature using shared secret
   - Check token expiration
   - Extract user context (ID, email, name)
   - Proceed with authorized request

2. Token validation failure:
   - Return 401 Unauthorized
   - Client attempts token refresh
   - If refresh fails, redirect to login
```

## Email Verification Logic

### Required Email Verification Before Activation
```
1. Verification token generation:
   - Generate cryptographically secure token
   - Set 24-hour expiration
   - Store token with user ID and expiration
   - Send verification email

2. Verification process:
   - User clicks verification link
   - Extract token from URL
   - Validate token exists and not expired
   - Update user account status to "active"
   - Invalidate verification token
   - Auto-login user with JWT tokens

3. Resend verification:
   - Allow resend after 5-minute cooldown
   - Invalidate previous verification token
   - Generate new token and send email
   - Limit to 3 resend attempts per day
```

## User Session Management

### Stateless JWT with Refresh Token Tracking
```
1. Session establishment:
   - Create access token (stateless JWT)
   - Create refresh token (stored in database)
   - No server-side session storage for access tokens
   - Track refresh tokens for security

2. Session termination:
   - Logout: invalidate refresh token
   - Password change: invalidate all refresh tokens
   - Account deactivation: invalidate all tokens
   - Token expiry: natural expiration

3. Multi-device support:
   - Multiple refresh tokens per user
   - Track device/client information
   - Allow selective token revocation
   - Limit concurrent sessions (optional)
```

## Account Lifecycle Management

### Soft Delete with Data Retention
```
1. Account deactivation:
   - Set user status to "deactivated"
   - Preserve all user data
   - Invalidate all refresh tokens
   - Prevent new logins
   - Maintain vehicle history associations

2. Account reactivation:
   - Admin can reactivate account
   - User can request reactivation
   - Restore account status to "active"
   - Require password reset for security
   - Send reactivation notification

3. Data retention:
   - Keep user data for audit purposes
   - Maintain vehicle ownership history
   - Preserve authentication logs
   - Support data export requests
```

## Business Rules Summary

### Registration Rules
- Email verification required before account activation
- Vehicle information required during registration
- Password must be 8+ characters with mixed case
- Duplicate email addresses not allowed
- Account status starts as "pending_verification"

### Authentication Rules
- Only "active" accounts can authenticate
- 5 failed attempts trigger 15-minute lockout
- Generic error messages for all authentication failures
- Successful login resets failed attempt counter
- All authentication attempts logged

### Token Rules
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Refresh tokens are single-use (rotated on each use)
- Password changes invalidate all refresh tokens
- JWT tokens contain basic user info (ID, email, name)

### Security Rules
- Passwords hashed using bcrypt
- Reset tokens expire in 1 hour
- Verification tokens expire in 24 hours
- All security events logged
- Account lockouts automatically expire after 15 minutes