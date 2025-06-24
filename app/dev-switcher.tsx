import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import * as Icons from 'lucide-react-native';

export default function DevSwitcherScreen() {
  // Always redirect to auth in production
  React.useEffect(() => {
    router.replace('/auth');
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.productionBanner}>
        <Icons.Shield size={24} color={Colors.success} />
        <Text style={styles.productionText}>PRODUCTION MODE</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Redirecting to Login</Text>
        <Text style={styles.subtitle}>
          Please use the main authentication screen to access the app.
        </Text>
        
        <View style={styles.infoCard}>
          <Icons.Info size={20} color={Colors.primary} />
          <Text style={styles.infoText}>
            Development features are disabled in production mode.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
    justifyContent: 'center',
  },
  productionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success + '20',
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: 8,
    padding: 16,
    marginBottom: 40,
    gap: 8,
  },
  productionText: {
    color: Colors.success,
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});