import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vehicle, Contact, ServiceRequest, Quote, MaintenanceReminder, MaintenanceRecord, JobLog, ToolCheckItem } from '@/types/service';
import { PRODUCTION_CONFIG, logProductionEvent } from '@/utils/firebase-config';

interface AppState {
  // User data
  contact: Contact | null;
  vehicles: Vehicle[];
  
  // Service requests
  serviceRequests: ServiceRequest[];
  quotes: Quote[];
  maintenanceReminders: MaintenanceReminder[];
  maintenanceHistory: MaintenanceRecord[];
  jobLogs: JobLog[];
  
  // UI state
  currentLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
  
  // Actions
  setContact: (contact: Contact) => void;
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  removeVehicle: (id: string) => void;
  
  addServiceRequest: (request: ServiceRequest) => void;
  updateServiceRequest: (id: string, updates: Partial<ServiceRequest>) => void;
  
  addQuote: (quote: Quote) => void;
  updateQuote: (id: string, updates: Partial<Quote>) => void;
  
  addMaintenanceReminder: (reminder: MaintenanceReminder) => void;
  updateMaintenanceReminder: (id: string, updates: Partial<MaintenanceReminder>) => void;
  removeMaintenanceReminder: (id: string) => void;
  
  addMaintenanceRecord: (record: MaintenanceRecord) => void;
  updateMaintenanceRecord: (id: string, updates: Partial<MaintenanceRecord>) => void;
  
  addJobLog: (log: JobLog) => void;
  updateJobLog: (id: string, updates: Partial<JobLog>) => void;
  
  setCurrentLocation: (location: { latitude: number; longitude: number; address?: string }) => void;
  
  // Tools management
  updateJobTools: (jobId: string, toolsChecked: { [toolId: string]: boolean }) => void;
  completeToolsCheck: (jobId: string, notes?: string) => void;
  getJobToolsStatus: (jobId: string) => { total: number; checked: number; allRequired: boolean };
  
  // Maintenance tracking
  getVehicleMaintenanceHistory: (vehicleId: string) => MaintenanceRecord[];
  getUpcomingMaintenance: (vehicleId: string) => MaintenanceReminder[];
  markReminderAsSent: (reminderId: string) => void;
  completeMaintenanceReminder: (reminderId: string, serviceRecord: MaintenanceRecord) => void;
  
  // Job tracking
  getJobLogs: (jobId: string) => JobLog[];
  getActiveJobTimer: (jobId: string) => JobLog | null;
  getTotalJobTime: (jobId: string) => number;
  
  // Payment tracking
  getQuotesByStatus: (status: Quote['status']) => Quote[];
  getTotalRevenue: (startDate?: Date, endDate?: Date) => number;
  getPaymentHistory: () => Quote[];
  
  // Production logging
  logEvent: (event: string, data: any) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      contact: null,
      vehicles: [],
      serviceRequests: [],
      quotes: [],
      maintenanceReminders: [],
      maintenanceHistory: [],
      jobLogs: [],
      currentLocation: null,
      
      // Actions
      setContact: (contact) => {
        logProductionEvent('contact_updated', { contactId: contact.id });
        set({ contact });
      },
      
      addVehicle: (vehicle) => {
        logProductionEvent('vehicle_added', { 
          vehicleId: vehicle.id, 
          make: vehicle.make, 
          model: vehicle.model, 
          year: vehicle.year 
        });
        set((state) => ({
          vehicles: [...state.vehicles, vehicle]
        }));
      },
      
      updateVehicle: (id, updates) => {
        logProductionEvent('vehicle_updated', { vehicleId: id, updates: Object.keys(updates) });
        set((state) => ({
          vehicles: state.vehicles.map(v => v.id === id ? { ...v, ...updates } : v)
        }));
      },
      
      removeVehicle: (id) => {
        logProductionEvent('vehicle_removed', { vehicleId: id });
        set((state) => ({
          vehicles: state.vehicles.filter(v => v.id !== id),
          maintenanceHistory: state.maintenanceHistory.filter(r => r.vehicleId !== id),
          maintenanceReminders: state.maintenanceReminders.filter(r => r.vehicleId !== id),
        }));
      },
      
      addServiceRequest: (request) => {
        logProductionEvent('service_request_added', { 
          requestId: request.id, 
          serviceType: request.type, 
          urgency: request.urgency,
          toolsCount: request.requiredTools?.length || 0
        });
        set((state) => ({
          serviceRequests: [...state.serviceRequests, request]
        }));
      },
      
      updateServiceRequest: (id, updates) => {
        logProductionEvent('service_request_updated', { 
          requestId: id, 
          updates: Object.keys(updates),
          newStatus: updates.status
        });
        set((state) => ({
          serviceRequests: state.serviceRequests.map(r => r.id === id ? { ...r, ...updates } : r)
        }));
      },
      
      addQuote: (quote) => {
        logProductionEvent('quote_added', { 
          quoteId: quote.id, 
          serviceRequestId: quote.serviceRequestId, 
          totalCost: quote.totalCost 
        });
        set((state) => ({
          quotes: [...state.quotes, quote]
        }));
      },
      
      updateQuote: (id, updates) => {
        logProductionEvent('quote_updated', { 
          quoteId: id, 
          updates: Object.keys(updates),
          newStatus: updates.status
        });
        set((state) => ({
          quotes: state.quotes.map(q => q.id === id ? { ...q, ...updates } : q)
        }));
      },
      
      addMaintenanceReminder: (reminder) => {
        logProductionEvent('maintenance_reminder_added', { 
          reminderId: reminder.id, 
          vehicleId: reminder.vehicleId, 
          serviceType: reminder.serviceType 
        });
        set((state) => ({
          maintenanceReminders: [...state.maintenanceReminders, reminder]
        }));
      },
      
      updateMaintenanceReminder: (id, updates) => set((state) => ({
        maintenanceReminders: state.maintenanceReminders.map(r => r.id === id ? { ...r, ...updates } : r)
      })),
      
      removeMaintenanceReminder: (id) => set((state) => ({
        maintenanceReminders: state.maintenanceReminders.filter(r => r.id !== id)
      })),
      
      addMaintenanceRecord: (record) => {
        logProductionEvent('maintenance_record_added', { 
          recordId: record.id, 
          vehicleId: record.vehicleId, 
          serviceType: record.serviceType,
          cost: record.cost
        });
        
        set((state) => {
          // Also update the vehicle's maintenance history
          const updatedVehicles = state.vehicles.map(vehicle => {
            if (vehicle.id === record.vehicleId) {
              return {
                ...vehicle,
                maintenanceHistory: [...(vehicle.maintenanceHistory || []), record],
                lastServiceDate: record.performedAt,
                nextServiceDue: record.nextDueDate,
              };
            }
            return vehicle;
          });

          return {
            maintenanceHistory: [...state.maintenanceHistory, record],
            vehicles: updatedVehicles,
          };
        });
      },
      
      updateMaintenanceRecord: (id, updates) => set((state) => ({
        maintenanceHistory: state.maintenanceHistory.map(r => r.id === id ? { ...r, ...updates } : r)
      })),
      
      addJobLog: (log) => {
        logProductionEvent('job_log_added', { 
          logId: log.id, 
          jobId: log.jobId, 
          mechanicId: log.mechanicId,
          startTime: log.startTime.toISOString()
        });
        set((state) => ({
          jobLogs: [...state.jobLogs, log]
        }));
      },
      
      updateJobLog: (id, updates) => {
        logProductionEvent('job_log_updated', { 
          logId: id, 
          updates: Object.keys(updates),
          duration: updates.duration
        });
        set((state) => ({
          jobLogs: state.jobLogs.map(l => l.id === id ? { ...l, ...updates } : l)
        }));
      },
      
      setCurrentLocation: (location) => set({ currentLocation: location }),
      
      // Tools management
      updateJobTools: (jobId: string, toolsChecked: { [toolId: string]: boolean }) => {
        const checkedCount = Object.values(toolsChecked).filter(Boolean).length;
        logProductionEvent('job_tools_updated', { 
          jobId, 
          mechanicId: 'mechanic-cody',
          checkedCount,
          totalTools: Object.keys(toolsChecked).length
        });
        
        set((state) => ({
          serviceRequests: state.serviceRequests.map(r => 
            r.id === jobId ? { ...r, toolsChecked } : r
          )
        }));
      },
      
      completeToolsCheck: (jobId: string, notes?: string) => {
        logProductionEvent('tools_check_completed', { 
          jobId, 
          mechanicId: 'mechanic-cody',
          hasNotes: !!notes
        });
        
        set((state) => ({
          serviceRequests: state.serviceRequests.map(r => 
            r.id === jobId ? { 
              ...r, 
              toolsCheckCompletedAt: new Date(),
              toolsNotes: notes
            } : r
          )
        }));
      },
      
      getJobToolsStatus: (jobId: string) => {
        const state = get();
        const job = state.serviceRequests.find(r => r.id === jobId);
        if (!job || !job.requiredTools) return { total: 0, checked: 0, allRequired: false };
        
        const total = job.requiredTools.length;
        const checked = Object.values(job.toolsChecked || {}).filter(Boolean).length;
        const requiredTools = job.requiredTools; // All tools in requiredTools are required
        const allRequired = requiredTools.every(toolId => job.toolsChecked?.[toolId]);
        
        return { total, checked, allRequired };
      },
      
      // Maintenance tracking helpers
      getVehicleMaintenanceHistory: (vehicleId: string) => {
        const state = get();
        return state.maintenanceHistory.filter(record => record.vehicleId === vehicleId)
          .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());
      },
      
      getUpcomingMaintenance: (vehicleId: string) => {
        const state = get();
        const today = new Date();
        return state.maintenanceReminders
          .filter(reminder => 
            reminder.vehicleId === vehicleId && 
            reminder.dueDate >= today &&
            !reminder.completed
          )
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
      },
      
      markReminderAsSent: (reminderId: string) => set((state) => ({
        maintenanceReminders: state.maintenanceReminders.map(r => 
          r.id === reminderId ? { ...r, reminderSent: true } : r
        )
      })),

      completeMaintenanceReminder: (reminderId: string, serviceRecord: MaintenanceRecord) => {
        logProductionEvent('maintenance_reminder_completed', { 
          reminderId, 
          serviceRecordId: serviceRecord.id,
          vehicleId: serviceRecord.vehicleId
        });
        
        set((state) => {
          // Mark reminder as completed
          const updatedReminders = state.maintenanceReminders.map(r => 
            r.id === reminderId ? { ...r, completed: true, completedAt: new Date() } : r
          );

          // Add service record
          const updatedHistory = [...state.maintenanceHistory, serviceRecord];

          // Update vehicle
          const updatedVehicles = state.vehicles.map(vehicle => {
            if (vehicle.id === serviceRecord.vehicleId) {
              return {
                ...vehicle,
                maintenanceHistory: [...(vehicle.maintenanceHistory || []), serviceRecord],
                lastServiceDate: serviceRecord.performedAt,
                nextServiceDue: serviceRecord.nextDueDate,
              };
            }
            return vehicle;
          });

          return {
            maintenanceReminders: updatedReminders,
            maintenanceHistory: updatedHistory,
            vehicles: updatedVehicles,
          };
        });
      },
      
      // Job tracking helpers
      getJobLogs: (jobId: string) => {
        const state = get();
        return state.jobLogs.filter(log => log.jobId === jobId)
          .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      },
      
      getActiveJobTimer: (jobId: string) => {
        const state = get();
        return state.jobLogs.find(log => log.jobId === jobId && !log.endTime) || null;
      },

      getTotalJobTime: (jobId: string) => {
        const state = get();
        const logs = state.jobLogs.filter(log => log.jobId === jobId && log.endTime);
        return logs.reduce((total, log) => {
          if (log.endTime) {
            return total + (log.endTime.getTime() - log.startTime.getTime());
          }
          return total;
        }, 0);
      },

      // Payment tracking helpers
      getQuotesByStatus: (status: Quote['status']) => {
        const state = get();
        return state.quotes.filter(quote => quote.status === status);
      },

      getTotalRevenue: (startDate?: Date, endDate?: Date) => {
        const state = get();
        return state.quotes
          .filter(quote => {
            if (!['paid', 'deposit_paid'].includes(quote.status) || !quote.paidAt) return false;
            if (startDate && quote.paidAt < startDate) return false;
            if (endDate && quote.paidAt > endDate) return false;
            return true;
          })
          .reduce((total, quote) => total + quote.totalCost, 0);
      },

      getPaymentHistory: () => {
        const state = get();
        return state.quotes
          .filter(quote => ['paid', 'deposit_paid'].includes(quote.status) && quote.paidAt)
          .sort((a, b) => (b.paidAt?.getTime() || 0) - (a.paidAt?.getTime() || 0));
      },
      
      // Production logging
      logEvent: (event: string, data: any) => {
        const timestamp = new Date().toISOString();
        const logData = {
          event,
          data,
          timestamp,
          environment: 'production',
          mechanicId: 'mechanic-cody', // Production: Cody only
        };
        
        // Console logging for production monitoring
        console.log('App Event:', logData);
        
        // Production: Send to analytics service
        if (PRODUCTION_CONFIG.enableToolsModule) {
          logProductionEvent(event, { ...data, timestamp });
        }
      },
    }),
    {
      name: 'heinicus-mechanic-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        contact: state.contact,
        vehicles: state.vehicles,
        serviceRequests: state.serviceRequests,
        quotes: state.quotes,
        maintenanceReminders: state.maintenanceReminders,
        maintenanceHistory: state.maintenanceHistory,
        jobLogs: state.jobLogs,
      }),
    }
  )
);