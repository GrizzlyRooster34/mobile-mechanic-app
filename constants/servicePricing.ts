import { ServiceType } from '@/types/service';

export interface ServicePricing {
  basePrice: number;
  laborRate: number; // per hour
  estimatedHours: number;
  commonParts: {
    name: string;
    price: number;
  }[];
  priceRange: {
    min: number;
    max: number;
  };
}

export const SERVICE_PRICING: Record<ServiceType, ServicePricing> = {
  oil_change: {
    basePrice: 45,
    laborRate: 75,
    estimatedHours: 0.5,
    commonParts: [
      { name: 'Conventional Oil (5qt)', price: 25 },
      { name: 'Synthetic Oil (5qt)', price: 45 },
      { name: 'Oil Filter', price: 15 },
    ],
    priceRange: { min: 75, max: 95 },
  },
  brake_service: {
    basePrice: 150,
    laborRate: 85,
    estimatedHours: 2,
    commonParts: [
      { name: 'Brake Pads (Front)', price: 80 },
      { name: 'Brake Pads (Rear)', price: 70 },
      { name: 'Brake Rotors (Pair)', price: 120 },
      { name: 'Brake Fluid', price: 15 },
    ],
    priceRange: { min: 150, max: 400 },
  },
  tire_service: {
    basePrice: 80,
    laborRate: 75,
    estimatedHours: 1,
    commonParts: [
      { name: 'Tire (Each)', price: 100 },
      { name: 'Valve Stem', price: 5 },
      { name: 'Wheel Weight', price: 3 },
    ],
    priceRange: { min: 80, max: 500 },
  },
  battery_service: {
    basePrice: 120,
    laborRate: 75,
    estimatedHours: 0.75,
    commonParts: [
      { name: 'Car Battery', price: 120 },
      { name: 'Battery Terminal', price: 15 },
      { name: 'Battery Cable', price: 25 },
    ],
    priceRange: { min: 120, max: 200 },
  },
  engine_diagnostic: {
    basePrice: 100,
    laborRate: 85,
    estimatedHours: 1.5,
    commonParts: [
      { name: 'Diagnostic Fee', price: 100 },
      { name: 'Computer Scan', price: 50 },
    ],
    priceRange: { min: 100, max: 250 },
  },
  transmission: {
    basePrice: 200,
    laborRate: 95,
    estimatedHours: 3,
    commonParts: [
      { name: 'Transmission Fluid', price: 35 },
      { name: 'Transmission Filter', price: 45 },
      { name: 'Gasket Set', price: 60 },
    ],
    priceRange: { min: 200, max: 800 },
  },
  ac_service: {
    basePrice: 90,
    laborRate: 85,
    estimatedHours: 1.5,
    commonParts: [
      { name: 'Refrigerant (R134a)', price: 40 },
      { name: 'AC Filter', price: 25 },
      { name: 'AC Compressor Oil', price: 20 },
    ],
    priceRange: { min: 90, max: 300 },
  },
  general_repair: {
    basePrice: 75,
    laborRate: 85,
    estimatedHours: 2,
    commonParts: [
      { name: 'Miscellaneous Parts', price: 50 },
    ],
    priceRange: { min: 75, max: 500 },
  },
  emergency_roadside: {
    basePrice: 65,
    laborRate: 95,
    estimatedHours: 1,
    commonParts: [
      { name: 'Emergency Service Fee', price: 65 },
      { name: 'Towing (per mile)', price: 3 },
    ],
    priceRange: { min: 65, max: 200 },
  },
};