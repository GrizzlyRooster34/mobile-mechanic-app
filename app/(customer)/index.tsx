import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { SERVICE_CATEGORIES } from '@/constants/services';
import { ServiceCard } from '@/components/ServiceCard';
import { MaintenanceReminders } from '@/components/MaintenanceReminders';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import * as Icons from 'lucide-react-native';

export default function CustomerHomeScreen() {
  const { serviceRequests, vehicles } = useAppStore();
  const { user, logout } = useAuthStore();
  
  const pendingRequests = serviceRequests.filter(r => r.status === 'pending').length;
  const activeRequests = serviceRequests.filter(r => ['quoted', 'accepted', 'in_progress'].includes(r.status)).length;
  const completedRequests = serviceRequests.filter(r => r.status === 'completed').length;

  const handleServicePress = (serviceId: string) => {
    router.push({
      pathname: '/request',
      params: { serviceType: serviceId }
    });
  };

  const handleEmergencyPress = () => {
    router.push({
      pathname: '/request',
      params: { serviceType: 'emergency_roadside', urgent: 'true' }
    });
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'quotes':
        router.push('/quotes');
        break;
      case 'profile':
        router.push('/profile');
        break;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeHeader}>
          <View>
            <Text style={styles.welcomeText}>
              Welcome back, {user?.firstName}!
            </Text>
            <Text style={styles.subtitle}>
              Professional mobile mechanic services at your location
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Icons.LogOut size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Emergency Button */}
      <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyPress}>
        <Icons.Phone size={24} color={Colors.white} />
        <View style={styles.emergencyContent}>
          <Text style={styles.emergencyTitle}>Emergency Roadside</Text>
          <Text style={styles.emergencySubtitle}>24/7 immediate assistance</Text>
        </View>
        <Icons.ChevronRight size={20} color={Colors.white} />
      </TouchableOpacity>

      {/* Quick Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => handleQuickAction('quotes')}
          >
            <Text style={styles.statNumber}>{pendingRequests + activeRequests}</Text>
            <Text style={styles.statLabel}>Active Requests</Text>
            <Icons.Clock size={16} color={Colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => handleQuickAction('quotes')}
          >
            <Text style={styles.statNumber}>{completedRequests}</Text>
            <Text style={styles.statLabel}>Completed</Text>
            <Icons.CheckCircle size={16} color={Colors.success} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => handleQuickAction('profile')}
          >
            <Text style={styles.statNumber}>{vehicles.length}</Text>
            <Text style={styles.statLabel}>Vehicles</Text>
            <Icons.Car size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Maintenance Reminders */}
      <MaintenanceReminders />

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => handleQuickAction('quotes')}
          >
            <Icons.FileText size={24} color={Colors.primary} />
            <Text style={styles.quickActionText}>View Quotes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => handleQuickAction('profile')}
          >
            <Icons.User size={24} color={Colors.primary} />
            <Text style={styles.quickActionText}>My Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/request')}
          >
            <Icons.Plus size={24} color={Colors.primary} />
            <Text style={styles.quickActionText}>New Request</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/quotes')}
          >
            <Icons.History size={24} color={Colors.primary} />
            <Text style={styles.quickActionText}>Service History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Services Section */}
      <View style={styles.servicesSection}>
        <Text style={styles.sectionTitle}>Our Services</Text>
        {SERVICE_CATEGORIES.filter(s => s.id !== 'emergency_roadside').map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onPress={() => handleServicePress(service.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  welcomeSection: {
    padding: 20,
    paddingBottom: 16,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  logoutButton: {
    padding: 8,
  },
  emergencyButton: {
    backgroundColor: Colors.error,
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyContent: {
    flex: 1,
    marginLeft: 12,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  emergencySubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    minHeight: 80,
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  servicesSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});