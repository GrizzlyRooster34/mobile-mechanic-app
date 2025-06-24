import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState } from '@/types/auth';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, firstName: string, lastName: string, phone?: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
}

// Production configuration - Only Cody as mechanic
const PRODUCTION_MECHANIC = {
  id: 'mechanic-cody',
  email: 'matthew.heinen.2014@gmail.com',
  firstName: 'Cody',
  lastName: 'Owner',
  role: 'mechanic' as const,
  phone: '(555) 987-6543',
  createdAt: new Date(),
  isActive: true,
};

// Store for registered customers (in production, this would be in a database)
let registeredCustomers: User[] = [
  // Demo customer for testing
  {
    id: 'customer-demo',
    email: 'customer@example.com',
    firstName: 'Demo',
    lastName: 'Customer',
    role: 'customer',
    phone: '(555) 123-4567',
    createdAt: new Date(),
    isActive: true,
  }
];

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      signup: async (email: string, password: string, firstName: string, lastName: string, phone?: string) => {
        set({ isLoading: true });
        
        // Production logging
        console.log('Customer signup attempt:', { 
          email, 
          timestamp: new Date().toISOString(),
          environment: 'production'
        });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if user already exists
        const existingUser = registeredCustomers.find(u => u.email === email) || 
                           (PRODUCTION_MECHANIC.email === email ? PRODUCTION_MECHANIC : null);
        
        if (existingUser) {
          console.log('Signup failed - user exists:', { email, timestamp: new Date().toISOString() });
          set({ isLoading: false });
          return false;
        }
        
        // Create new customer
        const newCustomer: User = {
          id: `customer-${Date.now()}`,
          email,
          firstName,
          lastName,
          role: 'customer',
          phone,
          createdAt: new Date(),
          isActive: true,
        };
        
        // Add to registered customers (in production, this would be saved to database)
        registeredCustomers.push(newCustomer);
        
        // Production logging
        console.log('Customer signup successful:', { 
          userId: newCustomer.id, 
          email: newCustomer.email,
          environment: 'production',
          timestamp: new Date().toISOString() 
        });
        
        // Auto-login after signup
        set({ 
          user: newCustomer, 
          isAuthenticated: true, 
          isLoading: false 
        });
        
        return true;
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        // Production logging
        console.log('Login attempt:', { 
          email, 
          timestamp: new Date().toISOString(),
          environment: 'production'
        });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check mechanic login first
        if (email === PRODUCTION_MECHANIC.email) {
          const validPassword = password === 'RoosTer669072!@';
          
          if (validPassword) {
            console.log('Mechanic login successful:', { 
              userId: PRODUCTION_MECHANIC.id, 
              role: PRODUCTION_MECHANIC.role, 
              environment: 'production',
              timestamp: new Date().toISOString() 
            });
            
            set({ 
              user: PRODUCTION_MECHANIC, 
              isAuthenticated: true, 
              isLoading: false 
            });
            return true;
          }
        }
        
        // Check customer login
        const customer = registeredCustomers.find(u => u.email === email);
        
        if (customer) {
          // For demo purposes, accept any password for customers
          // In production, you'd verify the actual password hash
          console.log('Customer login successful:', { 
            userId: customer.id, 
            role: customer.role, 
            environment: 'production',
            timestamp: new Date().toISOString() 
          });
          
          set({ 
            user: customer, 
            isAuthenticated: true, 
            isLoading: false 
          });
          return true;
        }
        
        // Production logging
        console.log('Login failed:', { 
          email, 
          environment: 'production',
          timestamp: new Date().toISOString() 
        });
        
        set({ isLoading: false });
        return false;
      },

      logout: () => {
        const currentUser = get().user;
        
        // Production logging
        console.log('User logout:', { 
          userId: currentUser?.id, 
          role: currentUser?.role,
          environment: 'production',
          timestamp: new Date().toISOString() 
        });
        
        set({ 
          user: null, 
          isAuthenticated: false 
        });
      },

      setUser: (user: User) => {
        // Production security: Validate user role
        if (user.role === 'mechanic' && user.id !== 'mechanic-cody') {
          console.warn('Unauthorized mechanic access attempt:', { 
            userId: user.id, 
            environment: 'production',
            timestamp: new Date().toISOString() 
          });
          return;
        }
        
        // Production logging
        console.log('User set:', { 
          userId: user.id, 
          role: user.role, 
          environment: 'production',
          timestamp: new Date().toISOString() 
        });
        
        set({ 
          user, 
          isAuthenticated: true 
        });
      },
    }),
    {
      name: 'heinicus-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);