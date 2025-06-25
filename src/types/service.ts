export interface ServiceRequest {
  id: string;
  type: ServiceType;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  status: 'pending' | 'quoted' | 'accepted' | 'in_progress' | 'completed';
  createdAt: Date;
  scheduledAt?: Date;
  completedAt?: Date;
  estimatedCost?: number;
  photos?: string[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  vehicleId: string;
  vinNumber?: string;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  aiDiagnosis?: DiagnosticResult;
  signatureData?: string;
  signatureCapturedAt?: Date;
  signatureCapturedBy?: string;
  workLogs?: JobLog[];
  paymentStatus?: 'pending' | 'deposit_paid' | 'paid' | 'refunded';
  depositAmount?: number;
  assignedMechanicId?: string;
  claimedAt?: Date;
  completedBy?: string;
  requiredTools?: string[];
  toolsChecked?: { [toolId: string]: boolean };
  toolsCheckCompletedAt?: Date;
  toolsNotes?: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  licensePlate?: string;
  color?: string;
  mileage?: number;
  engine?: string;
  trim?: string;
  transmission?: string;
  lastServiceDate?: Date;
  nextServiceDue?: Date;
  maintenanceHistory?: MaintenanceRecord[];
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address?: string;
  preferredContactMethod?: 'phone' | 'email' | 'sms';
}

export type ServiceType = 
  | 'oil_change'
  | 'brake_service'
  | 'tire_service'
  | 'battery_service'
  | 'engine_diagnostic'
  | 'transmission'
  | 'ac_service'
  | 'general_repair'
  | 'emergency_roadside';

export interface Quote {
  id: string;
  serviceRequestId: string;
  description: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  estimatedDuration: number;
  validUntil: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'deposit_paid' | 'paid';
  stripePaymentUrl?: string;
  stripeSessionId?: string;
  paidAt?: Date;
  paymentType?: 'deposit' | 'full';
  depositAmount?: number;
  depositPaidAt?: Date;
  remainingBalance?: number;
  paymentMethod?: 'card' | 'apple_pay' | 'google_pay';
}

export interface ChatMessage {
  id: string;
  serviceRequestId: string;
  senderId: string;
  senderName: string;
  senderType: 'customer' | 'mechanic';
  message: string;
  timestamp: Date;
  isRead: boolean;
  attachments?: {
    type: 'image' | 'document';
    url: string;
    name: string;
  }[];
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  serviceType: ServiceType;
  description: string;
  cost: number;
  mileage?: number;
  performedAt: Date;
  nextDueDate?: Date;
  nextDueMileage?: number;
  reminderSent?: boolean;
  mechanicName?: string;
  notes?: string;
}

export interface MaintenanceReminder {
  id: string;
  vehicleId: string;
  serviceType: ServiceType;
  dueDate: Date;
  dueMileage?: number;
  isOverdue: boolean;
  reminderSent: boolean;
  priority: 'low' | 'medium' | 'high';
  reason?: string;
  dismissedAt?: Date;
  completed?: boolean;
  completedAt?: Date;
}

// AI Diagnostic Types
export interface AIAssistantInput {
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    mileage?: number;
    engine?: string;
    vin?: string;
  };
  symptoms: string;
  additionalContext?: string;
}

export interface DiagnosticResult {
  id: string;
  likelyCauses: string[];
  diagnosticSteps: string[];
  matchedServices: string[];
  confidence: 'low' | 'medium' | 'high';
  estimatedCost?: {
    min: number;
    max: number;
  };
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  recommendedServiceTypes?: ServiceType[];
  createdAt: Date;
}

// Work Timer & Job Log Types
export interface JobLog {
  id: string;
  jobId: string;
  mechanicId: string;
  mechanicName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  description?: string;
  signatureData?: string;
  signedBy?: string;
  createdAt: Date;
  isPaused?: boolean;
  pausedDuration?: number; // in milliseconds
}

export interface WorkSession {
  id: string;
  jobId: string;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  isPaused?: boolean;
  pausedAt?: Date;
  totalPausedTime?: number; // in milliseconds
  notes?: string;
}

// Tools & Equipment Types
export interface ServiceTool {
  id: string;
  name: string;
  category: 'basic' | 'specialized' | 'diagnostic' | 'safety';
  required: boolean;
  description?: string;
}

export interface ToolCheckItem {
  toolId: string;
  toolName: string;
  checked: boolean;
  checkedAt?: Date;
  notes?: string;
}

// Maintenance Intervals
export interface MaintenanceInterval {
  serviceType: ServiceType;
  intervalDays: number;
  intervalMiles?: number;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: 'routine' | 'preventive' | 'safety';
}

// Signature Capture Types
export interface SignatureData {
  id: string;
  jobId: string;
  customerName: string;
  signatureDataURL: string;
  timestamp: Date;
  ipAddress?: string;
  deviceInfo?: string;
}

// VIN Decoder Types
export interface VinData {
  vin: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  engine?: string;
  transmission?: string;
  bodyStyle?: string;
  fuelType?: string;
  driveType?: string;
}

// Payment Types
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  clientSecret: string;
  paymentMethodTypes: string[];
  metadata?: Record<string, string>;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'apple_pay' | 'google_pay';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault?: boolean;
}

// Notification Types
export interface NotificationPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  maintenanceReminders: boolean;
  serviceUpdates: boolean;
  promotionalOffers: boolean;
}

// Location Types
export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

// File Upload Types
export interface FileUpload {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

// Production Environment Types
export interface ProductionConfig {
  isProduction: boolean;
  mechanicId: string;
  mechanicName: string;
  mechanicEmail: string;
  allowedMechanics: string[];
  enableLogging: boolean;
  enableAnalytics: boolean;
}

// Settings Types
export interface MechanicSettings {
  availability: {
    isAvailable: boolean;
    workingDays: {
      monday: boolean;
      tuesday: boolean;
      wednesday: boolean;
      thursday: boolean;
      friday: boolean;
      saturday: boolean;
      sunday: boolean;
    };
    workingHours: {
      start: string;
      end: string;
    };
    emergencyAvailable: boolean;
    maxJobsPerDay: number;
    travelRadius: number;
    autoAcceptJobs: boolean;
  };
  notifications: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    jobUpdates: boolean;
    maintenanceReminders: boolean;
    promotionalOffers: boolean;
    emergencyAlerts: boolean;
  };
  pricing: {
    laborRate: number;
    emergencyRate: number;
    travelFee: number;
    minimumCharge: number;
    servicePricing: {
      [key in ServiceType]: {
        basePrice: number;
        laborRate: number;
        estimatedHours: number;
      };
    };
    discounts: {
      seniorDiscount: number;
      militaryDiscount: number;
      repeatCustomerDiscount: number;
    };
  };
  tools: {
    availableTools: { [toolId: string]: boolean };
    customTools: ServiceTool[];
    toolConditions: { [toolId: string]: 'excellent' | 'good' | 'fair' | 'needs_replacement' };
    toolNotes: { [toolId: string]: string };
  };
}