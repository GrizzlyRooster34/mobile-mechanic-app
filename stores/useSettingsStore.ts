import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AvailabilitySettings {
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
}

interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  jobUpdates: boolean;
  maintenanceReminders: boolean;
  promotionalOffers: boolean;
  emergencyAlerts: boolean;
}

interface PricingSettings {
  laborRate: number;
  emergencyRate: number;
  travelFee: number;
  minimumCharge: number;
  servicePricing: {
    [serviceType: string]: {
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
}

interface ToolsSettings {
  availableTools: { [toolId: string]: boolean };
  customTools: Array<{
    id: string;
    name: string;
    category: string;
    required: boolean;
    description?: string;
  }>;
  toolConditions: { [toolId: string]: 'excellent' | 'good' | 'fair' | 'needs_replacement' };
  toolNotes: { [toolId: string]: string };
}

interface SettingsState {
  // Settings
  availability: AvailabilitySettings;
  notifications: NotificationSettings;
  pricing: PricingSettings;
  tools: ToolsSettings;
  
  // Actions
  updateAvailabilitySettings: (settings: Partial<AvailabilitySettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  updatePricingSettings: (settings: Partial<PricingSettings>) => void;
  updateToolsSettings: (settings: Partial<ToolsSettings>) => void;
  
  // Getters
  getServicePrice: (serviceType: string) => number;
  isToolAvailable: (toolId: string) => boolean;
  getToolCondition: (toolId: string) => string;
  isCurrentlyAvailable: () => boolean;
  getWorkingHoursForDay: (day: string) => { start: string; end: string } | null;
}

const defaultAvailabilitySettings: AvailabilitySettings = {
  isAvailable: true,
  workingDays: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: false,
  },
  workingHours: {
    start: '08:00',
    end: '18:00',
  },
  emergencyAvailable: true,
  maxJobsPerDay: 8,
  travelRadius: 25,
  autoAcceptJobs: false,
};

const defaultNotificationSettings: NotificationSettings = {
  pushNotifications: true,
  emailNotifications: true,
  smsNotifications: false,
  jobUpdates: true,
  maintenanceReminders: true,
  promotionalOffers: false,
  emergencyAlerts: true,
};

const defaultPricingSettings: PricingSettings = {
  laborRate: 85,
  emergencyRate: 125,
  travelFee: 25,
  minimumCharge: 50,
  servicePricing: {
    oil_change: { basePrice: 45, laborRate: 75, estimatedHours: 0.5 },
    brake_service: { basePrice: 150, laborRate: 85, estimatedHours: 2 },
    tire_service: { basePrice: 80, laborRate: 75, estimatedHours: 1 },
    battery_service: { basePrice: 120, laborRate: 75, estimatedHours: 0.75 },
    engine_diagnostic: { basePrice: 100, laborRate: 85, estimatedHours: 1.5 },
    transmission: { basePrice: 200, laborRate: 95, estimatedHours: 3 },
    ac_service: { basePrice: 90, laborRate: 85, estimatedHours: 1.5 },
    general_repair: { basePrice: 75, laborRate: 85, estimatedHours: 2 },
    emergency_roadside: { basePrice: 65, laborRate: 95, estimatedHours: 1 },
  },
  discounts: {
    seniorDiscount: 10,
    militaryDiscount: 15,
    repeatCustomerDiscount: 5,
  },
};

const defaultToolsSettings: ToolsSettings = {
  availableTools: {},
  customTools: [],
  toolConditions: {},
  toolNotes: {},
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      availability: defaultAvailabilitySettings,
      notifications: defaultNotificationSettings,
      pricing: defaultPricingSettings,
      tools: defaultToolsSettings,
      
      // Actions
      updateAvailabilitySettings: (settings) => {
        set((state) => ({
          availability: { ...state.availability, ...settings }
        }));
      },
      
      updateNotificationSettings: (settings) => {
        set((state) => ({
          notifications: { ...state.notifications, ...settings }
        }));
      },
      
      updatePricingSettings: (settings) => {
        set((state) => ({
          pricing: { ...state.pricing, ...settings }
        }));
      },
      
      updateToolsSettings: (settings) => {
        set((state) => ({
          tools: { ...state.tools, ...settings }
        }));
      },
      
      // Getters
      getServicePrice: (serviceType: string) => {
        const state = get();
        const servicePricing = state.pricing.servicePricing[serviceType];
        if (!servicePricing) return state.pricing.laborRate;
        
        return servicePricing.basePrice + (servicePricing.laborRate * servicePricing.estimatedHours);
      },
      
      isToolAvailable: (toolId: string) => {
        const state = get();
        return state.tools.availableTools[toolId] || false;
      },
      
      getToolCondition: (toolId: string) => {
        const state = get();
        return state.tools.toolConditions[toolId] || 'good';
      },
      
      isCurrentlyAvailable: () => {
        const state = get();
        const now = new Date();
        
        // Get day name and convert to lowercase
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = dayNames[now.getDay()] as keyof typeof state.availability.workingDays;
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
        
        // Check if available today
        if (!state.availability.isAvailable || !state.availability.workingDays[currentDay]) {
          return false;
        }
        
        // Check if within working hours
        const { start, end } = state.availability.workingHours;
        return currentTime >= start && currentTime <= end;
      },
      
      getWorkingHoursForDay: (day: string) => {
        const state = get();
        const dayKey = day.toLowerCase() as keyof typeof state.availability.workingDays;
        
        if (state.availability.workingDays[dayKey]) {
          return state.availability.workingHours;
        }
        
        return null;
      },
    }),
    {
      name: 'heinicus-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        availability: state.availability,
        notifications: state.notifications,
        pricing: state.pricing,
        tools: state.tools,
      }),
    }
  )
);