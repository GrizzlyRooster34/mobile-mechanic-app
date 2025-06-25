import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../styles/globals.css';

export default function MobileLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1f2937',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Heinicus Mobile Mechanic',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="customer" 
          options={{ title: 'Customer Portal' }} 
        />
        <Stack.Screen 
          name="mechanic" 
          options={{ title: 'Mechanic Dashboard' }} 
        />
        <Stack.Screen 
          name="booking" 
          options={{ title: 'Book Service' }} 
        />
        <Stack.Screen 
          name="chat" 
          options={{ title: 'AI Assistant' }} 
        />
      </Stack>
    </SafeAreaProvider>
  );
}