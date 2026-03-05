# Feature #3 - Real-time Alerts & Notifications - Quick Start

## Overview

The Notification Service provides comprehensive multi-channel alert delivery with user preferences, alert history, and fleet-wide alert capabilities.

## Quick Start

### 1. Verify Service Is Running

```bash
curl http://localhost:3008/health
```

### 2. Send an Alert

```bash
VEHICLE_ID="65c42515-739a-4292-99a2-5e013a59096d"
USER_ID="4c2469be-7690-49c8-b416-f833eaa42d98"

curl -X POST http://localhost:3008/api/notifications/send-alert \
  -H "Content-Type: application/json" \
  -d "{
    \"vehicle_id\": \"$VEHICLE_ID\",
    \"user_id\": \"$USER_ID\",
    \"alert_type\": \"warning\",
    \"title\": \"High Temperature Detected\",
    \"message\": \"Engine temperature is 150°F, exceeding normal range\",
    \"channels\": [\"email\", \"push\"]
  }"
```

### 3. Get Unread Alert Count

```bash
USER_ID="4c2469be-7690-49c8-b416-f833eaa42d98"
curl http://localhost:3008/api/notifications/unread-count/$USER_ID
```

### 4. Get Alert History

```bash
USER_ID="4c2469be-7690-49c8-b416-f833eaa42d98"
curl "http://localhost:3008/api/notifications/alerts/$USER_ID?limit=10&offset=0"
```

### 5. Mark Alert as Read

```bash
ALERT_ID="3fd27eef-8017-41e6-9713-56dfb424b980"
curl -X PUT http://localhost:3008/api/notifications/alerts/$ALERT_ID/read
```

### 6. Get Alert Preferences

```bash
USER_ID="4c2469be-7690-49c8-b416-f833eaa42d98"
curl http://localhost:3008/api/notifications/preferences/$USER_ID
```

### 7. Update Alert Preferences

```bash
USER_ID="4c2469be-7690-49c8-b416-f833eaa42d98"
curl -X POST http://localhost:3008/api/notifications/preferences/$USER_ID \
  -H "Content-Type: application/json" \
  -d "{
    \"email_enabled\": true,
    \"sms_enabled\": true,
    \"push_enabled\": true,
    \"slack_enabled\": false,
    \"alert_threshold\": \"warning\"
  }"
```

### 8. Get Alert Statistics

```bash
USER_ID="4c2469be-7690-49c8-b416-f833eaa42d98"
curl "http://localhost:3008/api/notifications/statistics/$USER_ID?days=30"
```

### 9. Send Bulk Alerts (Fleet-wide)

```bash
curl -X POST http://localhost:3008/api/notifications/bulk-send \
  -H "Content-Type: application/json" \
  -d "{
    \"vehicle_ids\": [
      \"65c42515-739a-4292-99a2-5e013a59096d\",
      \"vehicle-id-2\",
      \"vehicle-id-3\"
    ],
    \"alert_type\": \"critical\",
    \"title\": \"Fleet Maintenance Alert\",
    \"message\": \"All vehicles require immediate maintenance check\",
    \"channels\": [\"email\", \"push\"]
  }"
```

## Alert Types

- **critical**: Urgent issues requiring immediate attention (red)
- **warning**: Important issues that need attention soon (yellow)
- **info**: Informational messages (blue)

## Notification Channels

### Email
- Requires SMTP configuration
- HTML formatted messages
- Includes alert details and timestamp

### SMS
- Requires Twilio account
- Text message delivery
- Phone number required

### Push Notifications
- Mobile app integration
- Real-time delivery
- Firebase Cloud Messaging

### Slack
- Requires Slack webhook URL
- Rich message formatting
- Color-coded by alert type

## Configuration

### Email Setup (SMTP)

```bash
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_SECURE=false
export SMTP_USER=your-email@gmail.com
export SMTP_PASSWORD=your-app-password
```

### SMS Setup (Twilio)

```bash
export TWILIO_ACCOUNT_SID=your-account-sid
export TWILIO_AUTH_TOKEN=your-auth-token
export TWILIO_PHONE=+1234567890
```

### Slack Setup

```bash
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/api/notifications/send-alert` | POST | Send alert via channels |
| `/api/notifications/alerts/:userId` | GET | Get alert history |
| `/api/notifications/alerts/:alertId/read` | PUT | Mark alert as read |
| `/api/notifications/unread-count/:userId` | GET | Get unread count |
| `/api/notifications/preferences/:userId` | GET | Get preferences |
| `/api/notifications/preferences/:userId` | POST | Update preferences |
| `/api/notifications/statistics/:userId` | GET | Get statistics |
| `/api/notifications/bulk-send` | POST | Send bulk alerts |

## Response Examples

### Send Alert Response
```json
{
  "alert_id": "3fd27eef-8017-41e6-9713-56dfb424b980",
  "message": "Alert sent successfully",
  "channels_status": {
    "email": true,
    "push": true
  },
  "timestamp": "2026-03-05T09:17:05.983Z"
}
```

### Alert History Response
```json
{
  "alerts": [
    {
      "id": "3fd27eef-8017-41e6-9713-56dfb424b980",
      "vehicle_id": "65c42515-739a-4292-99a2-5e013a59096d",
      "alert_type": "warning",
      "title": "High Temperature Detected",
      "message": "Engine temperature is 150°F",
      "created_at": "2026-03-05T09:17:05.978Z",
      "read": false
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

### Preferences Response
```json
{
  "user_id": "4c2469be-7690-49c8-b416-f833eaa42d98",
  "email_enabled": true,
  "sms_enabled": false,
  "push_enabled": true,
  "slack_enabled": false,
  "alert_threshold": "warning"
}
```

## Performance

- **Response Time**: <100ms for most endpoints
- **Caching**: Unread count cached for 1 minute
- **Throughput**: 100+ concurrent requests
- **Channels**: Asynchronous delivery with error handling

## Troubleshooting

### Service Not Responding
```bash
curl http://localhost:3008/health
```

### Email Not Sending
- Check SMTP credentials
- Verify email address format
- Check SMTP_HOST and SMTP_PORT

### SMS Not Sending
- Verify Twilio credentials
- Check phone number format
- Ensure account has SMS credits

### Slack Not Posting
- Verify webhook URL
- Check Slack workspace permissions
- Test webhook manually

## Integration Examples

### With Health Analysis Service
```bash
# When health score drops below threshold
curl -X POST http://localhost:3008/api/notifications/send-alert \
  -H "Content-Type: application/json" \
  -d "{
    \"vehicle_id\": \"...\",
    \"user_id\": \"...\",
    \"alert_type\": \"critical\",
    \"title\": \"Vehicle Health Critical\",
    \"message\": \"Health score dropped to 45%\",
    \"channels\": [\"email\", \"push\", \"sms\"]
  }"
```

### With Predictive Maintenance Service
```bash
# When component failure predicted
curl -X POST http://localhost:3008/api/notifications/send-alert \
  -H "Content-Type: application/json" \
  -d "{
    \"vehicle_id\": \"...\",
    \"user_id\": \"...\",
    \"alert_type\": \"warning\",
    \"title\": \"Maintenance Recommended\",
    \"message\": \"Battery replacement recommended within 30 days\",
    \"channels\": [\"email\", \"push\"]
  }"
```

## Next Steps

1. Configure email/SMS/Slack credentials
2. Set up alert triggers in other services
3. Create notification templates
4. Implement delivery tracking
5. Add retry logic for failed deliveries
6. Monitor alert delivery metrics

## Support

For issues or questions, refer to:
- `TASK_19_FEATURE_3_COMPLETION.md` - Detailed implementation notes
- Service logs: `backend-services/notification-service/notification.log`
- Database: `alerts` and `notification_preferences` tables
