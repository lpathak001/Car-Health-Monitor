# Authentication Service - Business Rules

## Account Security Policies

### Password Security Rules

#### Password Requirements
- **Minimum Length**: 8 characters
- **Character Requirements**: Must contain both uppercase and lowercase letters
- **Forbidden Passwords**: Cannot be common passwords (password, 123456, etc.)
- **Password History**: No restriction on password reuse (simple implementation)
- **Password Expiration**: No automatic password expiration

#### Password Validation Logic
```typescript
interface PasswordValidationRule {
  validate(password: string): ValidationResult;
}

class PasswordLengthRule implements PasswordValidationRule {
  validate(password: string): ValidationResult {
    return {
      valid: password.length >= 8,
      message: "Password must be at least 8 characters long"
    };
  }
}

class PasswordCaseRule implements PasswordValidationRule {
  validate(password: string): ValidationResult {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    return {
      valid: hasUpper && hasLower,
      message: "Password must contain both uppercase and lowercase letters"
    };
  }
}
```

### Account Lockout Rules

#### Failed Login Attempt Policy
- **Maximum Attempts**: 5 consecutive failed attempts
- **Lockout Duration**: 15 minutes
- **Counter Reset**: Successful login resets failed attempt counter
- **Lockout Scope**: Per email address (not IP-based)
- **Auto-Unlock**: Account automatically unlocks after lockout period

#### Lockout Implementation Logic
```typescript
interface AccountLockoutRule {
  maxAttempts: 5;
  lockoutDurationMinutes: 15;
  
  shouldLockAccount(failedAttempts: number): boolean {
    return failedAttempts >= this.maxAttempts;
  }
  
  calculateLockoutExpiry(): Date {
    return new Date(Date.now() + (this.lockoutDurationMinutes * 60 * 1000));
  }
  
  isAccountLocked(lockedUntil: Date | null): boolean {
    if (!lockedUntil) return false;
    return new Date() < lockedUntil;
  }
}
```

### Email Verification Rules

#### Verification Requirements
- **Mandatory Verification**: Email verification required before account activation
- **Token Expiration**: Verification tokens expire after 24 hours
- **Resend Limits**: Maximum 3 verification emails per day
- **Resend Cooldown**: 5-minute cooldown between resend attempts
- **Token Uniqueness**: Each verification token is single-use

#### Verification Business Logic
```typescript
interface EmailVerificationRule {
  tokenExpiryHours: 24;
  maxResendPerDay: 3;
  resendCooldownMinutes: 5;
  
  isTokenExpired(createdAt: Date): boolean {
    const expiryTime = new Date(createdAt.getTime() + (this.tokenExpiryHours * 60 * 60 * 1000));
    return new Date() > expiryTime;
  }
  
  canResendVerification(lastSentAt: Date, todayCount: number): boolean {
    const cooldownExpired = new Date() > new Date(lastSentAt.getTime() + (this.resendCooldownMinutes * 60 * 1000));
    const underDailyLimit = todayCount < this.maxResendPerDay;
    return cooldownExpired && underDailyLimit;
  }
}
```

## User Data Validation Rules

### Registration Data Validation

#### Email Validation Rules
- **Format**: Must be valid email format (RFC 5322 compliant)
- **Uniqueness**: Email must be unique across all users
- **Case Sensitivity**: Email comparison is case-insensitive
- **Domain Restrictions**: No domain restrictions (allow all valid domains)
- **Length**: Maximum 255 characters

#### Name Validation Rules
- **Required**: Name field is mandatory
- **Length**: 1-255 characters
- **Characters**: Allow letters, spaces, hyphens, apostrophes
- **Trimming**: Automatically trim leading/trailing whitespace
- **Empty Check**: Reject names that are only whitespace

#### Phone Validation Rules
- **Optional**: Phone number is optional
- **Format**: If provided, must be valid phone format
- **International**: Support international phone formats
- **Storage**: Store in E.164 format (+1234567890)

#### Vehicle Information Validation
- **VIN**: 17-character Vehicle Identification Number
- **Make**: Required, 1-100 characters
- **Model**: Required, 1-100 characters
- **Year**: Required, valid year (1900-current year + 1)

### Profile Data Validation

#### Preference Validation Rules
```typescript
interface VehiclePreferencesValidation {
  preferred_units: "metric" | "imperial";
  dashboard_layout: "compact" | "detailed";
  health_score_sensitivity: "low" | "medium" | "high";
  maintenance_reminders: boolean;
}

interface NotificationPreferencesValidation {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  alert_types: {
    critical_alerts: boolean;
    maintenance_reminders: boolean;
    health_reports: boolean;
  };
  notification_frequency: "immediate" | "daily" | "weekly";
}
```

## Token Lifecycle Rules

### JWT Access Token Rules

#### Token Generation Rules
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Expiration**: 15 minutes from issuance
- **Payload**: User ID, email, name, issued at, expires at
- **Secret**: Shared secret across all services
- **Issuer**: Authentication service identifier

#### Token Validation Rules
- **Signature**: Must have valid HMAC signature
- **Expiration**: Must not be expired
- **Format**: Must be valid JWT format
- **Required Claims**: Must contain user_id, email, name, iat, exp
- **Clock Skew**: Allow 30 seconds clock skew tolerance

### Refresh Token Rules

#### Token Generation Rules
- **Format**: Cryptographically secure random string (256 bits)
- **Expiration**: 7 days from issuance
- **Storage**: Stored as SHA-256 hash in database
- **Uniqueness**: Each token must be globally unique
- **Single Use**: Tokens are invalidated after use (rotation)

#### Token Rotation Rules
- **Automatic Rotation**: New refresh token generated on each use
- **Old Token Invalidation**: Previous refresh token immediately invalidated
- **Grace Period**: No grace period for old tokens
- **Concurrent Requests**: Handle concurrent refresh requests gracefully
- **Token Family**: Track token families for security

### Password Reset Token Rules

#### Reset Token Generation
- **Format**: Cryptographically secure random string (256 bits)
- **Expiration**: 1 hour from issuance
- **Single Use**: Token invalidated after successful password reset
- **User Limit**: Only one active reset token per user
- **Storage**: Stored as SHA-256 hash in database

#### Reset Token Validation
- **Expiration Check**: Must not be expired
- **Usage Check**: Must not have been used already
- **User Association**: Must be associated with valid user account
- **Token Format**: Must be valid format and length

## Error Handling Rules

### Authentication Error Policies

#### Generic Error Messages
- **Failed Login**: "Invalid credentials" (regardless of specific failure reason)
- **Account Not Found**: "Invalid credentials" (same as wrong password)
- **Account Locked**: "Account temporarily locked. Please try again later."
- **Account Inactive**: "Account not activated. Please check your email."
- **Token Invalid**: "Authentication required. Please log in."

#### Error Response Format
```typescript
interface AuthenticationError {
  error: string;
  error_code: string;
  message: string;
  timestamp: string;
}

// Example responses
const INVALID_CREDENTIALS = {
  error: "authentication_failed",
  error_code: "INVALID_CREDENTIALS",
  message: "Invalid credentials",
  timestamp: new Date().toISOString()
};

const ACCOUNT_LOCKED = {
  error: "account_locked",
  error_code: "ACCOUNT_LOCKED",
  message: "Account temporarily locked. Please try again later.",
  timestamp: new Date().toISOString()
};
```

### Token Error Handling

#### Token Expiration Handling
- **Access Token Expired**: Return 401 with specific error code
- **Refresh Token Expired**: Require full re-authentication
- **Invalid Token Format**: Return 401 with generic error
- **Token Signature Invalid**: Return 401 and log security event

#### Automatic Token Refresh Logic
```typescript
interface TokenRefreshRule {
  handleExpiredAccessToken(refreshToken: string): Promise<TokenRefreshResult> {
    // 1. Validate refresh token
    // 2. Generate new access token
    // 3. Rotate refresh token
    // 4. Return new token pair
    // 5. If refresh token invalid, require re-authentication
  }
  
  handleTokenRefreshFailure(): AuthenticationError {
    return {
      error: "token_refresh_failed",
      error_code: "REFRESH_TOKEN_INVALID",
      message: "Authentication required. Please log in.",
      timestamp: new Date().toISOString()
    };
  }
}
```

## Account Lifecycle Rules

### Account Status Management

#### Status Transition Rules
```typescript
enum AccountStatus {
  PENDING_VERIFICATION = "pending_verification",
  ACTIVE = "active",
  DEACTIVATED = "deactivated"
}

interface StatusTransitionRule {
  // Valid transitions
  validTransitions: {
    [AccountStatus.PENDING_VERIFICATION]: [AccountStatus.ACTIVE, AccountStatus.DEACTIVATED],
    [AccountStatus.ACTIVE]: [AccountStatus.DEACTIVATED],
    [AccountStatus.DEACTIVATED]: [AccountStatus.ACTIVE]
  };
  
  canTransition(from: AccountStatus, to: AccountStatus): boolean {
    return this.validTransitions[from]?.includes(to) ?? false;
  }
}
```

### Account Deactivation Rules

#### Soft Delete Policy
- **Data Retention**: All user data preserved
- **Access Prevention**: Account cannot authenticate
- **Token Invalidation**: All refresh tokens invalidated
- **Vehicle Association**: Vehicle ownership history preserved
- **Audit Trail**: All authentication logs preserved

#### Reactivation Rules
- **Admin Reactivation**: Administrators can reactivate accounts
- **User Request**: Users can request reactivation via support
- **Password Reset Required**: Reactivated accounts must reset password
- **Email Verification**: May require email re-verification
- **Notification**: Send reactivation confirmation email

## Audit and Logging Rules

### Authentication Event Logging

#### Required Log Events
- **All Login Attempts**: Both successful and failed
- **Token Operations**: Generation, refresh, revocation
- **Password Operations**: Reset requests, password changes
- **Account Operations**: Registration, verification, deactivation
- **Security Events**: Account lockouts, suspicious activity

#### Log Data Requirements
```typescript
interface AuthenticationLogEntry {
  user_id?: string;           // null for failed attempts with unknown user
  email: string;              // email used in attempt
  event_type: string;         // type of authentication event
  success: boolean;           // whether event was successful
  ip_address: string;         // client IP address
  user_agent: string;         // client user agent
  error_message?: string;     // error details for failed attempts
  timestamp: Date;            // event timestamp
}
```

### Log Retention Rules
- **Retention Period**: 90 days minimum for authentication logs
- **Security Events**: 1 year retention for security-related events
- **Compliance**: Longer retention if required by regulations
- **Anonymization**: Option to anonymize logs after retention period
- **Backup**: Regular backup of audit logs

## Security Monitoring Rules

### Suspicious Activity Detection
- **Multiple Failed Attempts**: More than 10 failed attempts per hour
- **Multiple IP Addresses**: Same user from multiple IPs within short time
- **Unusual Login Times**: Login attempts outside normal hours
- **Geographic Anomalies**: Login from unusual geographic locations
- **Token Abuse**: Excessive token refresh attempts

### Security Response Rules
- **Automatic Lockout**: Trigger account lockout for suspicious patterns
- **Admin Notification**: Alert administrators of security events
- **Rate Limiting**: Apply additional rate limiting for suspicious IPs
- **Enhanced Logging**: Increase logging detail for flagged accounts
- **Manual Review**: Flag accounts for manual security review

## Compliance and Privacy Rules

### Data Protection Rules
- **Password Storage**: Never store plaintext passwords
- **Token Security**: Refresh tokens stored as hashes only
- **PII Protection**: Encrypt sensitive personal information
- **Data Minimization**: Collect only necessary user data
- **Right to Deletion**: Support user data deletion requests

### Privacy Rules
- **Consent**: Obtain consent for data processing
- **Data Export**: Provide user data export functionality
- **Data Portability**: Support data transfer to other services
- **Transparency**: Clear privacy policy and data usage
- **User Control**: Allow users to control their data and preferences