import { getAbacusAIClient, type ChatRequest, type ChatResponse } from './abacus-client';

export interface MechanicContext {
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
}

export interface MechanicAssistantRequest {
  message: string;
  sessionId?: string;
  mechanicId: string;
  context?: MechanicContext;
  attachments?: Array<{
    type: 'image' | 'video' | 'audio' | 'document';
    url: string;
    description?: string;
  }>;
}

export interface MechanicAssistantResponse extends ChatResponse {
  diagnosticSuggestions?: Array<{
    issue: string;
    probability: number;
    tests: string[];
    parts?: string[];
  }>;
  partsRecommendations?: Array<{
    partNumber: string;
    description: string;
    supplier: string;
    estimatedCost: number;
    availability: 'in_stock' | 'order_required' | 'unknown';
  }>;
  procedureSteps?: Array<{
    step: number;
    description: string;
    tools: string[];
    safetyNotes?: string[];
    estimatedTime: number; // in minutes
  }>;
  safetyAlerts?: Array<{
    level: 'info' | 'warning' | 'danger';
    message: string;
  }>;
}

export class MechanicAssistantAgent {
  private client = getAbacusAIClient();
  private agentId = process.env.MECHANIC_ASSISTANT_AGENT_ID || '';

  async assistMechanic(request: MechanicAssistantRequest): Promise<MechanicAssistantResponse> {
    try {
      const chatRequest: ChatRequest = {
        message: request.message,
        sessionId: request.sessionId,
        userId: request.mechanicId,
        agentId: this.agentId,
        context: {
          agentType: 'mechanic-assistant',
          mechanicContext: request.context,
          capabilities: [
            'diagnostic_assistance',
            'parts_identification',
            'repair_procedures',
            'scheduling_management',
            'customer_communication',
            'workflow_optimization',
            'safety_guidance',
            'vin_decoding',
            'maintenance_schedules'
          ],
          knowledgeBase: {
            vehicleDatabase: true,
            repairProcedures: true,
            partsDatabase: true,
            diagnosticCodes: true,
            safetyProtocols: true,
            manufacturerBulletins: true
          },
          attachments: request.attachments,
        },
      };

      const response = await this.client.sendMessage(chatRequest);

      return {
        ...response,
        diagnosticSuggestions: this.parseDiagnosticSuggestions(response),
        partsRecommendations: this.parsePartsRecommendations(response),
        procedureSteps: this.parseProcedureSteps(response),
        safetyAlerts: this.parseSafetyAlerts(response),
      };
    } catch (error) {
      console.error('Mechanic assistant agent error:', error);
      return this.getFallbackResponse(request);
    }
  }

  private parseDiagnosticSuggestions(response: ChatResponse): MechanicAssistantResponse['diagnosticSuggestions'] {
    // Parse AI response for diagnostic suggestions
    // This would be enhanced based on the actual AI response format
    return [];
  }

  private parsePartsRecommendations(response: ChatResponse): MechanicAssistantResponse['partsRecommendations'] {
    // Parse AI response for parts recommendations
    return [];
  }

  private parseProcedureSteps(response: ChatResponse): MechanicAssistantResponse['procedureSteps'] {
    // Parse AI response for procedure steps
    return [];
  }

  private parseSafetyAlerts(response: ChatResponse): MechanicAssistantResponse['safetyAlerts'] {
    const message = response.response.toLowerCase();
    const alerts: MechanicAssistantResponse['safetyAlerts'] = [];

    // Check for safety keywords
    if (message.includes('danger') || message.includes('hazard')) {
      alerts.push({
        level: 'danger',
        message: 'Safety hazard detected. Please review safety protocols before proceeding.'
      });
    }

    if (message.includes('caution') || message.includes('warning')) {
      alerts.push({
        level: 'warning',
        message: 'Exercise caution when performing this procedure.'
      });
    }

    return alerts;
  }

  private getFallbackResponse(request: MechanicAssistantRequest): MechanicAssistantResponse {
    return {
      response: "I'm currently experiencing technical difficulties. Please refer to your service manual or contact technical support for immediate assistance. Safety should always be your first priority.",
      sessionId: request.sessionId || `fallback_${Date.now()}`,
      suggestions: [
        'Check service manual',
        'Contact technical support',
        'Consult with senior mechanic'
      ],
      safetyAlerts: [{
        level: 'warning',
        message: 'AI assistant unavailable. Proceed with extra caution and follow standard safety protocols.'
      }]
    };
  }

  async decodeVIN(vin: string): Promise<any> {
    try {
      const request: ChatRequest = {
        message: `Decode VIN: ${vin}`,
        agentId: this.agentId,
        context: {
          task: 'vin_decode',
          vin: vin
        }
      };

      const response = await this.client.sendMessage(request);
      return this.parseVINData(response.response);
    } catch (error) {
      console.error('VIN decode error:', error);
      return null;
    }
  }

  private parseVINData(response: string): any {
    try {
      // Try to parse JSON response from AI first
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.make || parsed.model || parsed.year) {
          return parsed;
        }
      }
    } catch (error) {
      console.log('Failed to parse JSON from AI response, falling back to manual parsing');
    }

    // Fallback: Extract data from text response
    const vinData: any = {
      make: this.extractField(response, ['make', 'manufacturer']),
      model: this.extractField(response, ['model']),
      year: this.extractYear(response),
      engine: this.extractField(response, ['engine', 'motor']),
      transmission: this.extractField(response, ['transmission', 'trans']),
      bodyStyle: this.extractField(response, ['body style', 'body type', 'style']),
      drivetrain: this.extractField(response, ['drivetrain', 'drive', 'awd', 'fwd', 'rwd']),
      fuelType: this.extractField(response, ['fuel', 'gas', 'diesel', 'electric', 'hybrid']),
      country: this.extractField(response, ['country', 'origin', 'manufactured']),
      plantLocation: this.extractField(response, ['plant', 'factory', 'assembly'])
    };

    // Clean up empty values
    Object.keys(vinData).forEach(key => {
      if (!vinData[key] || vinData[key] === '') {
        delete vinData[key];
      }
    });

    return vinData;
  }

  private extractField(text: string, keywords: string[]): string {
    const lowerText = text.toLowerCase();
    
    for (const keyword of keywords) {
      const patterns = [
        new RegExp(`${keyword}:?\\s*([^\\n,]+)`, 'i'),
        new RegExp(`${keyword}\\s+is\\s+([^\\n,]+)`, 'i'),
        new RegExp(`${keyword}\\s*=\\s*([^\\n,]+)`, 'i')
      ];
      
      for (const pattern of patterns) {
        const match = lowerText.match(pattern);
        if (match && match[1]) {
          return match[1].trim().replace(/['"]/g, '');
        }
      }
    }
    
    return '';
  }

  private extractYear(text: string): number {
    const yearMatch = text.match(/(?:year|model year):?\s*(\d{4})/i);
    if (yearMatch && yearMatch[1]) {
      const year = parseInt(yearMatch[1]);
      if (year >= 1980 && year <= new Date().getFullYear() + 1) {
        return year;
      }
    }
    
    // Look for 4-digit years in general
    const years = text.match(/\b(19\d{2}|20\d{2})\b/g);
    if (years) {
      for (const yearStr of years) {
        const year = parseInt(yearStr);
        if (year >= 1980 && year <= new Date().getFullYear() + 1) {
          return year;
        }
      }
    }
    
    return 0;
  }

  async getMaintenanceSchedule(vehicleInfo: { make: string; model: string; year: number; mileage: number }): Promise<any[]> {
    try {
      const request: ChatRequest = {
        message: `Get maintenance schedule for ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model} with ${vehicleInfo.mileage} miles`,
        agentId: this.agentId,
        context: {
          task: 'maintenance_schedule',
          vehicleInfo
        }
      };

      const response = await this.client.sendMessage(request);
      return this.parseMaintenanceSchedule(response.response);
    } catch (error) {
      console.error('Maintenance schedule error:', error);
      return [];
    }
  }

  private parseMaintenanceSchedule(response: string): any[] {
    // Parse maintenance schedule response
    return [];
  }
}

// Singleton instance
let mechanicAssistantAgent: MechanicAssistantAgent | null = null;

export function getMechanicAssistantAgent(): MechanicAssistantAgent {
  if (!mechanicAssistantAgent) {
    mechanicAssistantAgent = new MechanicAssistantAgent();
  }
  return mechanicAssistantAgent;
}