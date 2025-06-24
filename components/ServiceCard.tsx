import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { ServiceCategory } from '@/constants/services';
import * as Icons from 'lucide-react-native';

interface ServiceCardProps {
  service: ServiceCategory;
  onPress: () => void;
}

export function ServiceCard({ service, onPress }: ServiceCardProps) {
  const IconComponent = Icons[service.icon as keyof typeof Icons] as any;
  
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        {IconComponent && <IconComponent size={24} color={Colors.primary} />}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{service.title}</Text>
        <Text style={styles.description}>{service.description}</Text>
        
        <View style={styles.footer}>
          <Text style={styles.time}>{service.estimatedTime}</Text>
          <Text style={styles.price}>From ${service.basePrice}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
});