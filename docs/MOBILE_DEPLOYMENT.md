# Mobile Deployment Guide

This guide covers the complete setup and deployment process for the Heinicus Mobile Mechanic app using Expo Go and EAS Build.

## 📱 Overview

The mobile version of the Heinicus Mobile Mechanic app is built using:
- **Expo SDK 50** - Cross-platform development framework
- **Expo Router** - File-based navigation system
- **EAS Build** - Cloud build service
- **EAS Update** - Over-the-air updates
- **React Native** - Mobile app framework
- **NativeWind** - Tailwind CSS for React Native

## 🚀 Quick Start

### Prerequisites

1. **Expo Account**: Create an account at [expo.dev](https://expo.dev)
2. **Expo CLI**: Install globally
   ```bash
   npm install -g @expo/cli eas-cli
   ```
3. **Mobile Device**: iOS/Android device with Expo Go app installed
4. **Development Environment**: Node.js 18+, Git

### Initial Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/GrizzlyRooster34/mobile-mechanic-app.git
   cd mobile-mechanic-app
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Expo access token:
   ```env
   EXPO_ACCESS_TOKEN="your-expo-access-token"
   EAS_PROJECT_ID="your-eas-project-id"
   ```

3. **Login to Expo**
   ```bash
   expo login
   ```

4. **Initialize EAS**
   ```bash
   eas init
   ```

## 📋 Configuration Files

### app.config.js
Main Expo configuration file containing:
- App metadata (name, version, description)
- Platform-specific settings (iOS/Android)
- Permissions and capabilities
- Build and deployment settings

### eas.json
EAS Build and Submit configuration:
- Build profiles (development, preview, production)
- Platform-specific build settings
- Update channels configuration

### metro.config.js
Metro bundler configuration for:
- Web compatibility
- Asset handling
- TypeScript support
- NativeWind integration

## 🛠 Development Workflow

### Local Development

1. **Start Development Server**
   ```bash
   npm run mobile
   ```

2. **Platform-Specific Development**
   ```bash
   # iOS Simulator
   npm run ios
   
   # Android Emulator
   npm run android
   
   # Web Browser
   npm run preview
   ```

3. **Tunnel Mode (for physical devices)**
   ```bash
   npm run mobile:tunnel
   ```

### Testing on Physical Devices

1. **Install Expo Go**
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Scan QR Code**
   - Run `npm run mobile`
   - Scan QR code with Expo Go app
   - App will load on your device

## 🏗 Building and Deployment

### Development Builds

```bash
# Build for internal testing
eas build --profile development --platform all
```

### Preview Builds

```bash
# Build for stakeholder review
eas build --profile preview --platform all
```

### Production Builds

```bash
# Build for app stores
eas build --profile production --platform all
```

### Over-the-Air Updates

```bash
# Push updates without rebuilding
eas update --branch production --message "Bug fixes and improvements"
```

## 📱 App Store Deployment

### iOS App Store

1. **Build for iOS**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Submit to App Store**
   ```bash
   eas submit --platform ios
   ```

### Google Play Store

1. **Build for Android**
   ```bash
   eas build --platform android --profile production
   ```

2. **Submit to Play Store**
   ```bash
   eas submit --platform android
   ```

## 🔧 Environment Variables

### Required Variables

```env
# Expo Configuration
EXPO_ACCESS_TOKEN="your-expo-access-token"
EAS_PROJECT_ID="your-eas-project-id"

# App Configuration
APP_SCHEME="heinicus-mobile-mechanic"
APP_VERSION="1.0.0"

# API Configuration
API_BASE_URL="https://your-api-domain.com"
WEB_URL="https://your-web-domain.com"

# Database (for API calls)
DATABASE_URL="your-database-url"

# AI Services
ABACUS_AI_API_KEY="your-abacus-ai-api-key"
CUSTOMER_SUPPORT_AGENT_ID="your-agent-id"
MECHANIC_ASSISTANT_AGENT_ID="your-agent-id"

# Payment Processing
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_key"
```

### GitHub Secrets

For CI/CD pipeline, add these secrets to your GitHub repository:

1. Go to Repository Settings → Secrets and Variables → Actions
2. Add the following secrets:
   - `EXPO_ACCESS_TOKEN`
   - `EAS_PROJECT_ID`
   - Other environment variables as needed

## 🔄 CI/CD Pipeline

The mobile deployment pipeline automatically:

1. **On Pull Requests**:
   - Runs linting and tests
   - Creates preview builds
   - Comments on PR with build status

2. **On Main Branch**:
   - Creates production builds
   - Deploys OTA updates
   - Submits to app stores (if configured)

## 📊 Monitoring and Analytics

### Expo Dashboard
- Build status and logs
- Update deployment status
- Crash reports and analytics
- User engagement metrics

### Error Tracking
- Integrated with Expo's error reporting
- Custom error boundaries for graceful failures
- Performance monitoring

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and reinstall
   expo r -c
   rm -rf node_modules
   npm install
   ```

2. **Metro Bundler Issues**
   ```bash
   # Reset Metro cache
   npx expo start --clear
   ```

3. **EAS Build Issues**
   ```bash
   # Check build logs
   eas build:list
   eas build:view [build-id]
   ```

4. **Permission Issues**
   - Ensure all required permissions are declared in `app.config.js`
   - Test permissions on physical devices

### Debug Commands

```bash
# Check Expo configuration
expo doctor

# Validate EAS configuration
eas build:configure

# Check build status
eas build:list --status=finished

# View update history
eas update:list
```

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Router Documentation](https://expo.github.io/router/)
- [React Native Documentation](https://reactnative.dev/)
- [NativeWind Documentation](https://www.nativewind.dev/)

## 🆘 Support

For deployment issues:
1. Check the [troubleshooting section](#troubleshooting)
2. Review build logs in Expo dashboard
3. Submit issues on GitHub
4. Contact the development team

---

**Ready to deploy your mobile mechanic app?** 🚀📱

Start with the [Quick Start](#quick-start) section and follow the step-by-step guide!