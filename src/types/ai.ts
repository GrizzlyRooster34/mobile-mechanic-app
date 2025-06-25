// AI Agent Types
export interface AIAgent {
  id: string;
  name: string;
  type: 'customer-support' | 'mechanic-assistant';
  status: 'active' | 'inactive' | 'maintenance';
  capabilities: string[];
  configuration: Record<string, any>;
}

export interface AISession {
  id: string;
  agentId: string;
  userId?: string;
  context: Record<string, any>;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface AIMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AIResponse {
  message: string;
  confidence?: number;
  suggestions?: string[];
  actions?: AIAction[];
  metadata?: Record<string, any>;
}

export interface AIAction {
  type: string;
  label: string;
  data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

// Customer Support Specific Types
export interface CustomerSupportAgent extends AIAgent {
  type: 'customer-support';
  capabilities: [
    'booking_appointments',
    'troubleshooting',
    'pricing_inquiries',
    'service_status_updates',
    'payment_questions',
    'general_support'
  ];
}

export interface CustomerContext {
  customerId?: string;
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
    preferredContactMethod?: 'phone' | 'email' | 'sms';
  };
  vehicleInfo?: VehicleInfo;
  serviceHistory?: ServiceRecord[];
  currentAppointment?: AppointmentInfo;
  paymentInfo?: PaymentInfo;
}

export interface VehicleInfo {
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  mileage?: number;
  color?: string;
  licensePlate?: string;
}

export interface ServiceRecord {
  id: string;
  date: Date;
  serviceType: string;
  description: string;
  cost: number;
  mechanicId: string;
  status: 'completed' | 'in_progress' | 'cancelled';
}

export interface AppointmentInfo {
  id?: string;
  scheduledDate?: Date;
  location?: string;
  serviceType?: string;
  status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  estimatedDuration?: number;
  specialInstructions?: string;
}

export interface PaymentInfo {
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
  lastPaymentStatus?: 'success' | 'failed' | 'pending';
  outstandingBalance?: number;
  paymentMethod?: string;
}

// Mechanic Assistant Specific Types
export interface MechanicAssistantAgent extends AIAgent {
  type: 'mechanic-assistant';
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
  ];
}

export interface MechanicContext {
  mechanicId: string;
  mechanicInfo?: {
    name: string;
    certifications: string[];
    specializations: string[];
    experienceYears: number;
  };
  currentJob?: JobInfo;
  tools?: ToolInfo[];
  location?: LocationInfo;
  workSchedule?: WorkSchedule;
}

export interface JobInfo {
  id: string;
  customerId: string;
  vehicleInfo: VehicleInfo;
  symptoms: string[];
  diagnosticCodes?: string[];
  diagnosis?: DiagnosisInfo;
  partsNeeded?: PartInfo[];
  laborEstimate?: LaborEstimate;
  status: 'diagnostic' | 'quoted' | 'approved' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedCompletion?: Date;
  actualCompletion?: Date;
  notes?: string[];
}

export interface DiagnosisInfo {
  primaryIssue: string;
  secondaryIssues?: string[];
  rootCause?: string;
  confidence: number;
  recommendedTests?: string[];
  safetyNotes?: string[];
}

export interface PartInfo {
  partNumber: string;
  description: string;
  manufacturer: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  availability: 'in_stock' | 'order_required' | 'backordered' | 'discontinued';
  supplier: string;
  estimatedDelivery?: Date;
  warranty?: string;
}

export interface LaborEstimate {
  hours: number;
  rate: number;
  totalCost: number;
  breakdown?: Array<{
    task: string;
    hours: number;
    rate: number;
  }>;
}

export interface ToolInfo {
  name: string;
  type: string;
  available: boolean;
  condition: 'excellent' | 'good' | 'fair' | 'needs_maintenance';
  lastCalibrated?: Date;
}

export interface LocationInfo {
  latitude: number;
  longitude: number;
  address: string;
  serviceRadius: number;
  travelTime?: number;
}

export interface WorkSchedule {
  currentShift: {
    start: Date;
    end: Date;
    type: 'regular' | 'overtime' | 'emergency';
  };
  upcomingJobs: Array<{
    jobId: string;
    scheduledTime: Date;
    estimatedDuration: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }>;
  availability: {
    today: number; // hours available
    thisWeek: number;
  };
}

// Diagnostic and Repair Types
export interface DiagnosticSuggestion {
  issue: string;
  probability: number;
  symptoms: string[];
  tests: string[];
  parts?: string[];
  estimatedCost?: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface RepairProcedure {
  id: string;
  title: string;
  description: string;
  steps: RepairStep[];
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  requiredTools: string[];
  safetyNotes: string[];
  warnings: string[];
}

export interface RepairStep {
  stepNumber: number;
  description: string;
  tools: string[];
  parts?: string[];
  safetyNotes?: string[];
  estimatedTime: number;
  images?: string[];
  videos?: string[];
}

export interface SafetyAlert {
  level: 'info' | 'warning' | 'danger' | 'critical';
  message: string;
  category: 'electrical' | 'mechanical' | 'chemical' | 'environmental' | 'procedural';
  requiredPPE?: string[];
  emergencyProcedure?: string;
}

// Integration Types
export interface AIIntegrationConfig {
  customerSupportAgent: {
    enabled: boolean;
    agentId: string;
    apiUrl: string;
    features: string[];
  };
  mechanicAssistantAgent: {
    enabled: boolean;
    agentId: string;
    apiUrl: string;
    features: string[];
  };
  general: {
    timeout: number;
    maxRetries: number;
    rateLimit: number;
    fallbackEnabled: boolean;
  };
}

export interface AIMetrics {
  totalSessions: number;
  activeSessions: number;
  averageResponseTime: number;
  successRate: number;
  customerSatisfaction?: number;
  commonQueries: Array<{
    query: string;
    count: number;
    category: string;
  }>;
  errorRate: number;
  lastUpdated: Date;
}