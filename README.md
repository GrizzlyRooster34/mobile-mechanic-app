# Heinicus Mobile Mechanic App - AI Integration

A comprehensive AI-powered mobile mechanic service platform with integrated customer support and mechanic assistant agents.

## 🚀 Features

### Customer Support Agent
- **Appointment Booking**: Intelligent scheduling assistance
- **Service Status Updates**: Real-time job tracking
- **Pricing Information**: Instant cost estimates
- **Troubleshooting**: Basic diagnostic help
- **Payment Support**: Billing and payment assistance
- **Emergency Routing**: Urgent issue escalation

### Mechanic Assistant Agent
- **Diagnostic Assistance**: AI-powered problem diagnosis
- **Parts Identification**: Automated parts lookup and specifications
- **Repair Procedures**: Step-by-step repair guidance
- **VIN Decoding**: Vehicle information extraction
- **Safety Guidance**: Real-time safety alerts and PPE recommendations
- **Maintenance Schedules**: Automated maintenance planning

### Core Platform
- **Real-time Job Tracking**: Start/pause/stop functionality
- **Signature Capture**: Digital job completion
- **Stripe Integration**: Secure payment processing
- **Mobile-First Design**: PWA-ready responsive interface
- **Session Management**: Context-aware conversations

## 🛠 Tech Stack

- **Frontend**: Next.js 13, React 18, TypeScript
- **Backend**: tRPC, Prisma ORM
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **AI Integration**: Abacus.AI
- **Payments**: Stripe
- **Authentication**: NextAuth.js
- **Database**: PostgreSQL (configurable)

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- Abacus.AI account with API access
- Stripe account for payments

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/GrizzlyRooster34/mobile-mechanic-app.git
cd mobile-mechanic-app
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Configure your environment variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/heinicus_mobile_mechanic"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# AI Agents
ABACUS_AI_API_KEY="your-abacus-ai-api-key"
CUSTOMER_SUPPORT_AGENT_ID="c816aa206"
MECHANIC_ASSISTANT_AGENT_ID="your-mechanic-assistant-agent-id"

# Stripe
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
```

### 3. Database Setup

```bash
npx prisma generate
npx prisma db push
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📖 Documentation

- **[AI Integration Guide](docs/AI_INTEGRATION_README.md)** - Comprehensive integration documentation
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Detailed API reference
- **[Setup Guide](docs/SETUP_GUIDE.md)** - Step-by-step setup instructions
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## 🔧 Usage Examples

### Customer Support Integration

```tsx
import { CustomerSupportWidget } from '~/components/chat/CustomerSupportWidget';

function CustomerPage() {
  return (
    <div>
      <CustomerSupportWidget
        customerId="customer-123"
        context={{
          vehicleInfo: {
            make: "Toyota",
            model: "Camry",
            year: 2020
          }
        }}
        onActionRequired={(action) => {
          if (action.type === 'booking') {
            // Handle appointment booking
          }
        }}
      />
    </div>
  );
}
```

### Mechanic Assistant Integration

```tsx
import { MechanicAssistantWidget } from '~/components/chat/MechanicAssistantWidget';

function MechanicDashboard() {
  return (
    <div>
      <MechanicAssistantWidget
        mechanicId="mechanic-456"
        context={{
          currentJob: {
            vehicleInfo: { make: "Honda", model: "Civic", year: 2019 },
            symptoms: ["engine noise", "rough idle"]
          }
        }}
        onDiagnosticUpdate={(diagnostics) => {
          // Handle diagnostic updates
        }}
      />
    </div>
  );
}
```

### API Usage

```typescript
// Customer support chat
const response = await api.ai.customerSupport.chat.mutate({
  message: "I need to schedule an appointment",
  customerId: "customer-123"
});

// Mechanic assistance
const assistance = await api.ai.mechanicAssistant.chat.mutate({
  message: "Help me diagnose engine noise",
  mechanicId: "mechanic-456"
});

// VIN decoding
const vinData = await api.ai.mechanicAssistant.decodeVIN.mutate({
  vin: "1HGBH41JXMN109186"
});
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run AI integration tests
npm run test:ai

# Run with coverage
npm run test:coverage
```

## 📦 Deployment

### Vercel (Recommended)

```bash
npm run build
vercel --prod
```

### Docker

```bash
docker build -t heinicus-mobile-mechanic .
docker run -p 3000:3000 heinicus-mobile-mechanic
```

### Manual Deployment

```bash
npm run build
npm start
```

## 🔒 Security

- API keys stored securely in environment variables
- Input validation using Zod schemas
- Rate limiting protection
- Session-based authentication
- HTTPS enforcement in production

## 📊 Monitoring

The application includes built-in monitoring for:

- AI service health and response times
- API usage and rate limiting
- Error rates and types
- User interaction patterns

Access health checks at `/api/trpc/ai.healthCheck`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Submit issues on GitHub
- **Email**: Contact the development team
- **Community**: Join our Discord server

## 🎯 Roadmap

- [ ] Advanced diagnostic AI models
- [ ] Multi-language support
- [ ] Voice interaction capabilities
- [ ] AR-powered repair guidance
- [ ] IoT device integration
- [ ] Advanced analytics dashboard

## 🙏 Acknowledgments

- Built with ❤️ by Cody & the development team
- Powered by Abacus.AI for intelligent assistance
- Special thanks to the open-source community

---

**Ready to revolutionize mobile mechanic services with AI?** 🚗⚡

Get started with the [Setup Guide](docs/SETUP_GUIDE.md) or dive into the [API Documentation](docs/API_DOCUMENTATION.md).