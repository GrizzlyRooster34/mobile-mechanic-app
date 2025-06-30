# Mobile Mechanic - Advanced Build Monitoring System

A comprehensive, continuous build monitoring system that provides real-time error detection, predictive failure analysis, and automated remediation for your Mobile Mechanic React Native/Expo application.

## 🚀 Quick Start

```bash
# Start the complete monitoring system
./scripts/build/monitor/start-monitoring.sh

# Or use the quick access command
./monitor start

# View the dashboard
open http://localhost:8080
```

## 📋 Table of Contents

- [Features](#features)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Monitoring Components](#monitoring-components)
- [CI/CD Integration](#cicd-integration)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

## ✨ Features

### 🔍 Real-time Error Detection
- **Metro Bundler Monitoring**: Detects bundling errors, module resolution issues, and syntax errors
- **TypeScript Compilation**: Monitors type errors, configuration issues, and dependency problems  
- **Native Build Monitoring**: Tracks Android Gradle and iOS Xcode build failures
- **Runtime Crash Detection**: Identifies memory leaks, unhandled exceptions, and performance issues

### 🤖 Automated Testing Integration
- **Multi-platform Test Matrices**: Automated testing across Android, iOS, and web platforms
- **Performance Benchmarking**: Build time analysis and optimization recommendations
- **Security Scanning**: Dependency vulnerability detection and reporting
- **Code Quality Analysis**: ESLint, TypeScript, and bundle size analysis

### 🛠️ Advanced Build Scripts
- **Pre-build Validation**: Comprehensive environment and dependency checking
- **Automated Error Recovery**: Intelligent error detection and recovery mechanisms
- **Build Artifact Verification**: Post-build validation and integrity checks
- **Multi-workflow Support**: Development, production, cloud, and full workflow modes

### 📊 Monitoring Dashboard
- **Real-time Metrics**: Live build status, error tracking, and performance monitoring
- **Historical Analytics**: Trend analysis, success rates, and failure pattern identification
- **Interactive Logs**: Filterable, searchable real-time log viewer
- **WebSocket Integration**: Live updates without page refresh

### 🔮 Predictive Analysis
- **Failure Prediction**: Machine learning-based build failure prediction
- **Risk Assessment**: Environmental and code complexity risk analysis
- **Automated Remediation**: Smart error recovery with success rate tracking
- **Pattern Recognition**: Historical failure pattern analysis and prevention

### 🔄 Continuous Integration
- **GitHub Actions Workflow**: Complete CI/CD pipeline with multi-platform builds
- **Automated Notifications**: Slack, Discord, and email integration
- **Build Matrices**: Parallel builds with comprehensive test coverage
- **Artifact Management**: Automated build storage and deployment

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Build Monitor Dashboard                   │
│                    (http://localhost:8080)                  │
└─────────────────────┬───────────────────────────────────────┘
                      │ WebSocket (ws://localhost:8081)
┌─────────────────────┴───────────────────────────────────────┐
│                Real-time Monitor                            │
│  • Metro bundler monitoring                                 │
│  • TypeScript compilation tracking                          │
│  • Native build monitoring                                  │
│  • Performance metrics collection                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│              Predictive Analyzer                            │
│  • Build failure prediction                                 │
│  • Pattern recognition                                      │
│  • Automated remediation                                    │
│  • Risk assessment                                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│              Build Automation                               │
│  • Pre-build validation                                     │
│  • Multi-platform builds                                    │
│  • Error recovery                                           │
│  • Post-build verification                                  │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Installation

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Expo CLI
- Platform-specific tools (Android SDK, Xcode for iOS)

### Setup

1. **Clone and install dependencies**:
```bash
cd mobile-app
npm install
```

2. **Install monitoring dependencies**:
```bash
cd scripts/build/monitor
npm install
```

3. **Make scripts executable**:
```bash
chmod +x scripts/build/*.sh
chmod +x scripts/build/monitor/*.sh
```

## 🎯 Usage

### Basic Commands

```bash
# Start monitoring system
./monitor start

# Stop monitoring system  
./monitor stop

# Restart monitoring system
./monitor restart

# Check monitoring status
./monitor status

# Open dashboard
./monitor dashboard
```

### Build Commands

```bash
# Development build with monitoring
./scripts/build.sh dev --platform android

# Production build with notifications
./scripts/build.sh prod --clean --notify --slack YOUR_WEBHOOK

# Full workflow with parallel builds
./scripts/build.sh full --parallel --email dev@company.com

# Cloud build with EAS
./scripts/build.sh cloud --platform ios --auto-submit
```

### Advanced Usage

```bash
# Start with custom configuration
ENABLE_PREDICTION=true ENABLE_AUTO_REMEDIATION=true ./monitor start

# Build with specific monitoring
./scripts/build/build-automation.sh --full-workflow --enable-monitoring --slack YOUR_WEBHOOK

# Archive logs when stopping
./scripts/build/monitor/stop-monitoring.sh --archive-logs
```

## 🔧 Monitoring Components

### 1. Real-time Monitor (`real-time-monitor.js`)

Continuously monitors build processes and provides immediate feedback:

- **Metro Bundler**: Watches for bundling errors, module resolution issues
- **TypeScript**: Monitors compilation errors and type issues  
- **Native Builds**: Tracks Android and iOS build processes
- **Performance**: Memory usage, CPU utilization, build times

### 2. Predictive Analyzer (`predictive-analyzer.js`)

Uses historical data to predict and prevent build failures:

- **Risk Assessment**: Analyzes environmental and code factors
- **Failure Prediction**: ML-based prediction with confidence scoring
- **Automated Remediation**: Smart error recovery strategies
- **Pattern Learning**: Continuous improvement from historical builds

### 3. Build Automation (`build-automation.sh`)

Comprehensive build orchestration with monitoring integration:

- **Pre-build Validation**: Environment, dependencies, configuration checks
- **Multi-platform Builds**: Android, iOS, parallel execution support
- **Error Recovery**: Automatic retry mechanisms and cache clearing
- **Post-build Verification**: Artifact validation and integrity checks

### 4. Dashboard Interface (`dashboard.html`)

Real-time web interface for monitoring:

- **Live Metrics**: Build status, error counts, performance data
- **Interactive Logs**: Real-time log streaming with filtering
- **Charts & Analytics**: Memory usage, error trends, build times
- **Control Panel**: Start/stop builds, clear caches, notifications

## 🔄 CI/CD Integration

### GitHub Actions Workflow

The system includes a comprehensive GitHub Actions workflow (`.github/workflows/continuous-integration.yml`) that provides:

#### Multi-stage Pipeline
1. **Setup & Validation**: Environment setup, dependency installation, pre-build checks
2. **Automated Testing**: Unit tests, integration tests, E2E test preparation
3. **Quality Analysis**: ESLint, TypeScript analysis, security scanning, bundle analysis
4. **Multi-platform Builds**: Parallel Android and iOS builds with EAS
5. **Build Verification**: Artifact validation and performance testing
6. **Deployment & Notifications**: Automated deployment and team notifications

#### Build Matrices
- **Platforms**: Android, iOS, or both
- **Build Types**: Development, preview, production
- **Test Suites**: Unit, integration, E2E preparation
- **Quality Checks**: Linting, type checking, security scanning

#### Notification Integration
- Slack webhooks for build status
- Email notifications for failures
- Discord integration for team updates
- Custom notification endpoints

### Triggering Builds

```bash
# Manual workflow dispatch
gh workflow run continuous-integration.yml \
  -f build_type=production \
  -f platform=all \
  -f enable_monitoring=true

# Automatic triggers
git push origin main  # Production build
git push origin develop  # Preview build
```

## ⚙️ Configuration

### Environment Variables

```bash
# Monitoring Configuration
ENABLE_MONITORING=true
ENABLE_PREDICTION=true  
ENABLE_AUTO_REMEDIATION=false
LOG_LEVEL=info
WS_PORT=8081

# Notification Settings
SLACK_WEBHOOK=https://hooks.slack.com/services/...
DISCORD_WEBHOOK=https://discord.com/api/webhooks/...
EMAIL_NOTIFICATIONS=dev@company.com

# Build Configuration
MAX_MEMORY_USAGE=2048
MAX_BUILD_TIME=1800
MONITOR_INTERVAL=10
```

### Build Profiles (eas.json)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "env": { "NODE_ENV": "development" }
    },
    "preview": {
      "distribution": "internal", 
      "env": { "NODE_ENV": "staging" }
    },
    "production": {
      "env": { "NODE_ENV": "production" }
    }
  }
}
```

### Monitoring Configuration

Create `scripts/build/monitor/config.json`:

```json
{
  "realTimeMonitor": {
    "enableWebSocket": true,
    "wsPort": 8081,
    "maxLogSize": 10485760,
    "enableNotifications": false
  },
  "predictiveAnalyzer": {
    "confidence": 0.7,
    "maxHistoryEntries": 1000,
    "enablePrediction": true,
    "enableAutoRemediation": false
  },
  "buildAutomation": {
    "maxMemoryUsage": 2048,
    "maxBuildTime": 1800,
    "monitorInterval": 10,
    "enableParallelBuilds": false
  }
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using ports 8080/8081
lsof -i :8080
lsof -i :8081

# Kill processes if needed
./scripts/build/monitor/stop-monitoring.sh --force
```

#### 2. WebSocket Connection Fails
```bash
# Check if real-time monitor is running
./monitor status

# Restart monitoring system
./monitor restart

# Check firewall settings
sudo ufw status
```

#### 3. Build Automation Fails
```bash
# Check logs
tail -f logs/build-automation.log

# Run with verbose logging
LOG_LEVEL=debug ./scripts/build.sh dev

# Validate environment
./scripts/build/build-automation.sh --help
```

#### 4. Predictive Analyzer Issues
```bash
# Check prediction logs
tail -f logs/monitor/predictive-analyzer.log

# Reset build history
rm -f logs/build-history.json

# Disable auto-remediation
ENABLE_AUTO_REMEDIATION=false ./monitor restart
```

### Debug Mode

Enable detailed logging for troubleshooting:

```bash
# Enable debug logging
LOG_LEVEL=debug ./monitor start

# Verbose build output
./scripts/build.sh dev --platform android --verbose

# Monitor system resources
htop  # or top on macOS
```

### Log Files

Important log locations:
- `logs/build-automation.log` - Build process logs
- `logs/monitor/real-time-monitor.log` - Real-time monitoring logs  
- `logs/monitor/predictive-analyzer.log` - Prediction and remediation logs
- `logs/builds/` - Individual build logs with timestamps

## 📚 API Reference

### Real-time Monitor WebSocket API

Connect to `ws://localhost:8081` to receive real-time events:

#### Events Sent

```javascript
// Metro bundler output
{
  "type": "metro-output",
  "data": "Metro bundler message",
  "severity": "error|warning|info", 
  "timestamp": "2024-01-01T00:00:00.000Z",
  "isError": false
}

// TypeScript compilation
{
  "type": "typescript-output", 
  "data": "TypeScript message",
  "severity": "error|warning|info",
  "timestamp": "2024-01-01T00:00:00.000Z"
}

// Error detection
{
  "type": "error",
  "data": {
    "id": "1234567890",
    "source": "metro|typescript|android|ios",
    "message": "Error description", 
    "severity": "critical|high|medium|low",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "recovered": false
  }
}

// Build metrics
{
  "type": "metrics-update",
  "data": {
    "uptime": 123456,
    "errors": [],
    "warnings": [],
    "performance": {
      "memory": { "heapUsed": 123456789 },
      "cpu": { "cpuPercent": 45.6 }
    }
  }
}
```

### Predictive Analyzer API

#### Events Emitted

```javascript
// Failure prediction
analyzer.on('failure-predicted', (data) => {
  console.log('Risk:', data.risk);
  console.log('Factors:', data.factors);
  console.log('Recommendations:', data.recommendations);
});

// Remediation completed
analyzer.on('remediation-completed', (data) => {
  console.log('Success:', data.success);
  console.log('Results:', data.results);
});
```

#### Methods

```javascript
const analyzer = new PredictiveBuildAnalyzer();

// Start monitoring
analyzer.startMonitoring();

// Get health report  
const report = analyzer.getHealthReport();

// Predict build outcome
const prediction = analyzer.getFailurePrediction(buildData);

// Stop monitoring
analyzer.stopMonitoring();
```

### Build Automation Scripts

#### Command Line Interface

```bash
# Basic usage
./scripts/build/build-automation.sh [OPTIONS] [WORKFLOW]

# Options
--platform android|ios|all
--build-type development|preview|production
--clean                     # Clean build artifacts
--skip-validation          # Skip pre-build validation  
--disable-monitoring       # Disable build monitoring
--notify                   # Enable notifications
--email EMAIL              # Email notifications
--slack WEBHOOK            # Slack notifications  
--discord WEBHOOK          # Discord notifications
--parallel                 # Parallel builds

# Workflows
--dev-workflow            # Development workflow
--prod-workflow           # Production workflow  
--cloud-workflow          # Cloud build workflow
--full-workflow           # Complete end-to-end workflow
```

#### Return Codes

- `0` - Success
- `1` - General error
- `2` - Pre-build validation failed
- `3` - Build failed  
- `4` - Post-build verification failed
- `5` - Notification failed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Test your changes with the monitoring system
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Development Guidelines

- All build scripts should include proper error handling
- Add monitoring integration for new build processes
- Update predictive patterns for new error types
- Include tests for new automation features
- Document configuration changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/mobile-mechanic-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/mobile-mechanic-app/discussions)
- **Documentation**: [Wiki](https://github.com/yourusername/mobile-mechanic-app/wiki)

---

**Built with ❤️ for the Mobile Mechanic team**

This monitoring system is designed to provide comprehensive build oversight, predictive failure detection, and automated remediation to ensure reliable and efficient mobile app development workflows.