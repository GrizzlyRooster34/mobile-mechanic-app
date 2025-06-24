// Service and Quote types
export interface Quote {
  id: string;
  customerId: string;
  mechanicId: string;
  serviceType: string;
  description: string;
  estimatedCost: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: ServiceCategory;
  estimatedDuration: number; // in minutes
}

export type ServiceCategory = 
  | 'oil_change'
  | 'brake_repair'
  | 'tire_service'
  | 'battery_service'
  | 'engine_diagnostics'
  | 'transmission'
  | 'electrical'
  | 'cooling_system'
  | 'suspension'
  | 'exhaust'
  | 'general_maintenance';

// Pricing types
export interface ServicePricing {
  generalRates: {
    laborRate: number;
    emergencyRate: number;
    travelRate: number;
    minimumCharge: number;
  };
  serviceRates: Record<ServiceCategory, number>;
  discounts: {
    senior: number;
    military: number;
    repeatCustomer: number;
  };
}

// Work session types
export interface WorkSession {
  id: string;
  jobId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  notes?: string;
  isPaused: boolean;
  pausedTime?: number; // accumulated pause time in seconds
}

// Tool types
export interface Tool {
  id: string;
  name: string;
  category: ServiceCategory;
  condition: 'excellent' | 'good' | 'fair' | 'needs_replacement';
  available: boolean;
  notes?: string;
}

// Vehicle types
export interface Vehicle {
  id: string;
  vin?: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  mileage?: number;
  customerId: string;
}

// VIN decode result
export interface VinDecodeResult {
  vin: string;
  make?: string;
  model?: string;
  year?: number;
  bodyClass?: string;
  engineSize?: string;
  fuelType?: string;
  transmission?: string;
  driveType?: string;
  valid: boolean;
  source: 'nhtsa' | 'fallback' | 'manual';
}

// Signature types
export interface SignatureData {
  signature: string; // base64 encoded signature
  timestamp: Date;
  customerName: string;
  jobId: string;
  agreementAccepted: boolean;
}

// Common UI types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}