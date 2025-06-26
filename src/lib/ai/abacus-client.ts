import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { z } from 'zod';

// Types and schemas
export const AIAgentMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.date().optional(),
  metadata: z.record(z.any()).optional(),
});

export const AIAgentResponseSchema = z.object({
  id: z.string(),
  message: z.string(),
  confidence: z.number().min(0).max(1).optional(),
  suggestions: z.array(z.string()).optional(),
  actions: z.array(z.object({
    type: z.string(),
    label: z.string(),
    data: z.record(z.any()).optional(),
  })).optional(),
  metadata: z.record(z.any()).optional(),
});

export const AIAgentSessionSchema = z.object({
  sessionId: z.string(),
  userId: z.string().optional(),
  agentType: z.enum(['customer-support', 'mechanic-assistant']),
  context: z.record(z.any()).optional(),
  messages: z.array(AIAgentMessageSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AIAgentMessage = z.infer<typeof AIAgentMessageSchema>;
export type AIAgentResponse = z.infer<typeof AIAgentResponseSchema>;
export type AIAgentSession = z.infer<typeof AIAgentSessionSchema>;

export interface AbacusAIConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
  maxRetries?: number;
  rateLimit?: number;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  userId?: string;
  context?: Record<string, any>;
  agentId: string;
}

export interface ChatResponse {
  response: string;
  sessionId: string;
  suggestions?: string[];
  actions?: Array<{
    type: string;
    label: string;
    data?: Record<string, any>;
  }>;
  confidence?: number;
  metadata?: Record<string, any>;
}

export class AbacusAIClient {
  private client: AxiosInstance;
  private config: AbacusAIConfig;

  constructor(config: AbacusAIConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for rate limiting
    this.client.interceptors.request.use(
      (config) => {
        // Add timestamp for rate limiting
        (config as any).metadata = { ...(config as any).metadata, requestTime: Date.now() };
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          // Rate limit exceeded, implement exponential backoff
          const retryAfter = error.response.headers['retry-after'] || 1;
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return this.client.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await this.client.post(`/chat/${request.agentId}`, {
        message: request.message,
        session_id: request.sessionId,
        user_id: request.userId,
        context: request.context,
      });

      return {
        response: response.data.message || response.data.response,
        sessionId: response.data.session_id || request.sessionId || this.generateSessionId(),
        suggestions: response.data.suggestions,
        actions: response.data.actions,
        confidence: response.data.confidence,
        metadata: response.data.metadata,
      };
    } catch (error) {
      console.error('AbacusAI API Error:', error);
      throw new Error(`Failed to send message to AI agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSession(sessionId: string): Promise<AIAgentSession | null> {
    try {
      const response = await this.client.get(`/sessions/${sessionId}`);
      return AIAgentSessionSchema.parse(response.data);
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  async createSession(agentType: 'customer-support' | 'mechanic-assistant', userId?: string, context?: Record<string, any>): Promise<string> {
    try {
      const sessionId = this.generateSessionId();
      const session: Omit<AIAgentSession, 'createdAt' | 'updatedAt'> = {
        sessionId,
        userId,
        agentType,
        context,
        messages: [],
      };

      await this.client.post('/sessions', {
        ...session,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return sessionId;
    } catch (error) {
      console.error('Failed to create session:', error);
      return this.generateSessionId(); // Fallback to local session ID
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch (error) {
      console.error('AI service health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
let abacusClient: AbacusAIClient | null = null;

export function getAbacusAIClient(): AbacusAIClient {
  if (!abacusClient) {
    const config: AbacusAIConfig = {
      apiKey: process.env.ABACUS_AI_API_KEY || '',
      baseUrl: process.env.ABACUS_AI_BASE_URL || 'https://api.abacus.ai',
      timeout: parseInt(process.env.AI_AGENT_TIMEOUT || '30000'),
      maxRetries: parseInt(process.env.AI_AGENT_MAX_RETRIES || '3'),
      rateLimit: parseInt(process.env.AI_AGENT_RATE_LIMIT || '100'),
    };

    if (!config.apiKey) {
      throw new Error('ABACUS_AI_API_KEY environment variable is required');
    }

    abacusClient = new AbacusAIClient(config);
  }

  return abacusClient;
}