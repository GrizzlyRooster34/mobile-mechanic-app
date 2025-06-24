import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/auth-store';
import { useAppStore } from '@/stores/app-store';
import * as Icons from 'lucide-react-native';
import { NotificationSettings } from '@/components/NotificationSettings';
import { AvailabilitySettings } from '@/components/AvailabilitySettings';
import { ServicePricingSettings } from '@/components/ServicePricingSettings';
import { ToolsEquipmentSettings } from '@/components/ToolsEquipmentSettings';
import { ReportsAnalytics } from '@/components/ReportsAnalytics';

type SettingsScreen = 'main' | 'availability' | 'notifications' | 'pricing' | 'tools' | 'reports';

export default function MechanicProfileScreen() {
  const { user, logout } = useAuthStore();
  const { serviceRequests, quotes } = useAppStore();
  const [currentScreen, setCurrentScreen] = useState<SettingsScreen>('main');

  const completedJobs = serviceRequests.filter(r => r.status === 'completed').length;
  const totalRevenue = quotes
    .filter(q => q.status === 'accepted' && q.paidAt)
    .reduce((sum, q) => sum + q.totalCost, 0);
  const averageRating = 4.8; // Mock rating

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleSettingsChange = (settingsType: string, settings: any) => {
    console.log(`${settingsType} settings updated:`, settings);
    // Here you would typically save to your store or backend
  };

  const settingsOptions = [
    {
      id: 'availability',
      title: 'Availability Settings',
      subtitle: 'Set your working hours and availability',
      icon: 'Clock',
      onPress: () => setCurrentScreen('availability'),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage your notification preferences',
      icon: 'Bell',
      onPress: () => setCurrentScreen('notifications'),
    },
    {
      id: 'pricing',
      title: 'Service Pricing',
      subtitle: 'Update your service rates and pricing',
      icon: 'DollarSign',
      onPress: () => setCurrentScreen('pricing'),
    },
    {
      id: 'tools',
      title: 'Tools & Equipment',
      subtitle: 'Manage your available tools and equipment',
      icon: 'Wrench',
      onPress: () => setCurrentScreen('tools'),
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      subtitle: 'View your performance and earnings reports',
      icon: 'BarChart3',
      onPress: () => setCurrentScreen('reports'),
    },
  ];

  const renderSettingsScreen = () => {
    switch (currentScreen) {
      case 'availability':
        return (
          <AvailabilitySettings 
            onSettingsChange={(settings) => handleSettingsChange('availability', settings)}
          />
        );
      case 'notifications':
        return (
          <NotificationSettings 
            onSettingsChange={(settings) => handleSettingsChange('notifications', settings)}
          />
        );
      case 'pricing':
        return (
          <ServicePricingSettings 
            onSettingsChange={(settings) => handleSettingsChange('pricing', settings)}
          />
        );
      case 'tools':
        return (
          <ToolsEquipmentSettings 
            onSettingsChange={(settings) => handleSettingsChange('tools', settings)}
          />
        );
      case 'reports':
        return (
          <ReportsAnalytics 
            mechanicId={user?.id || 'mechanic-cody'}
          />
        );
      default:
        return renderMainProfile();
    }
  };

  const renderMainProfile = () => (
    <>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Text>
          </View>
          <View style={styles.statusIndicator} />
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Icons.Wrench size={12} color={Colors.mechanic} />
            <Text style={styles.roleText}>Certified Mechanic</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icons.LogOut size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icons.CheckCircle size={24} color={Colors.success} />
            <Text style={styles.statNumber}>{completedJobs}</Text>
            <Text style={styles.statLabel}>Jobs Completed</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icons.DollarSign size={24} color={Colors.primary} />
            <Text style={styles.statNumber}>${totalRevenue}</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icons.Star size={24} color={Colors.warning} />
            <Text style={styles.statNumber}>{averageRating}</Text>
            <Text style={styles.statLabel}>Average Rating</Text>
          </View>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingsList}>
          {settingsOptions.map((option) => {
            const IconComponent = Icons[option.icon as keyof typeof Icons] as any;
            return (
              <TouchableOpacity
                key={option.id}
                style={styles.settingItem}
                onPress={option.onPress}
              >
                <View style={styles.settingIcon}>
                  {IconComponent && <IconComponent size={20} color={Colors.mechanic} />}
                </View>
                
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{option.title}</Text>
                  <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
                </View>
                
                <Icons.ChevronRight size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.supportSection}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.supportList}>
          <TouchableOpacity style={styles.supportItem}>
            <Icons.HelpCircle size={20} color={Colors.primary} />
            <Text style={styles.supportText}>Help & FAQ</Text>
            <Icons.ChevronRight size={20} color={Colors.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.supportItem}>
            <Icons.MessageCircle size={20} color={Colors.primary} />
            <Text style={styles.supportText}>Contact Support</Text>
            <Icons.ChevronRight size={20} color={Colors.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.supportItem}>
            <Icons.FileText size={20} color={Colors.primary} />
            <Text style={styles.supportText}>Terms & Privacy</Text>
            <Icons.ChevronRight size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      {currentScreen !== 'main' && (
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setCurrentScreen('main')}
          >
            <Icons.ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {settingsOptions.find(opt => opt.id === currentScreen)?.title || 'Settings'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      )}

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderSettingsScreen()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.mechanic + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.mechanic,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.mechanic + '20',
    borderWidth: 1,
    borderColor: Colors.mechanic,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    color: Colors.mechanic,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 8,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
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
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsList: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.mechanic + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  supportSection: {
    marginBottom: 20,
  },
  supportList: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  supportText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
});