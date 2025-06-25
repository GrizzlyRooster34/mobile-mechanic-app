# 🔧 Heinicus Mobile Mechanic App

A comprehensive mobile and web application for connecting customers with professional mechanics, featuring AI-powered assistance, real-time communication, and seamless payment processing.

## 🚀 Features

### 🌐 Multi-Platform Support
- **Web Application** - Full-featured web interface
- **Mobile App** - Native iOS and Android apps via Expo Go
- **Responsive Design** - Optimized for all screen sizes
- **Cross-Platform Sync** - Seamless data synchronization

### 🤖 AI-Powered Assistance
- **Customer Support Agent** - 24/7 intelligent customer assistance
- **Mechanic Assistant** - Technical guidance and diagnostic support
- **Smart Recommendations** - Personalized service suggestions
- **Natural Language Processing** - Conversational AI interactions

### 📱 Mobile-First Experience
- **Expo Go Integration** - Instant testing and deployment
- **Native Performance** - Optimized for mobile devices
- **Offline Capabilities** - Core features work without internet
- **Push Notifications** - Real-time updates and alerts

### 💳 Integrated Payments
- **Stripe Integration** - Secure payment processing
- **Multiple Payment Methods** - Cards, digital wallets, and more
- **Transparent Pricing** - Clear cost breakdowns
- **Automated Billing** - Streamlined payment workflows

## 🛠 Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React Native** - Mobile app development
- **Expo SDK 50** - Cross-platform mobile framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **NativeWind** - Tailwind for React Native

### Backend
- **tRPC** - End-to-end typesafe APIs
- **Prisma** - Database ORM and migrations
- **PostgreSQL** - Robust relational database
- **NextAuth.js** - Authentication and session management

### AI & Services
- **Abacus.AI** - AI agent platform
- **Stripe** - Payment processing
- **Expo EAS** - Build and deployment services

### DevOps & Deployment
- **GitHub Actions** - CI/CD pipeline
- **EAS Build** - Mobile app builds
- **EAS Update** - Over-the-air updates
- **Vercel** - Web app hosting (optional)

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - JavaScript runtime
- **npm or yarn** - Package manager
- **Git** - Version control
- **Expo CLI** - Mobile development tools
- **PostgreSQL** - Database server

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/GrizzlyRooster34/mobile-mechanic-app.git
   cd mobile-mechanic-app
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   DATABASE_URL="your-postgresql-connection-string"
   NEXTAUTH_SECRET="your-nextauth-secret"
   EXPO_ACCESS_TOKEN="cBydYET0qZVmkVtGKQHFDGci0JKqW1QToRlzEMiS"
   # ... other variables
   ```

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start Development**
   ```bash
   # Web development
   npm run dev
   
   # Mobile development
   npm run mobile
   ```

## 📱 Mobile Development

### Expo Go Setup

1. **Install Expo Go**
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Start Mobile Development**
   ```bash
   npm run mobile
   ```

3. **Test on Device**
   - Scan QR code with Expo Go app
   - App loads instantly on your device

### Mobile Commands

```bash
# Start development server
npm run mobile

# Platform-specific development
npm run ios          # iOS Simulator
npm run android      # Android Emulator

# Build commands
npm run build:android    # Android build
npm run build:ios        # iOS build
npm run update          # OTA update
```

## 🔐 Repository Configuration

### Required GitHub Secrets

For automated mobile deployments, configure these repository secrets:

**Essential Secret**:
- `EXPO_ACCESS_TOKEN` = `cBydYET0qZVmkVtGKQHFDGci0JKqW1QToRlzEMiS`

**Setup Instructions**:
1. Go to Repository Settings → Secrets and Variables → Actions
2. Click "New repository secret"
3. Add the secret with the exact name and value above

📖 **Detailed Setup**: See [docs/EXPO_TOKEN_SETUP.md](docs/EXPO_TOKEN_SETUP.md)

## 🏗 Deployment

### Web Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Mobile Deployment

```bash
# Development builds
eas build --profile development

# Production builds
eas build --profile production

# Over-the-air updates
eas update --branch production
```

### Automated Deployment

The CI/CD pipeline automatically:
- ✅ **Pull Requests**: Creates preview builds
- ✅ **Main Branch**: Deploys production builds and OTA updates
- ✅ **Quality Checks**: Runs linting, tests, and type checking

## 📚 Documentation

### Setup Guides
- [📱 Mobile Deployment](docs/MOBILE_DEPLOYMENT.md) - Complete mobile setup guide
- [🔐 Expo Token Setup](docs/EXPO_TOKEN_SETUP.md) - Repository secret configuration
- [📲 Expo Go Setup](docs/EXPO_GO_SETUP.md) - Quick start with Expo Go
- [⚙️ Setup Guide](docs/SETUP_GUIDE.md) - General application setup

### Technical Documentation
- [🤖 AI Integration](docs/AI_INTEGRATION_README.md) - AI agents and services
- [📡 API Documentation](docs/API_DOCUMENTATION.md) - tRPC API reference
- [🐛 Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

## 🧪 Testing

### Web Testing
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run type-check
```

### Mobile Testing
```bash
# Test with Expo Go
npm run mobile

# Run on simulators
npm run ios
npm run android

# Validate configuration
expo doctor
```

## 🤝 Contributing

1. **Fork the Repository**
2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make Changes**
4. **Test Thoroughly**
   - Web: `npm run dev`
   - Mobile: `npm run mobile`
5. **Submit Pull Request**

### Development Workflow

1. **Local Development**
   - Make changes to code
   - Test on web and mobile
   - Ensure all tests pass

2. **Pull Request**
   - Automated preview builds
   - Code review process
   - CI/CD validation

3. **Deployment**
   - Merge to main branch
   - Automated production deployment
   - OTA updates for mobile

## 🔧 Configuration

### Environment Variables

See [.env.example](.env.example) for all required environment variables.

**Key Variables**:
- `EXPO_ACCESS_TOKEN` - Mobile deployment authentication
- `DATABASE_URL` - PostgreSQL connection
- `NEXTAUTH_SECRET` - Authentication secret
- `STRIPE_SECRET_KEY` - Payment processing
- `ABACUS_AI_API_KEY` - AI services

### Mobile Configuration

- **app.config.js** - Expo app configuration
- **eas.json** - Build and deployment settings
- **metro.config.js** - Metro bundler configuration

## 📊 Project Status

### ✅ Completed Features
- ✅ Web application with Next.js
- ✅ Mobile app with Expo integration
- ✅ AI-powered customer support
- ✅ Stripe payment integration
- ✅ Database schema and API
- ✅ CI/CD pipeline for mobile deployment
- ✅ Comprehensive documentation

### 🚧 In Progress
- 🚧 Advanced mobile features (camera, location)
- 🚧 Push notifications
- 🚧 Offline functionality
- 🚧 App store submissions

### 📋 Planned Features
- 📋 Real-time chat system
- 📋 Advanced analytics dashboard
- 📋 Multi-language support
- 📋 Advanced AI diagnostics

## 🆘 Support

### Getting Help

1. **Documentation** - Check the [docs](docs/) directory
2. **Issues** - Submit GitHub issues for bugs
3. **Discussions** - Use GitHub Discussions for questions
4. **Email** - Contact the development team

### Common Issues

- **Mobile Build Failures** - See [EXPO_TOKEN_SETUP.md](docs/EXPO_TOKEN_SETUP.md)
- **Database Connection** - Check DATABASE_URL configuration
- **Authentication Issues** - Verify NEXTAUTH_SECRET setup
- **Payment Problems** - Confirm Stripe key configuration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Expo Team** - Amazing mobile development platform
- **Next.js Team** - Excellent React framework
- **Abacus.AI** - Powerful AI agent platform
- **Stripe** - Reliable payment processing
- **Open Source Community** - Countless helpful libraries

---

**🚀 Ready to revolutionize mobile mechanic services?**

Start with the [Quick Start](#quick-start) guide and check out the [mobile deployment documentation](docs/MOBILE_DEPLOYMENT.md) to get your app running on devices in minutes!

**📱 Mobile-First • 🤖 AI-Powered • 💳 Payment-Ready • 🔧 Mechanic-Focused**