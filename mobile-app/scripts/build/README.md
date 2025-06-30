# Mobile Mechanic App - Build Scripts

This directory contains comprehensive, bulletproof build scripts that guarantee successful local and cloud builds for the Mobile Mechanic App.

## Scripts Overview

### 1. Pre-build Validation (`pre-build-validation.sh`)
Validates all prerequisites before starting any build process.

**Features:**
- Checks required tools (Node.js, NPM, EAS CLI)
- Validates configuration files (package.json, app.json, eas.json)
- Verifies network connectivity
- Checks disk space and dependencies
- Validates Expo configuration structure

**Usage:**
```bash
./scripts/build/pre-build-validation.sh
```

### 2. Local Development Build (`local-build-dev.sh`)
Builds the app locally for development with debugging enabled.

**Features:**
- Development environment setup
- Local and EAS build support
- Clean build option
- Build verification
- APK/IPA generation

**Usage:**
```bash
./scripts/build/local-build-dev.sh [OPTIONS]

Options:
  -p, --platform PLATFORM    Platform (android|ios|all)
  -c, --clean                 Clean build
  -s, --skip-validation      Skip pre-build validation
  -h, --help                 Show help

Examples:
  ./scripts/build/local-build-dev.sh --platform android
  ./scripts/build/local-build-dev.sh --platform all --clean
```

### 3. Local Production Build (`local-build-prod.sh`)
Builds the app locally for production with optimizations enabled.

**Features:**
- Production environment setup
- Bundle optimization and minification
- Version number management
- AAB/IPA generation for stores
- Comprehensive verification

**Usage:**
```bash
./scripts/build/local-build-prod.sh [OPTIONS]

Options:
  -p, --platform PLATFORM    Platform (android|ios|all)
  -c, --clean                 Clean build
  -b, --build-number NUMBER   Override build number
  -v, --version VERSION       Override version number
  -s, --skip-validation      Skip pre-build validation
  -h, --help                 Show help

Examples:
  ./scripts/build/local-build-prod.sh --platform android
  ./scripts/build/local-build-prod.sh --clean --version 1.0.1
```

### 4. Cloud Build with EAS (`cloud-build-eas.sh`)
Manages cloud builds using Expo Application Services.

**Features:**
- EAS authentication verification
- Build monitoring and retry mechanisms
- Artifact downloading
- Auto-submission to stores
- Build queue management

**Usage:**
```bash
./scripts/build/cloud-build-eas.sh [OPTIONS]

Options:
  -p, --platform PLATFORM    Platform (android|ios|all)
  -r, --profile PROFILE      Build profile (development|preview|production)
  -a, --auto-submit          Auto-submit to stores
  -n, --no-wait              Don't wait for completion
  -m, --max-retries COUNT    Maximum retry attempts
  -d, --retry-delay SECONDS  Delay between retries
  -h, --help                 Show help

Examples:
  ./scripts/build/cloud-build-eas.sh --platform android --profile production
  ./scripts/build/cloud-build-eas.sh --platform all --auto-submit
```

### 5. Post-build Verification (`post-build-verification.sh`)
Verifies build outputs, checks app functionality, and generates reports.

**Features:**
- Artifact integrity verification
- Deep APK/AAB/IPA analysis
- Performance checks (file size validation)
- Security scans
- Comprehensive reporting

**Usage:**
```bash
./scripts/build/post-build-verification.sh [OPTIONS]

Options:
  -p, --platform PLATFORM    Platform (android|ios|all)
  -t, --type TYPE            Build type (development|production)
  -d, --deep                 Deep verification (APK/IPA analysis)
  -f, --performance          Performance checks
  -s, --security             Security scans
  -h, --help                 Show help

Examples:
  ./scripts/build/post-build-verification.sh --platform android --deep
  ./scripts/build/post-build-verification.sh --platform all --performance --security
```

### 6. Build Automation (`build-automation.sh`)
Orchestrates complete build workflows with error recovery and monitoring.

**Features:**
- Pre-defined workflows (dev, prod, cloud, full)
- Error recovery and retry mechanisms
- Notification system (email, Slack)
- Comprehensive reporting
- Artifact management

**Usage:**
```bash
./scripts/build/build-automation.sh [OPTIONS]

Workflow Types:
  --dev-workflow              Development build workflow
  --prod-workflow             Production build workflow
  --cloud-workflow            Cloud build workflow
  --full-workflow             End-to-end workflow

Options:
  -p, --platform PLATFORM     Platform (android|ios|all)
  -c, --clean                 Clean build
  --notify                    Send notifications
  --email EMAIL               Email for notifications
  --slack WEBHOOK             Slack webhook URL
  -h, --help                  Show help

Examples:
  ./scripts/build/build-automation.sh --dev-workflow --platform android
  ./scripts/build/build-automation.sh --prod-workflow --clean --notify
  ./scripts/build/build-automation.sh --full-workflow --email dev@company.com
```

### 7. Dependency Installation (`install-dependencies.sh`)
Ensures all required tools and dependencies are properly installed.

**Features:**
- System requirements validation
- Project dependency installation
- Global tool installation (EAS CLI, Expo CLI)
- Android SDK setup (Linux/macOS)
- iOS development tools (macOS only)

**Usage:**
```bash
./scripts/build/install-dependencies.sh [OPTIONS]

Options:
  -f, --force                 Force reinstall all dependencies
  -a, --android               Install Android tools
  -i, --ios                   Install iOS tools (macOS only)
  -g, --global                Install global tools
  -h, --help                  Show help

Examples:
  ./scripts/build/install-dependencies.sh
  ./scripts/build/install-dependencies.sh --force --global
  ./scripts/build/install-dependencies.sh --android --ios --global
```

## Quick Start Guide

### 1. Initial Setup
```bash
# Make all scripts executable
chmod +x scripts/build/*.sh

# Install dependencies and tools
./scripts/build/install-dependencies.sh --global --android

# Validate environment
./scripts/build/pre-build-validation.sh
```

### 2. Development Build
```bash
# Quick development build
./scripts/build/build-automation.sh --dev-workflow --platform android

# Or manual steps
./scripts/build/local-build-dev.sh --platform android
./scripts/build/post-build-verification.sh --platform android --type development
```

### 3. Production Build
```bash
# Complete production workflow
./scripts/build/build-automation.sh --prod-workflow --platform all --clean

# Or manual steps
./scripts/build/local-build-prod.sh --platform all --clean
./scripts/build/post-build-verification.sh --platform all --type production --deep --performance --security
```

### 4. Cloud Build
```bash
# Cloud build with EAS
./scripts/build/build-automation.sh --cloud-workflow --platform all --auto-submit

# Or manual cloud build
./scripts/build/cloud-build-eas.sh --platform all --profile production --auto-submit
```

## Build Outputs

All build outputs are organized as follows:

```
mobile-app/
├── builds/                     # Downloaded build artifacts
│   ├── mobile-mechanic-*.apk   # Android APK files
│   ├── mobile-mechanic-*.aab   # Android AAB files
│   └── mobile-mechanic-*.ipa   # iOS IPA files
├── scripts/build/
│   ├── *.log                   # Build logs
│   ├── *-report.txt           # Build reports
│   └── artifacts.list         # Artifact catalog
└── android/app/build/         # Local Android builds
```

## Environment Variables

The scripts automatically set up the following environment variables:

### Development Builds
- `NODE_ENV=development`
- `EXPO_DEBUG=true`
- `DEBUG=1`

### Production Builds
- `NODE_ENV=production`
- `EXPO_DEBUG=false`
- `DEBUG=0`
- `EXPO_OPTIMIZE=true`
- `EXPO_MINIFY=true`

### Android Development (if tools installed)
- `ANDROID_HOME=/path/to/android-sdk`
- `ANDROID_SDK_ROOT=/path/to/android-sdk`
- `PATH` includes Android tools

## Error Handling

All scripts include comprehensive error handling:

- **Validation Errors**: Pre-build validation catches configuration issues
- **Build Errors**: Automatic retry mechanisms with exponential backoff
- **Network Errors**: Connectivity checks and retry logic
- **Disk Space**: Automatic cleanup of old artifacts
- **Dependency Issues**: Automatic dependency verification and repair

## Logging and Monitoring

### Log Files
- `validation.log` - Pre-build validation logs
- `dev-build.log` - Development build logs
- `prod-build.log` - Production build logs
- `cloud-build.log` - Cloud build logs
- `verification.log` - Post-build verification logs
- `automation.log` - Workflow automation logs

### Reports
- `dev-build-report.txt` - Development build summary
- `prod-build-report.txt` - Production build summary
- `cloud-build-report.txt` - Cloud build summary
- `verification-report.txt` - Verification results
- `workflow-report.txt` - Complete workflow summary

## Notifications

The build automation script supports notifications via:

### Email
```bash
./scripts/build/build-automation.sh --prod-workflow --email dev@company.com
```

### Slack
```bash
./scripts/build/build-automation.sh --prod-workflow --slack https://hooks.slack.com/...
```

## Platform-Specific Notes

### Linux/WSL
- Supports Android development with automatic SDK installation
- Uses EAS for iOS builds
- All scripts tested on Ubuntu/Debian

### macOS
- Full iOS and Android development support
- Automatic Xcode tools installation
- CocoaPods setup for iOS dependencies

### Android Requirements
- Java 11+ (automatically installed on Linux)
- Android SDK (automatically configured)
- Platform tools and build tools

### iOS Requirements (macOS only)
- Xcode command line tools
- CocoaPods
- Xcode (for full development)

## Troubleshooting

### Common Issues

1. **Node.js Version**: Ensure Node.js 18+ is installed
2. **Disk Space**: Keep at least 5GB free space
3. **Network**: Ensure stable internet for downloads
4. **Permissions**: Run `chmod +x scripts/build/*.sh` if needed

### EAS Authentication
```bash
# Login to EAS
npx eas login

# Check authentication
npx eas whoami
```

### Android SDK Issues
```bash
# Reinstall Android tools
./scripts/build/install-dependencies.sh --force --android

# Check environment
echo $ANDROID_HOME
```

### Clean Everything
```bash
# Complete clean and reinstall
./scripts/build/install-dependencies.sh --force
./scripts/build/build-automation.sh --prod-workflow --clean
```

## Best Practices

1. **Always validate before building**: Use pre-build validation
2. **Use clean builds for production**: Include `--clean` flag
3. **Verify all builds**: Run post-build verification
4. **Monitor cloud builds**: Use build monitoring features
5. **Keep artifacts organized**: Use the builds directory
6. **Check logs regularly**: Review log files for issues
7. **Update tools regularly**: Keep EAS CLI and Expo CLI updated

## Security Considerations

- Scripts validate file integrity before processing
- Security scans check for common vulnerabilities
- Production builds disable debug flags
- Sensitive data is excluded from logs
- Build artifacts are verified before distribution

---

For issues or questions, check the log files first, then review the troubleshooting section above.