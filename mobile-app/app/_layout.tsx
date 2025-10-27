import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        headerStyle: {
          backgroundColor: '#1F2937',
        },
        headerTintColor: '#F9FAFB',
        tabBarStyle: {
          backgroundColor: '#F9FAFB',
          borderTopColor: '#E5E7EB',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Customer',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              size={24} 
              color={color} 
            />
          ),
          headerTitle: 'Heinicus Mobile Mechanic',
        }}
      />
      <Tabs.Screen
        name="mechanic"
        options={{
          title: 'Mechanic',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'build' : 'build-outline'} 
              size={24} 
              color={color} 
            />
          ),
          headerTitle: 'Mechanic Dashboard',
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'clipboard' : 'clipboard-outline'} 
              size={24} 
              color={color} 
            />
          ),
          headerTitle: 'Job Management',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'settings' : 'settings-outline'} 
              size={24} 
              color={color} 
            />
          ),
          headerTitle: 'Profile & Settings',
        }}
      />
    </Tabs>
  );
}