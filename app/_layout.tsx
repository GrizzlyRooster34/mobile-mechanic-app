import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/colors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from '@/lib/trpc';

export const unstable_settings = {
  initialRouteName: 'auth',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const [loaded, error] = useFonts({});

  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" backgroundColor={Colors.background} />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: Colors.background,
            },
            headerTintColor: Colors.text,
            headerTitleStyle: {
              fontWeight: '600',
            },
            headerBackTitle: 'Back',
          }}
        >
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="(customer)" options={{ headerShown: false }} />
          <Stack.Screen name="(mechanic)" options={{ headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </trpc.Provider>
  );
}