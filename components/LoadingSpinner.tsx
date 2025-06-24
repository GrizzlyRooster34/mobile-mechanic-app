import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/colors';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  overlay?: boolean;
}

export function LoadingSpinner({ size = 'large', color = Colors.primary, overlay = false }: LoadingSpinnerProps) {
  if (overlay) {
    return (
      <View style={styles.overlay}>
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size={size} color={color} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.black + '50',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  spinnerContainer: {
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 12,
  },
});