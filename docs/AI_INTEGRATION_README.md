# AI Agent Integration for Heinicus Mobile Mechanic App

This document provides comprehensive information about integrating the Customer Support Agent and Mechanic Assistant Agent into the Heinicus Mobile Mechanic application.

## Overview

The Heinicus Mobile Mechanic app now includes two AI agents powered by Abacus.AI:

1. **Customer Support Agent** - Handles customer inquiries, booking, troubleshooting, and general support
2. **Mechanic Assistant Agent** - Provides diagnostic assistance, parts identification, and repair guidance to mechanics

## Quick Start

### 1. Environment Setup

Copy the environment variables from `.env.example` to your `.env.local` file:

```bash
cp .env.example .env.local
```

Update the following required variables:

```env
# AI Agents - Abacus.AI Integration
ABACUS_AI_API_KEY="your-abacus-ai-api-key"
CUSTOMER_SUPPORT_AGENT_ID="c816aa206"
MECHANIC_ASSISTANT_AGENT_ID="your-mechanic-assistant-agent-id"
```

### 2. Install Dependencies

The integration uses existing dependencies. No additional packages are required.

### 3. Import and Use Components

#### Customer Support Widget

```tsx
import { CustomerSupportWidget } from '~/components/chat/CustomerSupportWidget';

function MyPage() {
  const [showChat, setShowChat] = useState(false);

  return (
    <div>
      {/* Your existing content */}
      
      <CustomerSupportWidget
        customerId="customer-123"
        context={{
          customerName: "John Doe",
          vehicleInfo: {
            make: "Toyota",
            model: "Camry",
            year: 2020,
            vin: "1HGBH41JXMN109186"
          }
        }}
        minimized={!showChat}
        onToggleMinimize={() => setShowChat(!showChat)}
        onActionRequired={(action) => {
          console.log('Action required:', action);
        }}
      />
    </div>
  );
}
```

#### Mechanic Assistant Widget

```tsx
import { MechanicAssistantWidget } from '~/components/chat/MechanicAssistantWidget';

function MechanicDashboard() {
  const [showAssistant, setShowAssistant] = useState(false);

  return (
    <div>
      {/* Your existing content */}
      
      <MechanicAssistantWidget
        mechanicId="mechanic-456"
        context={{
          mechanicId: "mechanic-456",
          mechanicName: "Mike Johnson",
          currentJob: {
            id: "job-789",
            customerId: "customer-123",
            vehicleInfo: {
              make: "Honda",
              model: "Civic",
              year: 2019
            },
            symptoms: ["engine noise", "rough idle"],
            status: "diagnostic"
          }
        }}
        minimized={!showAssistant}
        onToggleMinimize={() => setShowAssistant(!showAssistant)}
        onDiagnosticUpdate={(diagnostics) => {
          console.log('Diagnostic update:', diagnostics);
        }}
      />
    </div>
  );
}
```

## API Integration

### tRPC Router

The AI functionality is exposed through tRPC routes:

```typescript
// Customer Support
const response = await api.ai.customerSupport.chat.mutate({
  message: "I need to schedule an appointment",
  customerId: "customer-123",
  context: {
    vehicleInfo: { make: "Toyota", model: "Camry", year: 2020 }
  }
});

// Mechanic Assistant
const assistance = await api.ai.mechanicAssistant.chat.mutate({
  message: "Help me diagnose engine noise",
  mechanicId: "mechanic-456",
  context: {
    currentJob: {
      vehicleInfo: { make: "Honda", model: "Civic", year: 2019 },
      symptoms: ["engine noise", "rough idle"]
    }
  }
});

// VIN Decoding
const vinData = await api.ai.mechanicAssistant.decodeVIN.mutate({
  vin: "1HGBH41JXMN109186"
});
```

### Direct API Usage

You can also use the AI clients directly:

```typescript
import { getCustomerSupportAgent, getMechanicAssistantAgent } from '~/lib/ai';

// Customer Support
const customerAgent = getCustomerSupportAgent();
const response = await customerAgent.handleCustomerQuery({
  message: "What are your hours?",
  customerId: "customer-123"
});

// Mechanic Assistant
const mechanicAgent = getMechanicAssistantAgent();
const assistance = await mechanicAgent.assistMechanic({
  message: "How do I replace brake pads on a 2020 Toyota Camry?",
  mechanicId: "mechanic-456"
});
```

## Features

### Customer Support Agent

- **Appointment Booking**: Helps customers schedule service appointments
- **Service Status**: Provides updates on current jobs and appointments
- **Pricing Information**: Answers questions about service costs
- **Troubleshooting**: Basic diagnostic help for common issues
- **Payment Support**: Handles billing and payment inquiries
- **Emergency Routing**: Escalates urgent issues appropriately

### Mechanic Assistant Agent

- **Diagnostic Assistance**: Helps diagnose vehicle problems
- **Parts Identification**: Identifies required parts and provides specifications
- **Repair Procedures**: Step-by-step repair instructions
- **VIN Decoding**: Extracts vehicle information from VIN numbers
- **Safety Guidance**: Provides safety alerts and PPE recommendations
- **Maintenance Schedules**: Suggests maintenance based on vehicle and mileage

## Configuration

### AI Agent Configuration

Edit `src/config/ai-agents.ts` to customize agent behavior:

```typescript
export const AI_AGENT_CONFIG = {
  customerSupportAgent: {
    enabled: true,
    features: [
      'booking_appointments',
      'troubleshooting',
      'pricing_inquiries',
      // ... more features
    ],
  },
  mechanicAssistantAgent: {
    enabled: true,
    features: [
      'diagnostic_assistance',
      'parts_identification',
      // ... more features
    ],
  },
  general: {
    timeout: 30000,
    maxRetries: 3,
    rateLimit: 100,
  },
};
```

### Business Hours and Service Areas

Configure your business information:

```typescript
export const BUSINESS_HOURS = {
  monday: { open: '08:00', close: '18:00' },
  tuesday: { open: '08:00', close: '18:00' },
  // ... other days
};

export const SERVICE_AREAS = [
  'Greater Metro Area',
  'Downtown District',
  // ... other areas
];
```

## Error Handling

The integration includes comprehensive error handling:

- **Fallback Responses**: When AI services are unavailable
- **Rate Limiting**: Automatic retry with exponential backoff
- **Timeout Handling**: Graceful degradation for slow responses
- **Safety Checks**: Built-in safety alerts for dangerous procedures

## Security

- **API Key Management**: Secure storage of API keys in environment variables
- **Input Validation**: All inputs are validated using Zod schemas
- **Rate Limiting**: Protection against abuse
- **Session Management**: Secure session handling with automatic cleanup

## Testing

### Unit Tests

```bash
npm run test src/lib/ai/
```

### Integration Tests

```bash
npm run test:integration
```

### Manual Testing

Use the health check endpoint to verify AI services:

```typescript
const health = await api.ai.healthCheck.query();
console.log(health); // { status: 'healthy', agents: { ... } }
```

## Deployment

### Environment Variables

Ensure all required environment variables are set in production:

```env
ABACUS_AI_API_KEY=your-production-api-key
CUSTOMER_SUPPORT_AGENT_ID=c816aa206
MECHANIC_ASSISTANT_AGENT_ID=your-mechanic-agent-id
AI_AGENT_TIMEOUT=30000
AI_AGENT_MAX_RETRIES=3
```

### Performance Considerations

- **Caching**: Implement response caching for common queries
- **Connection Pooling**: Use connection pooling for API requests
- **Monitoring**: Set up monitoring for AI service availability

## Troubleshooting

### Common Issues

1. **AI Service Unavailable**
   - Check API keys and network connectivity
   - Verify agent IDs are correct
   - Check service status at Abacus.AI

2. **Slow Response Times**
   - Increase timeout values
   - Check network latency
   - Consider implementing caching

3. **Rate Limiting**
   - Reduce request frequency
   - Implement exponential backoff
   - Contact Abacus.AI for rate limit increases

### Debug Mode

Enable debug logging:

```env
DEBUG=ai:*
```

### Health Checks

Monitor AI service health:

```typescript
// Check if services are healthy
const isHealthy = await api.ai.healthCheck.query();
```

## Support

For technical support:

1. Check the troubleshooting section above
2. Review the API documentation
3. Contact the development team
4. Submit issues to the GitHub repository

## Changelog

### Version 1.0.0
- Initial AI agent integration
- Customer Support Agent implementation
- Mechanic Assistant Agent implementation
- tRPC API routes
- React components
- Comprehensive documentation

## License

This integration is part of the Heinicus Mobile Mechanic App and follows the same licensing terms.