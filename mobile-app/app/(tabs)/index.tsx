import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerScreen() {
  const [activeServices, setActiveServices] = useState([
    {
      id: 1,
      type: 'Oil Change',
      status: 'In Progress',
      mechanic: 'John Smith',
      estimatedTime: '30 min',
      location: 'Your Location'
    }
  ]);

  const handleRequestService = () => {
    Alert.alert(
      'Request Service',
      'What type of service do you need?',
      [
        { text: 'Oil Change', onPress: () => console.log('Oil Change requested') },
        { text: 'Brake Service', onPress: () => console.log('Brake Service requested') },
        { text: 'Engine Diagnostics', onPress: () => console.log('Diagnostics requested') },
        { text: 'Emergency', onPress: () => console.log('Emergency requested'), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleChatSupport = () => {
    Alert.alert('Customer Support', 'Chat widget would open here with AI-powered customer support.');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.subText}>Your mobile mechanic is just a tap away</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={handleRequestService}>
              <Ionicons name="add-circle" size={32} color="#3B82F6" />
              <Text style={styles.actionText}>Request Service</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard} onPress={handleChatSupport}>
              <Ionicons name="chatbubble-ellipses" size={32} color="#10B981" />
              <Text style={styles.actionText}>Chat Support</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="location" size={32} color="#F59E0B" />
              <Text style={styles.actionText}>Track Mechanic</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="time" size={32} color="#8B5CF6" />
              <Text style={styles.actionText}>Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Services</Text>
          {activeServices.length > 0 ? (
            activeServices.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceType}>{service.type}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{service.status}</Text>
                  </View>
                </View>
                <Text style={styles.mechanicName}>Mechanic: {service.mechanic}</Text>
                <Text style={styles.serviceDetail}>
                  <Ionicons name="time-outline" size={14} color="#6B7280" /> {service.estimatedTime}
                </Text>
                <Text style={styles.serviceDetail}>
                  <Ionicons name="location-outline" size={14} color="#6B7280" /> {service.location}
                </Text>
                <TouchableOpacity style={styles.viewDetailsButton}>
                  <Text style={styles.viewDetailsText}>View Details</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              <Text style={styles.emptyStateText}>No active services</Text>
              <Text style={styles.emptyStateSubtext}>All your vehicles are in good shape!</Text>
            </View>
          )}
        </View>

        {/* Recent History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent History</Text>
          <View style={styles.historyItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <View style={styles.historyContent}>
              <Text style={styles.historyTitle}>Oil Change - Completed</Text>
              <Text style={styles.historyDate}>March 15, 2024</Text>
            </View>
          </View>
          <View style={styles.historyItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <View style={styles.historyContent}>
              <Text style={styles.historyTitle}>Brake Inspection - Completed</Text>
              <Text style={styles.historyDate}>February 28, 2024</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subText: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400E',
  },
  mechanicName: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  serviceDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  viewDetailsButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  viewDetailsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyContent: {
    marginLeft: 12,
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});