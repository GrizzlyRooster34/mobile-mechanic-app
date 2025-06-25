import { getAbacusAIClient, type ChatRequest, type ChatResponse } from './abacus-client';

export interface CustomerSupportContext {
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
}

export interface CustomerSupportRequest {
  message: string;
  sessionId?: string;
  customerId?: string;
  context?: CustomerSupportContext;
}

export interface CustomerSupportResponse extends ChatResponse {
  actionRequired?: {
    type: 'booking' | 'payment' | 'escalation' | 'information';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    details: Record<string, any>;
  };
  suggestedResponses?: string[];
}

export class CustomerSupportAgent {
  private client = getAbacusAIClient();
  private agentId = process.env.CUSTOMER_SUPPORT_AGENT_ID || 'c816aa206';

  async handleCustomerQuery(request: CustomerSupportRequest): Promise<CustomerSupportResponse> {
    try {
      const chatRequest: ChatRequest = {
        message: request.message,
        sessionId: request.sessionId,
        userId: request.customerId,
        agentId: this.agentId,
        context: {
          agentType: 'customer-support',
          customerContext: request.context,
          capabilities: [
            'booking_appointments',
            'troubleshooting',
            'pricing_inquiries',
            'service_status_updates',
            'payment_questions',
            'general_support'
          ],
          businessHours: {
            monday: '8:00-18:00',
            tuesday: '8:00-18:00',
            wednesday: '8:00-18:00',
            thursday: '8:00-18:00',
            friday: '8:00-18:00',
            saturday: '9:00-16:00',
            sunday: 'closed'
          },
          serviceAreas: ['Greater Metro Area', 'Surrounding Counties'],
          emergencyContact: process.env.EMERGENCY_CONTACT_NUMBER,
        },
      };

      const response = await this.client.sendMessage(chatRequest);

      return {
        ...response,
        actionRequired: this.parseActionRequired(response),
        suggestedResponses: this.generateSuggestedResponses(request.message, response),
      };
    } catch (error) {
      console.error('Customer support agent error:', error);
      return this.getFallbackResponse(request);
    }
  }

  private parseActionRequired(response: ChatResponse): CustomerSupportResponse['actionRequired'] {
    // Parse AI response for action indicators
    const message = response.response.toLowerCase();
    
    if (message.includes('book') || message.includes('schedule') || message.includes('appointment')) {
      return {
        type: 'booking',
        priority: 'medium',
        details: { suggestedAction: 'schedule_appointment' }
      };
    }
    
    if (message.includes('payment') || message.includes('billing') || message.includes('charge')) {
      return {
        type: 'payment',
        priority: 'medium',
        details: { suggestedAction: 'handle_payment_inquiry' }
      };
    }
    
    if (message.includes('urgent') || message.includes('emergency') || message.includes('immediate')) {
      return {
        type: 'escalation',
        priority: 'urgent',
        details: { suggestedAction: 'escalate_to_human' }
      };
    }

    return undefined;
  }

  private generateSuggestedResponses(userMessage: string, aiResponse: ChatResponse): string[] {
    const suggestions: string[] = [];
    
    // Add contextual quick responses based on the conversation
    if (userMessage.toLowerCase().includes('appointment')) {
      suggestions.push('What times work best for you?');
      suggestions.push('Would you prefer morning or afternoon?');
    }
    
    if (userMessage.toLowerCase().includes('cost') || userMessage.toLowerCase().includes('price')) {
      suggestions.push('Would you like a detailed breakdown?');
      suggestions.push('Are there any specific services you\'re interested in?');
    }
    
    // Always include these general options
    suggestions.push('Is there anything else I can help you with?');
    suggestions.push('Would you like me to connect you with a mechanic?');
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  private getFallbackResponse(request: CustomerSupportRequest): CustomerSupportResponse {
    return {
      response: "I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment, or if this is urgent, you can call our emergency line. How else can I assist you today?",
      sessionId: request.sessionId || `fallback_${Date.now()}`,
      suggestions: [
        'Try asking your question again',
        'Contact emergency support',
        'Schedule a callback'
      ],
      actionRequired: {
        type: 'escalation',
        priority: 'medium',
        details: { reason: 'technical_difficulty' }
      }
    };
  }

  async getCustomerHistory(customerId: string): Promise<any[]> {
    try {
      // This would integrate with your existing database
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error('Failed to get customer history:', error);
      return [];
    }
  }
}

// Singleton instance
let customerSupportAgent: CustomerSupportAgent | null = null;

export function getCustomerSupportAgent(): CustomerSupportAgent {
  if (!customerSupportAgent) {
    customerSupportAgent = new CustomerSupportAgent();
  }
  return customerSupportAgent;
}