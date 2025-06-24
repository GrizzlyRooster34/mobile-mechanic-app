import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import * as Icons from 'lucide-react-native';
import { Platform } from 'react-native';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Check initial state
      setIsOnline(navigator.onLine);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      // For mobile, you would use NetInfo from @react-native-community/netinfo
      // import NetInfo from '@react-native-community/netinfo';
      // const unsubscribe = NetInfo.addEventListener(state => {
      //   setIsOnline(state.isConnected);
      // });
      // return unsubscribe;
    }
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Icons.WifiOff size={16} color={Colors.white} />
      <Text style={styles.text}>You are offline</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  text: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
});