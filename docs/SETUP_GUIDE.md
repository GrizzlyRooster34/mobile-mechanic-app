# AI Agent Integration Setup Guide

This guide walks you through setting up the AI agent integration for the Heinicus Mobile Mechanic app step by step.

## Prerequisites

Before starting, ensure you have:

- Node.js 18+ installed
- Access to the Heinicus Mobile Mechanic app repository
- Abacus.AI account with API access
- Customer Support Agent ID: `c816aa206`
- Mechanic Assistant Agent (to be configured)

## Step 1: Environment Configuration

### 1.1 Copy Environment Template

```bash
cp .env.example .env.local
```

### 1.2 Configure Required Variables

Edit `.env.local` and add the following:

```env
# AI Agents - Abacus.AI Integration
ABACUS_AI_API_KEY="your-abacus-ai-api-key"
ABACUS_AI_BASE_URL="https://api.abacus.ai"

# Customer Support Agent
CUSTOMER_SUPPORT_AGENT_ID="c816aa206"
CUSTOMER_SUPPORT_AGENT_URL="https://apps.abacus.ai/chatllm/c816aa206"

# Mechanic Assistant Agent
MECHANIC_ASSISTANT_AGENT_ID="your-mechanic-assistant-agent-id"
MECHANIC_ASSISTANT_AGENT_URL="your-mechanic-assistant-agent-url"

# AI Agent Configuration
AI_AGENT_TIMEOUT=30000
AI_AGENT_MAX_RETRIES=3
AI_AGENT_RATE_LIMIT=100
```

### 1.3 Get Your API Key

1. Log in to your Abacus.AI account
2. Navigate to API Settings
3. Generate a new API key
4. Copy the key to `ABACUS_AI_API_KEY`

## Step 2: Install Dependencies

The integration uses existing dependencies. Verify they're installed:

```bash
npm install
```

Key dependencies used:
- `@trpc/server` - API routes
- `@trpc/client` - Client-side API calls
- `zod` - Input validation
- `axios` - HTTP requests
- `zustand` - State management

## Step 3: Database Setup (Optional)

If you want to store AI sessions in your database, add these Prisma models:

```prisma
// Add to your schema.prisma file

model AISession {
  id        String   @id @default(cuid())
  agentId   String
  userId    String?
  context   Json?
  messages  AIMessage[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("ai_sessions")
}

model AIMessage {
  id        String   @id @default(cuid())
  sessionId String
  role      String   // 'user' | 'assistant' | 'system'
  content   String
  timestamp DateTime @default(now())
  metadata  Json?
  
  session   AISession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  @@map("ai_messages")
}
```

Then run:

```bash
npx prisma db push
```

## Step 4: Add tRPC Router

### 4.1 Update Main Router

Edit `src/server/api/root.ts` to include the AI router:

```typescript
import { createTRPCRouter } from "~/server/api/trpc";
import { exampleRouter } from "~/server/api/routers/example";
import { aiRouter } from "~/server/api/routers/ai"; // Add this line

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  ai: aiRouter, // Add this line
});

export type AppRouter = typeof appRouter;
```

### 4.2 Verify Router Setup

The AI router should be automatically available at:
- `api.ai.customerSupport.chat`
- `api.ai.mechanicAssistant.chat`
- `api.ai.healthCheck`

## Step 5: Test the Integration

### 5.1 Health Check Test

Create a test file `test-ai-integration.js`:

```javascript
import { api } from '~/utils/api';

async function testHealthCheck() {
  try {
    const health = await api.ai.healthCheck.query();
    console.log('Health check result:', health);
    
    if (health.status === 'healthy') {
      console.log('✅ AI integration is working!');
    } else {
      console.log('❌ AI integration has issues:', health.error);
    }
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }
}

testHealthCheck();
```

Run the test:

```bash
node test-ai-integration.js
```

### 5.2 Customer Support Test

```javascript
async function testCustomerSupport() {
  try {
    const response = await api.ai.customerSupport.chat.mutate({
      message: "Hello, I need help with my car",
      customerId: "test-customer-123"
    });
    
    console.log('Customer support response:', response);
    console.log('✅ Customer support agent is working!');
  } catch (error) {
    console.error('❌ Customer support test failed:', error);
  }
}

testCustomerSupport();
```

## Step 6: Add Components to Your App

### 6.1 Customer-Facing Pages

Add the customer support widget to customer-facing pages:

```tsx
// pages/index.tsx or your main customer page
import { useState } from 'react';
import { CustomerSupportWidget } from '~/components/chat/CustomerSupportWidget';

export default function HomePage() {
  const [showChat, setShowChat] = useState(false);

  return (
    <div>
      {/* Your existing content */}
      
      {/* Customer Support Chat */}
      <CustomerSupportWidget
        minimized={!showChat}
        onToggleMinimize={() => setShowChat(!showChat)}
        onActionRequired={(action) => {
          // Handle required actions (booking, payment, etc.)
          console.log('Action required:', action);
        }}
      />
    </div>
  );
}
```

### 6.2 Mechanic Dashboard

Add the mechanic assistant to mechanic-facing pages:

```tsx
// pages/mechanic/dashboard.tsx or similar
import { useState } from 'react';
import { MechanicAssistantWidget } from '~/components/chat/MechanicAssistantWidget';
import { useSession } from 'next-auth/react';

export default function MechanicDashboard() {
  const { data: session } = useSession();
  const [showAssistant, setShowAssistant] = useState(false);

  if (!session?.user) return <div>Please log in</div>;

  return (
    <div>
      {/* Your existing dashboard content */}
      
      {/* Mechanic Assistant */}
      <MechanicAssistantWidget
        mechanicId={session.user.id}
        minimized={!showAssistant}
        onToggleMinimize={() => setShowAssistant(!showAssistant)}
        onDiagnosticUpdate={(diagnostics) => {
          // Handle diagnostic updates
          console.log('New diagnostics:', diagnostics);
        }}
        onPartsUpdate={(parts) => {
          // Handle parts recommendations
          console.log('Parts needed:', parts);
        }}
      />
    </div>
  );
}
```

## Step 7: Customize Configuration

### 7.1 Business Hours

Edit `src/config/ai-agents.ts` to match your business hours:

```typescript
export const BUSINESS_HOURS = {
  monday: { open: '08:00', close: '18:00' },
  tuesday: { open: '08:00', close: '18:00' },
  wednesday: { open: '08:00', close: '18:00' },
  thursday: { open: '08:00', close: '18:00' },
  friday: { open: '08:00', close: '18:00' },
  saturday: { open: '09:00', close: '16:00' },
  sunday: { open: null, close: null }, // Closed
};
```

### 7.2 Service Areas

Update your service areas:

```typescript
export const SERVICE_AREAS = [
  'Your City Downtown',
  'North District',
  'South District',
  'East Valley',
  'West Hills',
  // Add your actual service areas
];
```

### 7.3 Emergency Contact

Set your emergency contact information:

```env
EMERGENCY_CONTACT_NUMBER="+1-555-EMERGENCY"
```

## Step 8: Advanced Configuration

### 8.1 Custom Prompts

Customize AI agent prompts in `src/config/ai-agents.ts`:

```typescript
export const CUSTOMER_SUPPORT_PROMPTS = {
  welcome: "Welcome to [Your Business Name]! How can I help you today?",
  booking: "I'd be happy to help you schedule service. What type of work do you need?",
  // ... customize other prompts
};
```

### 8.2 Safety Configuration

Configure safety checks for the mechanic assistant:

```typescript
// In src/utils/ai-helpers.ts
export class SafetyChecker {
  private static readonly DANGER_KEYWORDS = [
    'electrical', 'high voltage', 'battery', 'airbag',
    // Add keywords specific to your safety protocols
  ];
}
```

### 8.3 Rate Limiting

Adjust rate limits based on your needs:

```env
AI_AGENT_RATE_LIMIT=200  # Requests per minute
AI_AGENT_TIMEOUT=45000   # 45 seconds
AI_AGENT_MAX_RETRIES=5   # Retry attempts
```

## Step 9: Testing in Development

### 9.1 Start Development Server

```bash
npm run dev
```

### 9.2 Test Customer Support

1. Navigate to your customer-facing page
2. Click the chat widget
3. Send a test message: "I need to schedule an appointment"
4. Verify the AI responds appropriately

### 9.3 Test Mechanic Assistant

1. Log in as a mechanic
2. Navigate to the mechanic dashboard
3. Click the assistant widget
4. Send a test message: "Help me diagnose engine noise"
5. Verify the AI provides diagnostic assistance

## Step 10: Production Deployment

### 10.1 Environment Variables

Ensure all production environment variables are set:

```bash
# Verify variables are set
echo $ABACUS_AI_API_KEY
echo $CUSTOMER_SUPPORT_AGENT_ID
echo $MECHANIC_ASSISTANT_AGENT_ID
```

### 10.2 Build and Deploy

```bash
npm run build
npm run start
```

### 10.3 Health Check

After deployment, verify the health endpoint:

```bash
curl https://your-domain.com/api/trpc/ai.healthCheck
```

## Troubleshooting

### Common Issues

1. **"AI service unavailable" error**
   - Check API key is correct
   - Verify agent IDs are valid
   - Check network connectivity

2. **"Rate limit exceeded" error**
   - Reduce request frequency
   - Check rate limit settings
   - Contact Abacus.AI for limit increases

3. **Components not rendering**
   - Verify imports are correct
   - Check console for JavaScript errors
   - Ensure tRPC router is properly configured

4. **Slow response times**
   - Increase timeout values
   - Check network latency
   - Consider implementing caching

### Debug Mode

Enable debug logging:

```env
DEBUG=ai:*
NODE_ENV=development
```

### Log Analysis

Check application logs for AI-related errors:

```bash
# Development
npm run dev 2>&1 | grep -i "ai\|error"

# Production
pm2 logs your-app | grep -i "ai\|error"
```

## Support

If you encounter issues:

1. Check this setup guide
2. Review the API documentation
3. Check the troubleshooting section
4. Contact the development team
5. Submit issues to the GitHub repository

## Next Steps

After successful setup:

1. **Monitor Usage**: Set up monitoring for AI service usage
2. **Gather Feedback**: Collect user feedback on AI interactions
3. **Optimize Performance**: Implement caching and optimization
4. **Expand Features**: Add more AI capabilities as needed
5. **Train Agents**: Provide feedback to improve AI responses

## Security Checklist

- [ ] API keys are stored securely in environment variables
- [ ] Rate limiting is configured appropriately
- [ ] Input validation is working (Zod schemas)
- [ ] Error handling doesn't expose sensitive information
- [ ] Session management is secure
- [ ] HTTPS is enabled in production

## Performance Checklist

- [ ] Response times are acceptable (< 5 seconds)
- [ ] Rate limits are appropriate for your usage
- [ ] Error handling includes fallback responses
- [ ] Caching is implemented where appropriate
- [ ] Monitoring is set up for AI service health

Congratulations! Your AI agent integration should now be fully functional. The customer support agent will help your customers with inquiries, bookings, and support, while the mechanic assistant will provide diagnostic help and repair guidance to your mechanics.