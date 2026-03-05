# Authentication Service - Domain Entities

## Core Domain Entities

### User Entity

#### User Table Structure
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'pending_verification',
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

#### User Entity Attributes
- **id**: Unique identifier (UUID)
- **email**: User's email address (unique, required)
- **password_hash**: Bcrypt hashed password
- **name**: User's full name
- **phone**: Optional phone number
- **status**: Account status (pending_verification, active, deactivated)
- **failed_login_attempts**: Counter for failed login attempts
- **locked_until**: Timestamp when account lockout expires
- **created_at**: Account creation timestamp
- **updated_at**: Last modification timestamp
- **last_login_at**: Last successful login timestamp

#### User Status Values
- `pending_verification`: Account created but email not verified
- `active`: Account verified and active
- `deactivated`: Account deactivated (soft delete)

### User Profile Entity

#### User Profile Table Structure
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_preferences JSONB,
    notification_preferences JSONB,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
```

#### User Profile Attributes
- **id**: Unique identifier (UUID)
- **user_id**: Reference to users table
- **vehicle_preferences**: JSON object with vehicle-related preferences
- **notification_preferences**: JSON object with notification settings
- **timezone**: User's timezone preference
- **language**: User's language preference
- **created_at**: Profile creation timestamp
- **updated_at**: Last modification timestamp

#### Vehicle Preferences Structure
```json
{
  "preferred_units": "metric|imperial",
  "dashboard_layout": "compact|detailed",
  "health_score_sensitivity": "low|medium|high",
  "maintenance_reminders": true|false
}
```

#### Notification Preferences Structure
```json
{
  "email_notifications": true|false,
  "push_notifications": true|false,
  "sms_notifications": true|false,
  "alert_types": {
    "critical_alerts": true|false,
    "maintenance_reminders": true|false,
    "health_reports": true|false
  },
  "notification_frequency": "immediate|daily|weekly"
}
```

### Refresh Token Entity

#### Refresh Token Table Structure
```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info VARCHAR(500),
    ip_address INET,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
```

#### Refresh Token Attributes
- **id**: Unique identifier (UUID)
- **user_id**: Reference to users table
- **token_hash**: Hashed refresh token value
- **device_info**: Client device information (user agent)
- **ip_address**: IP address where token was issued
- **expires_at**: Token expiration timestamp
- **created_at**: Token creation timestamp
- **revoked_at**: Token revocation timestamp (null if active)

### Email Verification Entity

#### Email Verification Table Structure
```sql
CREATE TABLE email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX idx_email_verifications_token_hash ON email_verifications(token_hash);
CREATE INDEX idx_email_verifications_expires_at ON email_verifications(expires_at);
```

#### Email Verification Attributes
- **id**: Unique identifier (UUID)
- **user_id**: Reference to users table
- **token_hash**: Hashed verification token
- **expires_at**: Token expiration timestamp (24 hours)
- **verified_at**: Timestamp when verification completed
- **created_at**: Token creation timestamp

### Password Reset Entity

#### Password Reset Table Structure
```sql
CREATE TABLE password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_password_resets_token_hash ON password_resets(token_hash);
CREATE INDEX idx_password_resets_expires_at ON password_resets(expires_at);
```

#### Password Reset Attributes
- **id**: Unique identifier (UUID)
- **user_id**: Reference to users table
- **token_hash**: Hashed reset token
- **expires_at**: Token expiration timestamp (1 hour)
- **used_at**: Timestamp when token was used
- **created_at**: Token creation timestamp

### Authentication Log Entity

#### Authentication Log Table Structure
```sql
CREATE TABLE authentication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255),
    event_type VARCHAR(50) NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address INET,
    user_agent VARCHAR(1000),
    error_message VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auth_logs_user_id ON authentication_logs(user_id);
CREATE INDEX idx_auth_logs_email ON authentication_logs(email);
CREATE INDEX idx_auth_logs_event_type ON authentication_logs(event_type);
CREATE INDEX idx_auth_logs_created_at ON authentication_logs(created_at);
CREATE INDEX idx_auth_logs_success ON authentication_logs(success);
```

#### Authentication Log Attributes
- **id**: Unique identifier (UUID)
- **user_id**: Reference to users table (nullable for failed attempts)
- **email**: Email address used in attempt
- **event_type**: Type of authentication event
- **success**: Whether the event was successful
- **ip_address**: Client IP address
- **user_agent**: Client user agent string
- **error_message**: Error details for failed attempts
- **created_at**: Event timestamp

#### Event Types
- `login_attempt`: User login attempt
- `login_success`: Successful login
- `login_failure`: Failed login
- `logout`: User logout
- `token_refresh`: Token refresh attempt
- `password_reset_request`: Password reset requested
- `password_reset_complete`: Password reset completed
- `email_verification`: Email verification completed
- `account_locked`: Account locked due to failed attempts
- `account_unlocked`: Account automatically unlocked

## Entity Relationships

### Primary Relationships
```
User (1) ←→ (1) UserProfile
User (1) ←→ (0..*) RefreshToken
User (1) ←→ (0..*) EmailVerification
User (1) ←→ (0..*) PasswordReset
User (1) ←→ (0..*) AuthenticationLog
```

### Relationship Descriptions
- **User ↔ UserProfile**: One-to-one relationship for extended user information
- **User ↔ RefreshToken**: One-to-many for multi-device support
- **User ↔ EmailVerification**: One-to-many for verification attempts
- **User ↔ PasswordReset**: One-to-many for reset attempts
- **User ↔ AuthenticationLog**: One-to-many for audit trail

## Domain Value Objects

### JWT Token Payload
```typescript
interface JWTPayload {
  user_id: string;
  email: string;
  name: string;
  iat: number;  // issued at
  exp: number;  // expires at
}
```

### Authentication Result
```typescript
interface AuthenticationResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    status: string;
  };
  tokens?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  error?: string;
}
```

### User Registration Data
```typescript
interface UserRegistrationData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  vehicle_info: {
    vin: string;
    make: string;
    model: string;
    year: number;
  };
  preferences: {
    vehicle_preferences: VehiclePreferences;
    notification_preferences: NotificationPreferences;
  };
}
```

## Data Validation Rules

### User Entity Validation
- **email**: Valid email format, unique across system
- **password**: Minimum 8 characters, mixed case required
- **name**: Required, 1-255 characters
- **phone**: Optional, valid phone format if provided
- **status**: Must be one of defined status values

### Token Validation
- **refresh_token**: Cryptographically secure random string
- **expires_at**: Must be future timestamp
- **token_hash**: SHA-256 hash of original token

### Profile Validation
- **vehicle_preferences**: Valid JSON matching schema
- **notification_preferences**: Valid JSON matching schema
- **timezone**: Valid timezone identifier
- **language**: Valid ISO language code

## Entity Lifecycle

### User Lifecycle
1. **Creation**: Status = 'pending_verification'
2. **Verification**: Status = 'active' after email verification
3. **Active Use**: Normal authentication and profile updates
4. **Deactivation**: Status = 'deactivated' (soft delete)
5. **Reactivation**: Status = 'active' (admin or user request)

### Token Lifecycle
1. **Creation**: Generated on login/refresh
2. **Active Use**: Used for authentication
3. **Expiration**: Natural expiry or manual revocation
4. **Cleanup**: Expired tokens removed by background job

### Verification Token Lifecycle
1. **Creation**: Generated on registration/resend
2. **Pending**: Awaiting user action
3. **Verification**: Used to verify email
4. **Expiration**: Automatic cleanup after 24 hours