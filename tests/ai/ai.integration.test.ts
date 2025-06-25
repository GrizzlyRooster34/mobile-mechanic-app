import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { getAbacusAIClient } from '~/lib/ai/abacus-client';
import { getCustomerSupportAgent } from '~/lib/ai/customer-support';
import { getMechanicAssistantAgent } from '~/lib/ai/mechanic-assistant';

// Mock environment variables for testing
process.env.ABACUS_AI_API_KEY = 'test-api-key';
process.env.ABACUS_AI_BASE_URL = 'https://api.abacus.ai';
process.env.CUSTOMER_SUPPORT_AGENT_ID = 'c816aa206';
process.env.MECHANIC_ASSISTANT_AGENT_ID = 'test-mechanic-agent';

describe('AI Integration Tests', () => {
  let abacusClient: ReturnType<typeof getAbacusAIClient>;
  let customerAgent: ReturnType<typeof getCustomerSupportAgent>;
  let mechanicAgent: ReturnType<typeof getMechanicAssistantAgent>;

  beforeAll(() => {
    abacusClient = getAbacusAIClient();
    customerAgent = getCustomerSupportAgent();
    mechanicAgent = getMechanicAssistantAgent();
  });

  describe('AbacusAI Client', () => {
    it('should initialize with correct configuration', () => {
      expect(abacusClient).toBeDefined();
    });

    it('should generate valid session IDs', async () => {
      const sessionId = await abacusClient.createSession('customer-support', 'test-user');
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it('should handle API errors gracefully', async () => {
      // Mock a failed request
      const invalidRequest = {
        message: '',
        agentId: 'invalid-agent-id'
      };

      await expect(abacusClient.sendMessage(invalidRequest))
        .rejects
        .toThrow('Failed to send message to AI agent');
    });
  });

  describe('Customer Support Agent', () => {
    it('should handle basic customer queries', async () => {
      const response = await customerAgent.handleCustomerQuery({
        message: 'Hello, I need help with my car',
        customerId: 'test-customer-123'
      });

      expect(response).toHaveProperty('response');
      expect(response).toHaveProperty('sessionId');
      expect(typeof response.response).toBe('string');
      expect(response.response.length).toBeGreaterThan(0);
    });

    it('should detect booking requests', async () => {
      const response = await customerAgent.handleCustomerQuery({
        message: 'I need to schedule an appointment for my car',
        customerId: 'test-customer-123'
      });

      expect(response.actionRequired?.type).toBe('booking');
    });

    it('should detect payment inquiries', async () => {
      const response = await customerAgent.handleCustomerQuery({
        message: 'How much will this cost?',
        customerId: 'test-customer-123'
      });

      expect(response.actionRequired?.type).toBe('payment');
    });

    it('should detect emergency situations', async () => {
      const response = await customerAgent.handleCustomerQuery({
        message: 'This is urgent! My car broke down on the highway',
        customerId: 'test-customer-123'
      });

      expect(response.actionRequired?.type).toBe('escalation');
      expect(response.actionRequired?.priority).toBe('urgent');
    });

    it('should provide fallback response on error', async () => {
      // Simulate service failure
      const originalSendMessage = abacusClient.sendMessage;
      abacusClient.sendMessage = jest.fn().mockRejectedValue(new Error('Service unavailable'));

      const response = await customerAgent.handleCustomerQuery({
        message: 'Test message',
        customerId: 'test-customer-123'
      });

      expect(response.response).toContain('technical difficulties');
      expect(response.actionRequired?.type).toBe('escalation');

      // Restore original method
      abacusClient.sendMessage = originalSendMessage;
    });

    it('should include customer context in requests', async () => {
      const context = {
        customerName: 'John Doe',
        vehicleInfo: {
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          vin: '1HGBH41JXMN109186'
        }
      };

      const response = await customerAgent.handleCustomerQuery({
        message: 'What maintenance does my car need?',
        customerId: 'test-customer-123',
        context
      });

      expect(response).toHaveProperty('response');
      expect(response.sessionId).toBeDefined();
    });
  });

  describe('Mechanic Assistant Agent', () => {
    const mechanicContext = {
      mechanicId: 'test-mechanic-456',
      mechanicName: 'Mike Johnson',
      currentJob: {
        id: 'job-789',
        customerId: 'customer-123',
        vehicleInfo: {
          make: 'Honda',
          model: 'Civic',
          year: 2019,
          mileage: 60000
        },
        symptoms: ['engine noise', 'rough idle'],
        status: 'diagnostic' as const
      }
    };

    it('should handle diagnostic requests', async () => {
      const response = await mechanicAgent.assistMechanic({
        message: 'Customer reports engine knocking noise on acceleration',
        mechanicId: 'test-mechanic-456',
        context: mechanicContext
      });

      expect(response).toHaveProperty('response');
      expect(response).toHaveProperty('sessionId');
      expect(typeof response.response).toBe('string');
    });

    it('should provide safety alerts for dangerous procedures', async () => {
      const response = await mechanicAgent.assistMechanic({
        message: 'How do I work on the electrical system?',
        mechanicId: 'test-mechanic-456',
        context: mechanicContext
      });

      expect(response.safetyAlerts).toBeDefined();
      if (response.safetyAlerts && response.safetyAlerts.length > 0) {
        expect(response.safetyAlerts[0]).toHaveProperty('level');
        expect(response.safetyAlerts[0]).toHaveProperty('message');
      }
    });

    it('should handle VIN decoding requests', async () => {
      const vinData = await mechanicAgent.decodeVIN('1HGBH41JXMN109186');
      
      // VIN decoding might return null if service is unavailable
      if (vinData) {
        expect(vinData).toHaveProperty('make');
        expect(vinData).toHaveProperty('model');
        expect(vinData).toHaveProperty('year');
      }
    });

    it('should provide maintenance schedules', async () => {
      const schedule = await mechanicAgent.getMaintenanceSchedule({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        mileage: 45000
      });

      expect(Array.isArray(schedule)).toBe(true);
    });

    it('should provide fallback response on error', async () => {
      // Simulate service failure
      const originalSendMessage = abacusClient.sendMessage;
      abacusClient.sendMessage = jest.fn().mockRejectedValue(new Error('Service unavailable'));

      const response = await mechanicAgent.assistMechanic({
        message: 'Test message',
        mechanicId: 'test-mechanic-456',
        context: mechanicContext
      });

      expect(response.response).toContain('technical difficulties');
      expect(response.safetyAlerts).toBeDefined();
      expect(response.safetyAlerts?.[0]?.level).toBe('warning');

      // Restore original method
      abacusClient.sendMessage = originalSendMessage;
    });

    it('should handle file attachments', async () => {
      const attachments = [
        {
          type: 'image' as const,
          url: 'https://example.com/engine-photo.jpg',
          description: 'Engine bay photo showing the issue'
        }
      ];

      const response = await mechanicAgent.assistMechanic({
        message: 'Can you help me identify this part?',
        mechanicId: 'test-mechanic-456',
        context: mechanicContext,
        attachments
      });

      expect(response).toHaveProperty('response');
      expect(response.sessionId).toBeDefined();
    });
  });

  describe('Session Management', () => {
    it('should maintain conversation context', async () => {
      // First message
      const response1 = await customerAgent.handleCustomerQuery({
        message: 'Hello, I have a 2020 Toyota Camry',
        customerId: 'test-customer-123'
      });

      // Second message using same session
      const response2 = await customerAgent.handleCustomerQuery({
        message: 'What maintenance does it need?',
        customerId: 'test-customer-123',
        sessionId: response1.sessionId
      });

      expect(response2.sessionId).toBe(response1.sessionId);
    });

    it('should handle invalid session IDs gracefully', async () => {
      const response = await customerAgent.handleCustomerQuery({
        message: 'Test message',
        customerId: 'test-customer-123',
        sessionId: 'invalid-session-id'
      });

      expect(response).toHaveProperty('response');
      expect(response).toHaveProperty('sessionId');
    });
  });

  describe('Input Validation', () => {
    it('should handle empty messages', async () => {
      await expect(customerAgent.handleCustomerQuery({
        message: '',
        customerId: 'test-customer-123'
      })).rejects.toThrow();
    });

    it('should handle very long messages', async () => {
      const longMessage = 'a'.repeat(2000);
      
      await expect(customerAgent.handleCustomerQuery({
        message: longMessage,
        customerId: 'test-customer-123'
      })).rejects.toThrow();
    });

    it('should validate VIN format', async () => {
      await expect(mechanicAgent.decodeVIN('invalid-vin'))
        .rejects.toThrow();
    });

    it('should accept valid VIN format', async () => {
      // This might return null if service is unavailable, but shouldn't throw
      const result = await mechanicAgent.decodeVIN('1HGBH41JXMN109186');
      expect(result).toBeDefined(); // null or object, but not undefined
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      // Mock timeout
      const originalTimeout = process.env.AI_AGENT_TIMEOUT;
      process.env.AI_AGENT_TIMEOUT = '1'; // 1ms timeout

      const response = await customerAgent.handleCustomerQuery({
        message: 'Test timeout',
        customerId: 'test-customer-123'
      });

      // Should get fallback response
      expect(response.response).toContain('technical difficulties');

      // Restore timeout
      process.env.AI_AGENT_TIMEOUT = originalTimeout;
    });

    it('should handle malformed API responses', async () => {
      // Mock malformed response
      const originalSendMessage = abacusClient.sendMessage;
      abacusClient.sendMessage = jest.fn().mockResolvedValue({
        // Missing required fields
        invalidResponse: true
      });

      const response = await customerAgent.handleCustomerQuery({
        message: 'Test message',
        customerId: 'test-customer-123'
      });

      // Should handle gracefully
      expect(response).toHaveProperty('response');

      // Restore original method
      abacusClient.sendMessage = originalSendMessage;
    });
  });

  describe('Performance', () => {
    it('should respond within reasonable time', async () => {
      const startTime = Date.now();
      
      await customerAgent.handleCustomerQuery({
        message: 'Quick test message',
        customerId: 'test-customer-123'
      });

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(10000); // 10 seconds max
    });

    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        customerAgent.handleCustomerQuery({
          message: `Concurrent test message ${i}`,
          customerId: `test-customer-${i}`
        })
      );

      const responses = await Promise.all(promises);
      
      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response).toHaveProperty('response');
        expect(response).toHaveProperty('sessionId');
      });
    });
  });
});

// Integration test utilities
export class TestUtils {
  static createMockCustomerContext() {
    return {
      customerId: 'test-customer-123',
      customerName: 'John Doe',
      customerPhone: '+1-555-0123',
      customerEmail: 'john.doe@example.com',
      vehicleInfo: {
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '1HGBH41JXMN109186',
        mileage: 45000
      },
      currentJob: {
        id: 'job-456',
        status: 'in_progress',
        description: 'Oil change and inspection',
        estimatedCost: 75.00
      }
    };
  }

  static createMockMechanicContext() {
    return {
      mechanicId: 'test-mechanic-456',
      mechanicName: 'Mike Johnson',
      certifications: ['ASE Certified', 'Honda Specialist'],
      specializations: ['Engine Repair', 'Electrical Systems'],
      currentJob: {
        id: 'job-789',
        customerId: 'customer-123',
        vehicleInfo: {
          make: 'Honda',
          model: 'Civic',
          year: 2019,
          mileage: 60000
        },
        symptoms: ['engine noise', 'rough idle'],
        diagnosticCodes: ['P0300', 'P0171'],
        status: 'diagnostic' as const
      },
      tools: ['OBD Scanner', 'Multimeter', 'Compression Tester'],
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Main St, New York, NY'
      }
    };
  }

  static async waitForResponse(promise: Promise<any>, timeout = 5000): Promise<any> {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Test timeout')), timeout)
      )
    ]);
  }
}