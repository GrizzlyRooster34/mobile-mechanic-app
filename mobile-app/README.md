# Heinicus Mobile Mechanic - Mobile App

A comprehensive React Native mobile application for the Heinicus Mobile Mechanic platform, featuring AI-powered customer support and mechanic assistance.

## 🚀 Features

### Customer Features
- **Service Booking**: Easy-to-use service request system
- **Real-time Tracking**: Track mechanic location and service progress
- **AI Customer Support**: Intelligent chatbot for instant assistance
- **Payment Integration**: Secure Stripe payment processing
- **Vehicle Management**: Add and manage multiple vehicles
- **Service History**: View past services and receipts
- **Maintenance Reminders**: Automated maintenance scheduling

### Mechanic Features
- **Job Management**: Accept, track, and complete service requests
- **AI Assistant**: Diagnostic help, parts lookup, and repair guidance
- **Navigation**: Integrated GPS navigation to customer locations
- **Earnings Tracking**: Real-time earnings and performance metrics
- **Schedule Management**: View and manage daily appointments
- **Customer Communication**: Direct messaging with customers

### Admin Features
- **Dashboard**: Comprehensive platform analytics
- **User Management**: Manage customers and mechanics
- **Service Monitoring**: Oversee all active services
- **Financial Reports**: Revenue and payment tracking

## 🛠 Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **State Management**: Zustand
- **API**: tRPC with React Query
- **UI Components**: Custom components with React Native
- **Storage**: AsyncStorage + Expo SecureStore
- **Location**: Expo Location
- **Camera**: Expo Camera & Image Picker
- **Notifications**: Expo Notifications
- **Payments**: Stripe React Native SDK
- **AI Integration**: Abacus.AI

## 📱 Installation

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/GrizzlyRooster34/mobile-mechanic-app.git
cd mobile-mechanic-app/mobile-app
```

2. **Install dependencies**
```bash
npm install --legacy-peer-deps
```

3. **Environment Configuration**
```bash
cp .env.example .env
```

4. **Start the development server**
```bash
npm start
```

5. **Run on device/simulator**
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## ✅ Feature Parity Achieved

This mobile app now has **100% feature parity** with the main web application, including:

- All AI agent functionality
- Complete API integration
- Full payment processing
- Real-time location services
- Camera and media handling
- Push notifications
- Multi-role authentication
- Comprehensive dashboards for all user types

---

**Ready to revolutionize mobile mechanic services?** 🚗📱