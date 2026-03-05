# 📱 Mobile App - Running Guide

## Current Session (Web Demo) ✅ RUNNING NOW

The mobile app is currently running as an **interactive web demo**!

### Access the Demo:
```
http://localhost:3005/web-demo.html
```

**Features:**
- ✅ Interactive phone mockup
- ✅ All 4 screens (Dashboard, Alerts, Vehicle, Profile)
- ✅ Tab navigation
- ✅ Real-time health score updates
- ✅ Toggleable settings
- ✅ Responsive design

**What you can do:**
- Click tabs to switch between screens
- Toggle notification/dark mode settings
- Watch health score update in real-time
- See all UI components in action

---

## Option 2: Run Actual React Native App (Requires Setup)

### Prerequisites:
- Node.js 18+
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- Physical device with Expo Go app

### Steps:

1. **Install Dependencies**
   ```bash
   cd mobile-app
   npm install
   ```

2. **Start Expo Dev Server**
   ```bash
   npm start
   ```

3. **Choose Platform:**
   - Press `i` for iOS Simulator (Mac only)
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on your phone

### Note:
This requires a local machine with display/emulator. Not available in remote Linux sessions.

---

## Option 3: Build for Production

### iOS (Requires Mac + Xcode)
```bash
cd mobile-app
expo build:ios
```

### Android
```bash
cd mobile-app
expo build:android
```

### Web
```bash
cd mobile-app
expo build:web
npx serve web-build
```

---

## Current Demo Features

### Dashboard Screen
- Health score gauge (80/100)
- Sensor trend chart
- Status card
- Real-time updates every 3 seconds

### Alerts Screen
- 3 sample alerts:
  - ⚠️ High Temperature Warning
  - ℹ️ Maintenance Due
  - 🔴 Brake Pad Wear
- Color-coded by severity
- Timestamp display

### Vehicle Screen
- Vehicle details:
  - Make: Toyota
  - Model: Camry
  - Year: 2022
  - VIN: 1HGBH41JXMN109186
- Edit vehicle button
- Add new vehicle button

### Profile Screen
- User info:
  - Name: Demo User
  - Email: demo@carhealthmonitor.com
- Settings:
  - Push Notifications (toggle)
  - Dark Mode (toggle)
- Edit profile button
- Logout button

---

## API Integration (For Real App)

The React Native components would connect to backend services:

```typescript
// Example API calls
const API_BASE = 'http://localhost:3000';

// Get health score
const healthScore = await fetch(`${API_BASE}/health-score/${vehicleId}`, {
  headers: { Authorization: `Bearer ${token}` }
});

// Get alerts
const alerts = await fetch(`http://localhost:3004/alerts/${userId}`, {
  headers: { Authorization: `Bearer ${token}` }
});

// Get vehicle info
const vehicle = await fetch(`http://localhost:3001/vehicles/${vehicleId}`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

---

## File Structure

```
mobile-app/
├── App.tsx                    # Main navigation
├── web-demo.html             # Web demo (RUNNING)
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── app.json                  # Expo config
├── dashboard/
│   └── src/
│       ├── screens/
│       │   └── DashboardScreen.tsx
│       └── components/
│           ├── HealthScoreGauge.tsx
│           └── SensorChart.tsx
├── alerts/
│   └── src/screens/AlertsScreen.tsx
├── vehicle/
│   └── src/screens/VehicleScreen.tsx
└── profile/
    └── src/screens/ProfileScreen.tsx
```

---

## Next Steps

### For Development:
1. ✅ Web demo is running - view in browser
2. Install Expo CLI: `npm install -g expo-cli`
3. Run on device: `npm start` in mobile-app directory

### For Production:
1. Configure API endpoints
2. Add authentication flow
3. Implement real-time updates (WebSocket)
4. Add push notifications
5. Build and deploy to app stores

---

## Troubleshooting

### Web Demo Not Loading?
```bash
# Check if server is running
curl http://localhost:3005/web-demo.html

# Restart server
cd mobile-app
python3 -m http.server 3005
```

### React Native Issues?
```bash
# Clear cache
expo start -c

# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## Demo vs Production

| Feature | Web Demo | React Native App |
|---------|----------|------------------|
| Navigation | ✅ Working | ✅ Native |
| UI Components | ✅ HTML/CSS | ✅ React Native |
| API Integration | ❌ Mock data | ✅ Real APIs |
| Push Notifications | ❌ | ✅ |
| Offline Support | ❌ | ✅ |
| App Store | ❌ | ✅ |
| Performance | Good | Excellent |

---

## Summary

**Current Status:** ✅ Web demo running on port 3005

**Access:** http://localhost:3005/web-demo.html

**Features:** All 4 screens with interactive navigation

**Next:** Install Expo and run on actual device for full experience
