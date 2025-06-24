import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/auth-store';
import * as Icons from 'lucide-react-native';

function TabBarIcon({ name, color }: { name: keyof typeof Icons; color: string }) {
  const IconComponent = Icons[name] as any;
  return IconComponent ? <IconComponent size={24} color={color} /> : null;
}

export default function MechanicTabLayout() {
  const { user, isAuthenticated } = useAuthStore();

  // Production security: Only allow Cody as mechanic
  if (!isAuthenticated || !user || user.role !== 'mechanic' || user.id !== 'mechanic-cody') {
    console.warn('Unauthorized mechanic access attempt:', { 
      isAuthenticated, 
      userId: user?.id, 
      role: user?.role,
      timestamp: new Date().toISOString() 
    });
    return <Redirect href="/auth" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.mechanic,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerTitle: 'Mechanic Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="LayoutDashboard" color={color} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color }) => <TabBarIcon name="Briefcase" color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <TabBarIcon name="Map" color={color} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          tabBarIcon: ({ color }) => <TabBarIcon name="Users" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="Settings" color={color} />,
        }}
      />
    </Tabs>
  );
}