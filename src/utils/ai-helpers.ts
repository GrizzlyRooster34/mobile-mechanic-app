import type { AISession, AIMessage, SafetyAlert } from '~/types/ai';

export class AISessionManager {
  private sessions: Map<string, AISession> = new Map();

  createSession(agentId: string, userId?: string, context?: Record<string, any>): string {
    const sessionId = this.generateSessionId();
    const session: AISession = {
      id: sessionId,
      agentId,
      userId,
      context: context || {},
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  getSession(sessionId: string): AISession | null {
    return this.sessions.get(sessionId) || null;
  }

  addMessage(sessionId: string, message: Omit<AIMessage, 'id' | 'sessionId'>): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const aiMessage: AIMessage = {
      ...message,
      id: this.generateMessageId(),
      sessionId,
    };

    session.messages.push(aiMessage);
    session.updatedAt = new Date();
  }

  updateContext(sessionId: string, context: Record<string, any>): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.context = { ...session.context, ...context };
    session.updatedAt = new Date();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clean up old sessions (call periodically)
  cleanupOldSessions(maxAgeHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.updatedAt < cutoffTime) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

export class SafetyChecker {
  private static readonly DANGER_KEYWORDS = [
    'electrical', 'high voltage', 'battery', 'airbag', 'brake fluid',
    'transmission fluid', 'coolant', 'hot', 'pressure', 'gas', 'fuel',
    'exhaust', 'carbon monoxide', 'lift', 'jack', 'suspension'
  ];

  private static readonly WARNING_KEYWORDS = [
    'torque', 'specification', 'sequence', 'timing', 'alignment',
    'calibration', 'programming', 'reset', 'relearn', 'adaptation'
  ];

  static checkForSafetyIssues(message: string, context?: Record<string, any>): SafetyAlert[] {
    const alerts: SafetyAlert[] = [];
    const lowerMessage = message.toLowerCase();

    // Check for danger keywords
    for (const keyword of this.DANGER_KEYWORDS) {
      if (lowerMessage.includes(keyword)) {
        alerts.push({
          level: 'danger',
          message: `Working with ${keyword} requires special safety precautions. Ensure proper PPE and follow safety protocols.`,
          category: this.categorizeSafetyIssue(keyword),
          requiredPPE: this.getRequiredPPE(keyword),
        });
      }
    }

    // Check for warning keywords
    for (const keyword of this.WARNING_KEYWORDS) {
      if (lowerMessage.includes(keyword)) {
        alerts.push({
          level: 'warning',
          message: `Pay special attention to ${keyword} requirements. Refer to manufacturer specifications.`,
          category: 'procedural',
        });
      }
    }

    // Context-based safety checks
    if (context?.currentJob?.vehicleInfo) {
      const vehicle = context.currentJob.vehicleInfo;
      if (vehicle.year && vehicle.year > 2010) {
        alerts.push({
          level: 'info',
          message: 'Modern vehicle detected. Be aware of advanced safety systems and electronic components.',
          category: 'electrical',
        });
      }
    }

    return alerts;
  }

  private static categorizeSafetyIssue(keyword: string): SafetyAlert['category'] {
    const electrical = ['electrical', 'high voltage', 'battery'];
    const chemical = ['brake fluid', 'transmission fluid', 'coolant', 'gas', 'fuel'];
    const mechanical = ['lift', 'jack', 'suspension', 'pressure'];
    const environmental = ['exhaust', 'carbon monoxide', 'hot'];

    if (electrical.includes(keyword)) return 'electrical';
    if (chemical.includes(keyword)) return 'chemical';
    if (mechanical.includes(keyword)) return 'mechanical';
    if (environmental.includes(keyword)) return 'environmental';
    
    return 'procedural';
  }

  private static getRequiredPPE(keyword: string): string[] {
    const ppeMap: Record<string, string[]> = {
      'electrical': ['Insulated gloves', 'Safety glasses', 'Non-conductive footwear'],
      'high voltage': ['Class 0 electrical gloves', 'Arc flash suit', 'Face shield'],
      'battery': ['Chemical resistant gloves', 'Safety glasses', 'Apron'],
      'brake fluid': ['Nitrile gloves', 'Safety glasses'],
      'hot': ['Heat resistant gloves', 'Long sleeves'],
      'lift': ['Steel toe boots', 'Hard hat'],
      'exhaust': ['Respirator', 'Ventilation'],
    };

    return ppeMap[keyword] || ['Safety glasses', 'Work gloves'];
  }
}

export class MessageProcessor {
  static extractVehicleInfo(message: string): Partial<{ make: string; model: string; year: number; vin: string }> {
    const vehicleInfo: Partial<{ make: string; model: string; year: number; vin: string }> = {};

    // Extract year (4 digits between 1900-2030)
    const yearMatch = message.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      vehicleInfo.year = parseInt(yearMatch[0]);
    }

    // Extract VIN (17 characters, alphanumeric, no I, O, Q)
    const vinMatch = message.match(/\b[A-HJ-NPR-Z0-9]{17}\b/i);
    if (vinMatch) {
      vehicleInfo.vin = vinMatch[0].toUpperCase();
    }

    // Common car makes (simplified list)
    const makes = [
      'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW', 'Mercedes',
      'Audi', 'Volkswagen', 'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Lexus'
    ];

    for (const make of makes) {
      if (message.toLowerCase().includes(make.toLowerCase())) {
        vehicleInfo.make = make;
        break;
      }
    }

    return vehicleInfo;
  }

  static extractDiagnosticCodes(message: string): string[] {
    // Extract OBD-II codes (P, B, C, U followed by 4 digits)
    const codeMatches = message.match(/[PBCU]\d{4}/gi);
    return codeMatches ? codeMatches.map(code => code.toUpperCase()) : [];
  }

  static extractSymptoms(message: string): string[] {
    const symptomKeywords = [
      'noise', 'sound', 'vibration', 'shake', 'rough', 'stall', 'hesitate',
      'leak', 'smoke', 'smell', 'grinding', 'squealing', 'clicking',
      'knocking', 'rattling', 'burning', 'overheating', 'hard to start'
    ];

    const symptoms: string[] = [];
    const lowerMessage = message.toLowerCase();

    for (const keyword of symptomKeywords) {
      if (lowerMessage.includes(keyword)) {
        symptoms.push(keyword);
      }
    }

    return symptoms;
  }

  static prioritizeMessage(message: string, context?: Record<string, any>): 'low' | 'medium' | 'high' | 'urgent' {
    const lowerMessage = message.toLowerCase();

    // Urgent keywords
    const urgentKeywords = [
      'emergency', 'urgent', 'immediate', 'critical', 'dangerous', 'unsafe',
      'breakdown', 'stranded', 'accident', 'fire', 'smoke', 'leak'
    ];

    // High priority keywords
    const highKeywords = [
      'brake', 'steering', 'engine', 'transmission', 'electrical',
      'overheating', 'stalling', 'no start'
    ];

    // Medium priority keywords
    const mediumKeywords = [
      'noise', 'vibration', 'maintenance', 'service', 'inspection',
      'oil change', 'tire', 'battery'
    ];

    if (urgentKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'urgent';
    }

    if (highKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'high';
    }

    if (mediumKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'medium';
    }

    return 'low';
  }
}

export class ResponseFormatter {
  static formatDiagnosticResponse(diagnostics: any[]): string {
    if (!diagnostics || diagnostics.length === 0) {
      return "No specific diagnostic suggestions available at this time.";
    }

    let response = "Based on the information provided, here are the diagnostic suggestions:\n\n";

    diagnostics.forEach((diagnostic, index) => {
      response += `${index + 1}. **${diagnostic.issue}** (${Math.round(diagnostic.probability * 100)}% probability)\n`;
      if (diagnostic.tests && diagnostic.tests.length > 0) {
        response += `   Recommended tests: ${diagnostic.tests.join(', ')}\n`;
      }
      if (diagnostic.parts && diagnostic.parts.length > 0) {
        response += `   Potential parts needed: ${diagnostic.parts.join(', ')}\n`;
      }
      response += '\n';
    });

    return response;
  }

  static formatPartsResponse(parts: any[]): string {
    if (!parts || parts.length === 0) {
      return "No specific parts recommendations available at this time.";
    }

    let response = "Here are the recommended parts for this repair:\n\n";

    parts.forEach((part, index) => {
      response += `${index + 1}. **${part.description}**\n`;
      response += `   Part Number: ${part.partNumber}\n`;
      response += `   Estimated Cost: $${part.estimatedCost.toFixed(2)}\n`;
      response += `   Availability: ${part.availability.replace('_', ' ')}\n`;
      if (part.supplier) {
        response += `   Supplier: ${part.supplier}\n`;
      }
      response += '\n';
    });

    return response;
  }

  static formatProcedureResponse(steps: any[]): string {
    if (!steps || steps.length === 0) {
      return "No specific procedure steps available at this time.";
    }

    let response = "Here's the step-by-step procedure:\n\n";

    steps.forEach((step) => {
      response += `**Step ${step.step}:** ${step.description}\n`;
      if (step.tools && step.tools.length > 0) {
        response += `Tools needed: ${step.tools.join(', ')}\n`;
      }
      if (step.estimatedTime) {
        response += `Estimated time: ${step.estimatedTime} minutes\n`;
      }
      if (step.safetyNotes && step.safetyNotes.length > 0) {
        response += `⚠️ Safety notes: ${step.safetyNotes.join('; ')}\n`;
      }
      response += '\n';
    });

    return response;
  }
}

// Singleton instances
export const sessionManager = new AISessionManager();

// Utility functions
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function isValidVIN(vin: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`;
}