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
5. **Repository Access**: Ensure you have access to the GitHub repository

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
   
   Add your environment variables:
   ```env
   EXPO_ACCESS_TOKEN="cBydYET0qZVmkVtGKQHFDGci0JKqW1QToRlzEMiS"
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

## 🔐 Repository Secret Configuration

**⚠️ IMPORTANT**: For automated deployments to work, the Expo access token must be configured as a GitHub repository secret.

### Required Repository Secret

- **Secret Name**: `EXPO_ACCESS_TOKEN`
- **Secret Value**: `cBydYET0qZVmkVtGKQHFDGci0JKqW1QToRlzEMiS`

### Setup Instructions

📖 **Detailed Setup Guide**: See [EXPO_TOKEN_SETUP.md](./EXPO_TOKEN_SETUP.md) for complete step-by-step instructions.

**Quick Setup**:
1. Go to Repository Settings → Secrets and Variables → Actions
2. Click "New repository secret"
3. Name: `EXPO_ACCESS_TOKEN`
4. Value: `cBydYET0qZVmkVtGKQHFDGci0JKqW1QToRlzEMiS`
5. Click "Add secret"

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
EXPO_ACCESS_TOKEN="cBydYET0qZVmkVtGKQHFDGci0JKqW1QToRlzEMiS"
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

For CI/CD pipeline, the following secrets must be configured in the GitHub repository:

**Required Secrets**:
- ✅ `EXPO_ACCESS_TOKEN` - **CONFIGURED** (`cBydYET0qZVmkVtGKQHFDGci0JKqW1QToRlzEMiS`)
- `EAS_PROJECT_ID` - Your EAS project identifier
- Other environment variables as needed

**Setup Instructions**:
1. Go to Repository Settings → Secrets and Variables → Actions
2. Add each secret with the corresponding value
3. Verify secrets are properly configured

📖 **Detailed Instructions**: See [EXPO_TOKEN_SETUP.md](./EXPO_TOKEN_SETUP.md)

## 🔄 CI/CD Pipeline

The mobile deployment pipeline automatically:

### On Pull Requests:
- ✅ Authenticates with Expo using `EXPO_ACCESS_TOKEN`
- ✅ Runs linting and tests
- ✅ Creates preview builds for iOS and Android
- ✅ Comments on PR with build status and download links

### On Main Branch:
- ✅ Authenticates with Expo using `EXPO_ACCESS_TOKEN`
- ✅ Creates production builds for app store submission
- ✅ Deploys OTA updates to existing installations
- ✅ Updates Expo dashboard with version information

### Workflow Status

🟢 **Ready**: The CI/CD pipeline is configured and ready to use once the repository secret is set up.

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

1. **Authentication Errors**
   ```
   Error: Authentication failed with Expo
   ```
   **Solution**: Verify the `EXPO_ACCESS_TOKEN` repository secret is correctly configured.

2. **Build Failures**
   ```bash
   # Clear cache and reinstall
   expo r -c
   rm -rf node_modules
   npm install
   ```

3. **Metro Bundler Issues**
   ```bash
   # Reset Metro cache
   npx expo start --clear
   ```

4. **EAS Build Issues**
   ```bash
   # Check build logs
   eas build:list
   eas build:view [build-id]
   ```

5. **Permission Issues**
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

# Test authentication (local only)
expo whoami
```

### Repository Secret Issues

If you encounter authentication issues in GitHub Actions:

1. **Verify Secret Name**: Must be exactly `EXPO_ACCESS_TOKEN`
2. **Check Secret Value**: Should be `cBydYET0qZVmkVtGKQHFDGci0JKqW1QToRlzEMiS`
3. **Review Workflow Logs**: Check Actions tab for detailed error messages
4. **Validate Permissions**: Ensure the token has necessary Expo project permissions

📖 **Detailed Troubleshooting**: See [EXPO_TOKEN_SETUP.md](./EXPO_TOKEN_SETUP.md#troubleshooting)

## 📚 Additional Resources

- [Expo Token Setup Guide](./EXPO_TOKEN_SETUP.md) - **NEW**: Complete token integration guide
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Router Documentation](https://expo.github.io/router/)
- [React Native Documentation](https://reactnative.dev/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## 🆘 Support

For deployment issues:
1. Check the [troubleshooting section](#troubleshooting)
2. Review the [Expo Token Setup Guide](./EXPO_TOKEN_SETUP.md)
3. Review build logs in Expo dashboard
4. Check GitHub Actions logs
5. Submit issues on GitHub
6. Contact the development team

---

**Ready to deploy your mobile mechanic app?** 🚀📱

**Next Steps**:
1. ✅ Set up the repository secret using [EXPO_TOKEN_SETUP.md](./EXPO_TOKEN_SETUP.md)
2. ✅ Test the deployment pipeline with a pull request
3. ✅ Monitor builds in the Expo dashboard
4. ✅ Deploy to app stores when ready

Start with the [Repository Secret Configuration](#repository-secret-configuration) and follow the step-by-step guide!