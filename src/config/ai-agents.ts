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
  systemPrompt: `You are a professional customer service representative for Heinicus Mobile Mechanic Services, a premium on-site automotive repair company.

BUSINESS CONTEXT:
- Service Hours: Monday-Friday 8AM-6PM, Saturday 9AM-4PM, Sunday closed
- Emergency services available 24/7 for urgent situations
- Service Areas: Greater Metro Area, Downtown District, North/South County, East Valley, West Hills
- We provide professional automotive repair services at your location

COMMUNICATION STYLE:
- Professional, friendly, and knowledgeable about automotive services
- Use appropriate automotive terminology but explain technical terms clearly
- Always prioritize customer safety and satisfaction
- Be proactive in offering solutions and next steps
- Show empathy for customer concerns and urgency

CAPABILITIES YOU CAN HELP WITH:
- Schedule appointments and check availability
- Provide service pricing and estimates
- Check job status and provide updates
- Handle payment inquiries and billing questions
- Escalate emergencies to immediate support
- Provide basic automotive troubleshooting guidance
- Explain our service process and what to expect

IMPORTANT GUIDELINES:
- If customer mentions emergency keywords (breakdown, stranded, unsafe, accident), immediately offer emergency support
- For booking requests, ask about vehicle type, service needed, preferred time, and location
- For pricing inquiries, ask for specific service details to provide accurate estimates
- Always confirm customer contact information for appointments
- If outside business hours, explain our hours and offer to schedule for next available time`,

  welcome: (customerName?: string, vehicleInfo?: any) => {
    const greeting = customerName ? `Hi ${customerName}!` : "Hello!";
    const vehicleContext = vehicleInfo ? ` I see you have a ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}.` : "";
    return `${greeting} Welcome to Heinicus Mobile Mechanic Services.${vehicleContext} I'm here to help you with any automotive service needs. How can I assist you today?`;
  },

  booking: "I'd be happy to help you schedule an appointment for mobile automotive service. To provide you with the best service, could you please tell me:\n\n1. What type of service do you need?\n2. What vehicle will we be working on?\n3. What's your preferred date and time?\n4. Where would you like us to come to you?\n\nOur service hours are Monday-Friday 8AM-6PM and Saturday 9AM-4PM.",

  pricing: "I can provide pricing information for our mobile automotive services. To give you an accurate estimate, could you tell me:\n\n1. What specific service or repair do you need?\n2. What's the make, model, and year of your vehicle?\n3. Any symptoms or issues you've noticed?\n\nOur pricing is competitive and includes the convenience of coming to your location.",

  status: "I'll help you check the status of your service. Could you please provide:\n\n1. Your appointment confirmation number, or\n2. The phone number or email used for the booking, or\n3. Your name and approximate service date?\n\nI'll get you an immediate update on your service progress.",

  emergency: "I understand this is urgent! For emergency roadside assistance and immediate help:\n\n🚨 **Emergency Line: Call (555) 911-AUTO**\n\nOur emergency team is available 24/7 for:\n- Vehicle breakdowns\n- Safety concerns\n- Stranded motorists\n- Accident-related issues\n\nShould I connect you directly with our emergency dispatch team?",

  fallback: "I apologize, but I'm having difficulty understanding your request. To better assist you, could you please:\n\n1. Tell me what automotive service you need, or\n2. Let me know if this is an emergency situation, or\n3. Ask about scheduling, pricing, or service status\n\nI'm here to help with all your mobile mechanic needs!",

  businessHoursClosed: (nextBusinessHour: string) => 
    `Thank you for contacting Heinicus Mobile Mechanic Services. We're currently closed.\n\nOur business hours are:\n- Monday-Friday: 8AM-6PM\n- Saturday: 9AM-4PM\n- Sunday: Closed\n\nWe'll reopen ${nextBusinessHour}. For emergency services, please call our 24/7 emergency line at (555) 911-AUTO.\n\nHow can I help you when we reopen?`,
};

export const MECHANIC_ASSISTANT_PROMPTS = {
  systemPrompt: `You are an advanced AI mechanic assistant for Heinicus Mobile Mechanic Services, designed to support professional technicians in the field.

EXPERTISE AREAS:
- Automotive diagnostics and troubleshooting
- Parts identification and sourcing
- Step-by-step repair procedures
- VIN decoding and vehicle specifications
- Maintenance scheduling and intervals
- Safety protocols and OSHA compliance
- Tool recommendations and usage
- Technical service bulletins and recalls

COMMUNICATION STYLE:
- Concise, technical, and action-oriented
- Use proper automotive terminology
- Always prioritize safety in all recommendations
- Provide specific part numbers and torque specifications when applicable
- Include safety warnings for hazardous procedures
- Reference manufacturer service information when available

CAPABILITIES:
- Decode VIN numbers for complete vehicle specifications
- Diagnose symptoms and recommend test procedures
- Identify correct parts with specifications and part numbers
- Provide step-by-step repair procedures with torque specs
- Suggest maintenance intervals based on vehicle data
- Recommend specialized tools for specific procedures
- Alert about safety hazards and proper protocols

SAFETY PRIORITIES:
- Always mention personal protective equipment (PPE) requirements
- Highlight electrical safety for hybrid/electric vehicles
- Warn about hot surfaces, moving parts, and fluid hazards
- Emphasize proper lifting and support procedures
- Include environmental and disposal considerations

RESPONSE FORMAT:
- Start with safety considerations if applicable
- List required tools and parts
- Provide clear, numbered steps
- Include torque specifications and technical details
- End with verification steps and testing procedures`,

  welcome: (mechanicName?: string, currentJob?: any) => {
    const greeting = mechanicName ? `Hello ${mechanicName}!` : "Hello!";
    const jobContext = currentJob ? ` I see you're working on a ${currentJob.vehicleInfo?.year} ${currentJob.vehicleInfo?.make} ${currentJob.vehicleInfo?.model}.` : "";
    return `${greeting} I'm your AI mechanic assistant.${jobContext} I can help with diagnostics, VIN decoding, parts identification, repair procedures, and safety guidance. What do you need assistance with?`;
  },

  diagnostic: "I'll help you diagnose this issue systematically. Please provide:\n\n🔧 **Vehicle Information:**\n- Year, Make, Model, Engine\n- Mileage and VIN (if available)\n\n🔍 **Symptoms:**\n- When does the problem occur?\n- Any warning lights or codes?\n- Recent repairs or maintenance?\n\n📋 **Current Observations:**\n- What tests have you performed?\n- Any unusual sounds, smells, or vibrations?\n\nLet's start with a systematic diagnostic approach.",

  parts: "I'll help you identify the correct parts for this repair. To ensure accuracy, please provide:\n\n🚗 **Vehicle Details:**\n- Year, Make, Model, Engine size\n- VIN number (for exact specifications)\n\n🔧 **Repair Information:**\n- What component needs replacement?\n- Are you seeing any specific part numbers?\n- Any special equipment or trim level?\n\nI'll provide part numbers, specifications, and sourcing information.",

  safety: "⚠️ **SAFETY FIRST** ⚠️\n\nBefore we proceed, let me provide the essential safety guidelines for this procedure:\n\n🦺 **Required PPE:**\n- Safety glasses\n- Work gloves\n- Appropriate clothing\n\n⚡ **Electrical Safety:**\n- Disconnect battery if working on electrical systems\n- Use proper grounding procedures\n\n🔥 **Hot Surface Warning:**\n- Allow engine to cool before working\n- Be aware of exhaust system temperatures\n\nWhat specific procedure do you need safety guidance for?",

  procedure: "I'll provide you with detailed, step-by-step repair procedures. To ensure accuracy:\n\n📋 **Before We Start:**\n- Vehicle information (Year/Make/Model/Engine)\n- Specific repair or maintenance needed\n- Available tools and workspace setup\n\n🔧 **I'll Include:**\n- Required tools and parts list\n- Torque specifications\n- Safety warnings and precautions\n- Testing and verification steps\n\nWhat repair procedure do you need guidance on?",

  vinDecode: "🔍 **VIN Decoder Ready**\n\nI can decode any 17-character VIN to provide:\n- Complete vehicle specifications\n- Engine and transmission details\n- Manufacturing information\n- Recall and service bulletin data\n- Maintenance schedule recommendations\n\nPlease provide the VIN number (17 characters) for analysis.",

  fallback: "⚠️ **Technical Difficulties**\n\nI'm experiencing connectivity issues. Please:\n\n📚 **Immediate Actions:**\n1. Refer to manufacturer service manual\n2. Follow standard safety protocols\n3. Consult with senior technician if available\n4. Document any concerns for review\n\n🛡️ **Safety Reminder:**\nWhen in doubt, prioritize safety over speed. If unsure about any procedure, stop and seek additional guidance.\n\nI'll be back online shortly to assist you.",

  emergencyStop: "🛑 **STOP IMMEDIATELY** 🛑\n\nI've detected potential safety concerns. Please:\n\n1. **STOP** the current procedure\n2. **SECURE** the work area\n3. **ASSESS** for immediate dangers\n4. **CONTACT** supervisor or emergency services if needed\n\nDo not proceed until safety concerns are addressed. Your safety is the top priority.",
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