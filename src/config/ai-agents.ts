import type { AIIntegrationConfig } from '~/types/ai';

export const AI_AGENT_CONFIG: AIIntegrationConfig = {
  customerSupportAgent: {
    enabled: true,
    agentId: process.env.CUSTOMER_SUPPORT_AGENT_ID || 'c816aa206',
    apiUrl: process.env.CUSTOMER_SUPPORT_AGENT_URL || 'https://apps.abacus.ai/chatllm/c816aa206',
    features: [
      'booking_appointments',
      'troubleshooting',
      'pricing_inquiries',
      'service_status_updates',
      'payment_questions',
      'general_support',
      'emergency_routing',
      'multilingual_support'
    ],
  },
  mechanicAssistantAgent: {
    enabled: true,
    agentId: process.env.MECHANIC_ASSISTANT_AGENT_ID || '',
    apiUrl: process.env.MECHANIC_ASSISTANT_AGENT_URL || '',
    features: [
      'diagnostic_assistance',
      'parts_identification',
      'repair_procedures',
      'scheduling_management',
      'customer_communication',
      'workflow_optimization',
      'safety_guidance',
      'vin_decoding',
      'maintenance_schedules',
      'real_time_support'
    ],
  },
  general: {
    timeout: parseInt(process.env.AI_AGENT_TIMEOUT || '30000'),
    maxRetries: parseInt(process.env.AI_AGENT_MAX_RETRIES || '3'),
    rateLimit: parseInt(process.env.AI_AGENT_RATE_LIMIT || '100'),
    fallbackEnabled: true,
  },
};

export const CUSTOMER_SUPPORT_PROMPTS = {
  welcome: "Hi! I'm here to help you with any questions about your vehicle service. How can I assist you today?",
  booking: "I'd be happy to help you schedule an appointment. What type of service do you need?",
  pricing: "I can provide pricing information for our services. What specific service are you interested in?",
  status: "Let me check the status of your service. Can you provide your appointment or job reference number?",
  emergency: "This sounds like it might be urgent. Let me connect you with our emergency support team right away.",
  fallback: "I apologize, but I'm having trouble understanding. Could you please rephrase your question?",
};

export const MECHANIC_ASSISTANT_PROMPTS = {
  welcome: "Hello! I'm your AI mechanic assistant. I can help with diagnostics, parts identification, repair procedures, and more. What are you working on today?",
  diagnostic: "Let me help you diagnose this issue. Can you describe the symptoms you're observing?",
  parts: "I can help you identify the right parts for this repair. What vehicle are you working on?",
  safety: "Safety first! Let me provide you with the safety guidelines for this procedure.",
  procedure: "I'll walk you through the repair procedure step by step. Make sure you have all the required tools ready.",
  fallback: "I'm experiencing technical difficulties. Please refer to your service manual and follow standard safety protocols.",
};

export const BUSINESS_HOURS = {
  monday: { open: '08:00', close: '18:00' },
  tuesday: { open: '08:00', close: '18:00' },
  wednesday: { open: '08:00', close: '18:00' },
  thursday: { open: '08:00', close: '18:00' },
  friday: { open: '08:00', close: '18:00' },
  saturday: { open: '09:00', close: '16:00' },
  sunday: { open: null, close: null }, // Closed
};

export const SERVICE_AREAS = [
  'Greater Metro Area',
  'Downtown District',
  'North County',
  'South County',
  'East Valley',
  'West Hills',
];

export const EMERGENCY_KEYWORDS = [
  'emergency',
  'urgent',
  'immediate',
  'asap',
  'critical',
  'dangerous',
  'unsafe',
  'breakdown',
  'stranded',
  'accident',
];

export const BOOKING_KEYWORDS = [
  'appointment',
  'schedule',
  'book',
  'reserve',
  'when',
  'available',
  'time',
  'date',
];

export const PRICING_KEYWORDS = [
  'cost',
  'price',
  'how much',
  'estimate',
  'quote',
  'fee',
  'charge',
  'payment',
];

export const STATUS_KEYWORDS = [
  'status',
  'progress',
  'update',
  'ready',
  'done',
  'finished',
  'complete',
  'when will',
];

export function isBusinessHours(): boolean {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase() as keyof typeof BUSINESS_HOURS;
  const currentTime = now.toTimeString().substring(0, 5);
  
  const hours = BUSINESS_HOURS[day];
  if (!hours.open || !hours.close) return false;
  
  return currentTime >= hours.open && currentTime <= hours.close;
}

export function getNextBusinessHour(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Find next business day
  while (true) {
    const day = tomorrow.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase() as keyof typeof BUSINESS_HOURS;
    const hours = BUSINESS_HOURS[day];
    
    if (hours.open) {
      return `${tomorrow.toLocaleDateString()} at ${hours.open}`;
    }
    
    tomorrow.setDate(tomorrow.getDate() + 1);
  }
}

export function categorizeMessage(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (EMERGENCY_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
    return 'emergency';
  }
  
  if (BOOKING_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
    return 'booking';
  }
  
  if (PRICING_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
    return 'pricing';
  }
  
  if (STATUS_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
    return 'status';
  }
  
  return 'general';
}