# AI Agent API Documentation

This document provides detailed API documentation for the AI agent integration in the Heinicus Mobile Mechanic app.

## Table of Contents

1. [Authentication](#authentication)
2. [Customer Support Agent API](#customer-support-agent-api)
3. [Mechanic Assistant Agent API](#mechanic-assistant-agent-api)
4. [Common Types](#common-types)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)

## Authentication

All API requests require authentication through environment variables:

```env
ABACUS_AI_API_KEY=your-api-key
CUSTOMER_SUPPORT_AGENT_ID=c816aa206
MECHANIC_ASSISTANT_AGENT_ID=your-mechanic-agent-id
```

## Customer Support Agent API

### Chat Endpoint

Send messages to the customer support agent.

**Endpoint:** `api.ai.customerSupport.chat`  
**Method:** `mutation`

#### Request

```typescript
{
  message: string;           // Required: Customer message (1-1000 chars)
  sessionId?: string;        // Optional: Session ID for conversation continuity
  customerId?: string;       // Optional: Customer identifier
  context?: {                // Optional: Customer context
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    vehicleInfo?: {
      make?: string;
      model?: string;
      year?: number;
      vin?: string;
      mileage?: number;
    };
    currentJob?: {
      id: string;
      status: string;
      description?: string;
      estimatedCost?: number;
    };
    appointmentInfo?: {
      id?: string;
      scheduledDate?: string;
      location?: string;
      serviceType?: string;
    };
    paymentInfo?: {
      lastPaymentStatus?: string;
      outstandingBalance?: number;
    };
  };
}
```

#### Response

```typescript
{
  response: string;                    // AI agent response
  sessionId: string;                   // Session ID for conversation
  suggestedResponses?: string[];       // Quick reply suggestions
  actionRequired?: {                   // Action that may be needed
    type: 'booking' | 'payment' | 'escalation' | 'information';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    details: Record<string, any>;
  };
  suggestions?: string[];              // General suggestions
  confidence?: number;                 // Response confidence (0-1)
  metadata?: Record<string, any>;      // Additional metadata
}
```

#### Example

```typescript
const response = await api.ai.customerSupport.chat.mutate({
  message: "I need to schedule an oil change for my 2020 Toyota Camry",
  customerId: "cust_123",
  context: {
    customerName: "John Doe",
    customerPhone: "+1-555-0123",
    vehicleInfo: {
      make: "Toyota",
      model: "Camry",
      year: 2020,
      mileage: 45000
    }
  }
});

// Response:
{
  response: "I'd be happy to help you schedule an oil change for your 2020 Toyota Camry. Based on your mileage of 45,000 miles, I recommend our full synthetic oil service. What day works best for you?",
  sessionId: "session_1234567890_abc123",
  suggestedResponses: [
    "What are your available times?",
    "How much does it cost?",
    "Can you come to my location?"
  ],
  actionRequired: {
    type: "booking",
    priority: "medium",
    details: {
      serviceType: "oil_change",
      vehicleInfo: { make: "Toyota", model: "Camry", year: 2020 }
    }
  }
}
```

### Get Customer History

Retrieve customer service history.

**Endpoint:** `api.ai.customerSupport.getHistory`  
**Method:** `query`  
**Auth:** Required (protectedProcedure)

#### Request

```typescript
{
  customerId: string;  // Required: Customer identifier
}
```

#### Response

```typescript
Array<{
  id: string;
  date: Date;
  serviceType: string;
  description: string;
  cost: number;
  status: string;
  // ... other service record fields
}>
```

## Mechanic Assistant Agent API

### Chat Endpoint

Send messages to the mechanic assistant agent.

**Endpoint:** `api.ai.mechanicAssistant.chat`  
**Method:** `mutation`  
**Auth:** Required (protectedProcedure)

#### Request

```typescript
{
  message: string;           // Required: Mechanic message (1-1000 chars)
  sessionId?: string;        // Optional: Session ID
  mechanicId: string;        // Required: Mechanic identifier
  context?: {                // Optional: Mechanic context
    mechanicId: string;
    mechanicName: string;
    certifications?: string[];
    specializations?: string[];
    currentJob?: {
      id: string;
      customerId: string;
      vehicleInfo: {
        make: string;
        model: string;
        year: number;
        vin?: string;
        mileage?: number;
      };
      symptoms: string[];
      diagnosticCodes?: string[];
      partsNeeded?: Array<{
        partNumber: string;
        description: string;
        quantity: number;
        estimatedCost: number;
      }>;
      laborEstimate?: {
        hours: number;
        rate: number;
      };
      status: 'diagnostic' | 'quoted' | 'approved' | 'in_progress' | 'completed';
    };
    tools?: string[];
    location?: {
      latitude: number;
      longitude: number;
      address: string;
    };
  };
  attachments?: Array<{       // Optional: File attachments
    type: 'image' | 'video' | 'audio' | 'document';
    url: string;
    description?: string;
  }>;
}
```

#### Response

```typescript
{
  response: string;                    // AI agent response
  sessionId: string;                   // Session ID
  diagnosticSuggestions?: Array<{      // Diagnostic recommendations
    issue: string;
    probability: number;
    tests: string[];
    parts?: string[];
  }>;
  partsRecommendations?: Array<{       // Parts recommendations
    partNumber: string;
    description: string;
    supplier: string;
    estimatedCost: number;
    availability: 'in_stock' | 'order_required' | 'unknown';
  }>;
  procedureSteps?: Array<{             // Repair procedure steps
    step: number;
    description: string;
    tools: string[];
    safetyNotes?: string[];
    estimatedTime: number;             // in minutes
  }>;
  safetyAlerts?: Array<{               // Safety warnings
    level: 'info' | 'warning' | 'danger';
    message: string;
  }>;
  suggestions?: string[];
  confidence?: number;
  metadata?: Record<string, any>;
}
```

#### Example

```typescript
const response = await api.ai.mechanicAssistant.chat.mutate({
  message: "Customer reports engine knocking noise on acceleration. 2019 Honda Civic with 60k miles.",
  mechanicId: "mech_456",
  context: {
    mechanicId: "mech_456",
    mechanicName: "Mike Johnson",
    currentJob: {
      id: "job_789",
      customerId: "cust_123",
      vehicleInfo: {
        make: "Honda",
        model: "Civic",
        year: 2019,
        mileage: 60000
      },
      symptoms: ["engine knocking", "noise on acceleration"],
      status: "diagnostic"
    }
  }
});

// Response:
{
  response: "Engine knocking on acceleration in a 2019 Honda Civic with 60k miles could indicate several issues. Let me provide diagnostic suggestions and safety considerations.",
  sessionId: "session_1234567890_def456",
  diagnosticSuggestions: [
    {
      issue: "Carbon knock due to low octane fuel",
      probability: 0.4,
      tests: ["Check fuel octane rating", "Listen to knock with stethoscope"],
      parts: []
    },
    {
      issue: "Worn engine bearings",
      probability: 0.3,
      tests: ["Oil pressure test", "Engine compression test"],
      parts: ["Main bearings", "Rod bearings"]
    }
  ],
  safetyAlerts: [
    {
      level: "warning",
      message: "Engine knocking can cause severe damage if not addressed promptly. Avoid high RPM until diagnosed."
    }
  ]
}
```

### VIN Decode Endpoint

Decode vehicle information from VIN.

**Endpoint:** `api.ai.mechanicAssistant.decodeVIN`  
**Method:** `mutation`  
**Auth:** Required (protectedProcedure)

#### Request

```typescript
{
  vin: string;  // Required: 17-character VIN
}
```

#### Response

```typescript
{
  make: string;
  model: string;
  year: number;
  engine: string;
  transmission: string;
  // ... other vehicle data
}
```

#### Example

```typescript
const vinData = await api.ai.mechanicAssistant.decodeVIN.mutate({
  vin: "1HGBH41JXMN109186"
});

// Response:
{
  make: "Honda",
  model: "Civic",
  year: 2021,
  engine: "2.0L I4",
  transmission: "CVT",
  bodyStyle: "Sedan",
  fuelType: "Gasoline"
}
```

### Maintenance Schedule Endpoint

Get maintenance schedule for a vehicle.

**Endpoint:** `api.ai.mechanicAssistant.getMaintenanceSchedule`  
**Method:** `query`  
**Auth:** Required (protectedProcedure)

#### Request

```typescript
{
  make: string;     // Required: Vehicle make
  model: string;    // Required: Vehicle model
  year: number;     // Required: Vehicle year
  mileage: number;  // Required: Current mileage
}
```

#### Response

```typescript
Array<{
  service: string;
  mileage: number;
  months: number;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedCost: number;
}>
```

## Common Types

### Session Management

```typescript
interface AISession {
  id: string;
  agentId: string;
  userId?: string;
  context: Record<string, any>;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

interface AIMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

### Vehicle Information

```typescript
interface VehicleInfo {
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  mileage?: number;
  color?: string;
  licensePlate?: string;
}
```

### Safety Alerts

```typescript
interface SafetyAlert {
  level: 'info' | 'warning' | 'danger' | 'critical';
  message: string;
  category: 'electrical' | 'mechanical' | 'chemical' | 'environmental' | 'procedural';
  requiredPPE?: string[];
  emergencyProcedure?: string;
}
```

## Error Handling

### Error Response Format

```typescript
{
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
```

### Common Error Codes

- `AI_SERVICE_UNAVAILABLE`: AI service is temporarily unavailable
- `INVALID_INPUT`: Request validation failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `AUTHENTICATION_FAILED`: Invalid API key or agent ID
- `SESSION_NOT_FOUND`: Session ID not found
- `TIMEOUT`: Request timed out

### Error Handling Example

```typescript
try {
  const response = await api.ai.customerSupport.chat.mutate({
    message: "Hello"
  });
} catch (error) {
  if (error.code === 'AI_SERVICE_UNAVAILABLE') {
    // Show fallback UI
    showFallbackMessage();
  } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Wait and retry
    await delay(5000);
    retry();
  } else {
    // Handle other errors
    console.error('AI Error:', error);
  }
}
```

## Rate Limiting

### Limits

- **Customer Support Agent**: 100 requests per minute per IP
- **Mechanic Assistant Agent**: 200 requests per minute per authenticated user
- **VIN Decode**: 50 requests per hour per user

### Rate Limit Headers

Response headers include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Handling Rate Limits

```typescript
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  body: JSON.stringify(data)
});

if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  await delay(parseInt(retryAfter) * 1000);
  // Retry request
}
```

## Health Check

Monitor AI service health:

**Endpoint:** `api.ai.healthCheck`  
**Method:** `query`

#### Response

```typescript
{
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  agents: {
    customerSupport: 'available' | 'unavailable';
    mechanicAssistant: 'available' | 'unavailable';
  };
  error?: string;
}
```

## Examples

### Complete Customer Support Flow

```typescript
// 1. Start conversation
const initialResponse = await api.ai.customerSupport.chat.mutate({
  message: "Hi, I need help with my car",
  customerId: "cust_123"
});

// 2. Continue conversation with context
const followUpResponse = await api.ai.customerSupport.chat.mutate({
  message: "It's making a strange noise",
  sessionId: initialResponse.sessionId,
  customerId: "cust_123",
  context: {
    vehicleInfo: {
      make: "Toyota",
      model: "Camry",
      year: 2020
    }
  }
});

// 3. Handle action if required
if (followUpResponse.actionRequired?.type === 'booking') {
  // Redirect to booking flow
  router.push('/book-appointment');
}
```

### Complete Mechanic Assistant Flow

```typescript
// 1. Start diagnostic session
const diagnosticResponse = await api.ai.mechanicAssistant.chat.mutate({
  message: "Customer reports brake noise when stopping",
  mechanicId: "mech_456",
  context: {
    currentJob: {
      vehicleInfo: { make: "Honda", model: "Accord", year: 2018 },
      symptoms: ["brake noise", "grinding sound"]
    }
  }
});

// 2. Get VIN information
const vinData = await api.ai.mechanicAssistant.decodeVIN.mutate({
  vin: "1HGCV1F30JA123456"
});

// 3. Get maintenance schedule
const maintenance = await api.ai.mechanicAssistant.getMaintenanceSchedule.query({
  make: vinData.make,
  model: vinData.model,
  year: vinData.year,
  mileage: 75000
});

// 4. Continue with repair guidance
const repairResponse = await api.ai.mechanicAssistant.chat.mutate({
  message: "How do I replace the brake pads on this vehicle?",
  sessionId: diagnosticResponse.sessionId,
  mechanicId: "mech_456"
});
```

This API documentation provides comprehensive information for integrating with the AI agents. For additional support, refer to the main integration documentation or contact the development team.