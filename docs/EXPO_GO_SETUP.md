# Expo Go Setup Instructions

This guide will help you set up and test the Heinicus Mobile Mechanic app using Expo Go for rapid development and testing.

## 📱 What is Expo Go?

Expo Go is a free app that allows you to run Expo projects on your physical device without building a standalone app. It's perfect for:
- Rapid prototyping and development
- Testing on real devices
- Sharing work-in-progress with stakeholders
- Quick iterations and debugging

## 🚀 Quick Setup

### Step 1: Install Expo Go

**iOS (iPhone/iPad)**
1. Open the App Store
2. Search for "Expo Go"
3. Install the app by Expo
4. Open the app and create an account (optional)

**Android**
1. Open Google Play Store
2. Search for "Expo Go"
3. Install the app by Expo
4. Open the app and create an account (optional)

### Step 2: Development Environment Setup

1. **Install Node.js** (version 18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **Install Expo CLI**
   ```bash
   npm install -g @expo/cli
   ```

3. **Clone the Project**
   ```bash
   git clone https://github.com/GrizzlyRooster34/mobile-mechanic-app.git
   cd mobile-mechanic-app
   ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Set Up Environment Variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   # Required for mobile app
   API_BASE_URL="http://your-local-ip:3000"  # Use your computer's IP
   EXPO_ACCESS_TOKEN="your-expo-access-token"
   
   # Other required variables
   DATABASE_URL="your-database-url"
   ABACUS_AI_API_KEY="your-ai-api-key"
   STRIPE_PUBLISHABLE_KEY="your-stripe-key"
   ```

### Step 3: Start Development Server

1. **Start the Expo Development Server**
   ```bash
   npm run mobile
   ```

2. **You'll see output like this:**
   ```
   › Metro waiting on exp://192.168.1.100:8081
   › Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
   
   › Press a │ open Android
   › Press i │ open iOS simulator
   › Press w │ open web
   
   › Press r │ reload app
   › Press m │ toggle menu
   › Press ? │ show all commands
   ```

### Step 4: Connect Your Device

**Method 1: QR Code (Recommended)**
1. Open Expo Go on your device
2. Tap "Scan QR Code"
3. Scan the QR code from your terminal
4. The app will load on your device

**Method 2: Manual Connection**
1. Ensure your device and computer are on the same WiFi network
2. In Expo Go, tap "Enter URL manually"
3. Enter the URL shown in your terminal (e.g., `exp://192.168.1.100:8081`)

## 🔧 Configuration Options

### Network Configuration

If you're having connection issues, try these options:

1. **Tunnel Mode** (works through firewalls)
   ```bash
   npm run mobile:tunnel
   ```

2. **LAN Mode** (faster, requires same network)
   ```bash
   npm run mobile
   ```

3. **Localhost Mode** (simulator only)
   ```bash
   expo start --localhost
   ```

### Environment-Specific Setup

**Development Environment**
```bash
# Start with development configuration
npm run mobile:dev
```

**Production Testing**
```bash
# Test production build locally
expo start --no-dev --minify
```

## 📋 Testing Checklist

Once the app loads in Expo Go, test these features:

### ✅ Core Functionality
- [ ] App loads without errors
- [ ] Navigation works between screens
- [ ] AI chat interfaces are responsive
- [ ] Location services prompt appears
- [ ] Camera access works for photo capture

### ✅ Mobile-Specific Features
- [ ] Touch gestures work properly
- [ ] Keyboard appears and dismisses correctly
- [ ] Screen orientation changes work
- [ ] Back button behavior (Android)
- [ ] Status bar styling is correct

### ✅ Performance
- [ ] App loads quickly
- [ ] Smooth animations and transitions
- [ ] No memory leaks during navigation
- [ ] Responsive to user interactions

## 🐛 Troubleshooting

### Common Issues and Solutions

**1. "Unable to connect to Metro"**
```bash
# Solution: Use tunnel mode
npm run mobile:tunnel

# Or check firewall settings
# Ensure ports 8081 and 19000-19006 are open
```

**2. "Network request failed"**
```bash
# Solution: Update API_BASE_URL in .env.local
# Use your computer's IP address, not localhost
API_BASE_URL="http://192.168.1.100:3000"
```

**3. "Module not found" errors**
```bash
# Solution: Clear cache and reinstall
expo r -c
rm -rf node_modules
npm install
```

**4. App crashes on startup**
```bash
# Solution: Check logs and environment variables
expo start --dev-client
# Check the terminal for detailed error messages
```

**5. Slow loading or performance issues**
```bash
# Solution: Enable development mode optimizations
expo start --dev --clear
```

### Debug Tools

**1. Remote Debugging**
- Shake your device in Expo Go
- Tap "Debug Remote JS"
- Use Chrome DevTools for debugging

**2. Element Inspector**
- Shake device → "Show Element Inspector"
- Inspect UI elements and styles

**3. Performance Monitor**
- Shake device → "Show Performance Monitor"
- Monitor FPS and memory usage

## 📱 Device-Specific Notes

### iOS Devices
- Camera app can also scan QR codes
- Shake gesture opens developer menu
- Three-finger tap for element inspector
- Requires iOS 13.0 or later

### Android Devices
- Use Expo Go app to scan QR codes
- Shake gesture or hardware menu button
- Two-finger tap for element inspector
- Requires Android 5.0 (API 21) or later

## 🔄 Development Workflow

### Typical Development Session

1. **Start Development Server**
   ```bash
   npm run mobile
   ```

2. **Make Code Changes**
   - Edit files in your IDE
   - Save changes
   - App automatically reloads in Expo Go

3. **Test on Device**
   - Interact with the app
   - Check console logs in terminal
   - Use debug tools as needed

4. **Iterate Quickly**
   - Fast refresh for most changes
   - Full reload for configuration changes
   - Hot reloading preserves app state

### Sharing with Team Members

1. **Generate Shareable Link**
   ```bash
   expo start --tunnel
   ```

2. **Share the URL**
   - Copy the `exp://` URL from terminal
   - Share with team members
   - They can open it in their Expo Go app

## 📚 Next Steps

Once you have Expo Go working:

1. **Explore the App**
   - Test all major features
   - Try different user flows
   - Test on different screen sizes

2. **Development**
   - Make changes and see them instantly
   - Use debugging tools for issues
   - Test new features as you build them

3. **Prepare for Production**
   - Follow the [Mobile Deployment Guide](./MOBILE_DEPLOYMENT.md)
   - Create production builds with EAS Build
   - Submit to app stores

## 🆘 Getting Help

If you encounter issues:

1. **Check the Logs**
   - Terminal output shows detailed errors
   - Expo Go app shows runtime errors

2. **Documentation**
   - [Expo Go Documentation](https://docs.expo.dev/get-started/expo-go/)
   - [Troubleshooting Guide](https://docs.expo.dev/troubleshooting/)

3. **Community Support**
   - [Expo Discord](https://chat.expo.dev/)
   - [Expo Forums](https://forums.expo.dev/)
   - [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

4. **Project Support**
   - Submit issues on GitHub
   - Contact the development team
   - Check project documentation

---

**Ready to start developing?** 🚀📱

Follow the [Quick Setup](#quick-setup) steps and start testing your mobile mechanic app in minutes!