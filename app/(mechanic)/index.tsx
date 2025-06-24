import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { SERVICE_CATEGORIES } from '@/constants/services';
import { MaintenanceReminders } from '@/components/MaintenanceReminders';
import * as Icons from 'lucide-react-native';

export default function MechanicDashboardScreen() {
  const { serviceRequests, quotes, getTotalRevenue, getQuotesByStatus, logEvent } = useAppStore();
  const { user, logout } = useAuthStore();

  // Production: Filter jobs for Cody only
  const mechanicId = 'mechanic-cody';
  const mechanicJobs = serviceRequests.filter(job => {
    // Only show jobs assigned to Cody or unassigned jobs
    return !job.assignedMechanicId || job.assignedMechanicId === mechanicId;
  });

  const pendingJobs = mechanicJobs.filter(r => r.status === 'pending').length;
  const activeJobs = mechanicJobs.filter(r => ['quoted', 'accepted', 'in_progress'].includes(r.status)).length;
  const completedToday = mechanicJobs.filter(r => 
    r.status === 'completed' && 
    new Date(r.createdAt).toDateString() === new Date().toDateString()
  ).length;

  // Calculate today's revenue
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const todayRevenue = getTotalRevenue(startOfDay, endOfDay);

  // Calculate weekly stats
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyRevenue = getTotalRevenue(weekAgo);
  const weeklyJobs = mechanicJobs.filter(r => 
    r.status === 'completed' && 
    new Date(r.createdAt) >= weekAgo
  ).length;

  const getServiceTitle = (type: string) => {
    return SERVICE_CATEGORIES.find(s => s.id === type)?.title || type;
  };

  const recentJobs = mechanicJobs
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const handleQuickAction = (action: string) => {
    logEvent('dashboard_action', { action, mechanicId });
    
    switch (action) {
      case 'jobs':
        router.push('/jobs');
        break;
      case 'map':
        router.push('/map');
        break;
      case 'customers':
        router.push('/customers');
        break;
    }
  };

  const handleLogout = () => {
    logEvent('mechanic_logout', { mechanicId });
    logout();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back, Cody!</Text>
            <Text style={styles.subtitle}>
              Mobile Mechanic Dashboard - Production
            </Text>
            <View style={styles.productionBadge}>
              <Text style={styles.productionBadgeText}>LIVE MODE</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icons.LogOut size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{pendingJobs}</Text>
              <Text style={styles.statLabel}>Pending Jobs</Text>
              <Icons.Clock size={16} color={Colors.warning} />
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{activeJobs}</Text>
              <Text style={styles.statLabel}>Active Jobs</Text>
              <Icons.Wrench size={16} color={Colors.mechanic} />
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{completedToday}</Text>
              <Text style={styles.statLabel}>Completed Today</Text>
              <Icons.CheckCircle size={16} color={Colors.success} />
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>${todayRevenue}</Text>
              <Text style={styles.statLabel}>Today's Revenue</Text>
              <Icons.DollarSign size={16} color={Colors.primary} />
            </View>
          </View>
        </View>

        {/* Weekly Performance */}
        <View style={styles.performanceSection}>
          <Text style={styles.sectionTitle}>Weekly Performance</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceCard}>
              <View style={styles.performanceHeader}>
                <Icons.TrendingUp size={20} color={Colors.success} />
                <Text style={styles.performanceTitle}>Revenue</Text>
              </View>
              <Text style={styles.performanceValue}>${weeklyRevenue}</Text>
              <Text style={styles.performanceSubtext}>Last 7 days</Text>
            </View>
            
            <View style={styles.performanceCard}>
              <View style={styles.performanceHeader}>
                <Icons.CheckSquare size={20} color={Colors.primary} />
                <Text style={styles.performanceTitle}>Jobs Completed</Text>
              </View>
              <Text style={styles.performanceValue}>{weeklyJobs}</Text>
              <Text style={styles.performanceSubtext}>Last 7 days</Text>
            </View>
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
              onPress={() => handleQuickAction('jobs')}
            >
              <Icons.Briefcase size={24} color={Colors.mechanic} />
              <Text style={styles.quickActionText}>Manage Jobs</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => handleQuickAction('map')}
            >
              <Icons.Map size={24} color={Colors.mechanic} />
              <Text style={styles.quickActionText}>View Map</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => handleQuickAction('customers')}
            >
              <Icons.Users size={24} color={Colors.mechanic} />
              <Text style={styles.quickActionText}>Customers</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/profile')}
            >
              <Icons.Settings size={24} color={Colors.mechanic} />
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Jobs */}
        <View style={styles.recentJobsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Jobs</Text>
            <TouchableOpacity onPress={() => handleQuickAction('jobs')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentJobs.length === 0 ? (
            <View style={styles.emptyJobs}>
              <Icons.Briefcase size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No recent jobs</Text>
              <Text style={styles.emptySubtext}>
                Jobs will appear here when customers request services
              </Text>
            </View>
          ) : (
            <View style={styles.jobsList}>
              {recentJobs.map((job) => (
                <TouchableOpacity 
                  key={job.id} 
                  style={styles.jobCard}
                  onPress={() => router.push('/jobs')}
                >
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobTitle}>{getServiceTitle(job.type)}</Text>
                    <View style={[styles.jobStatus, { backgroundColor: getStatusColor(job.status) + '20' }]}>
                      <Text style={[styles.jobStatusText, { color: getStatusColor(job.status) }]}>
                        {job.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.jobDescription} numberOfLines={2}>
                    {job.description}
                  </Text>
                  
                  <View style={styles.jobMeta}>
                    <Text style={styles.jobDate}>
                      {new Date(job.createdAt).toLocaleDateString()}
                    </Text>
                    {job.urgency === 'emergency' && (
                      <View style={styles.urgencyBadge}>
                        <Icons.AlertTriangle size={12} color={Colors.error} />
                        <Text style={styles.urgencyText}>Emergency</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Production Info */}
        <View style={styles.productionInfo}>
          <Text style={styles.productionInfoTitle}>Production Environment</Text>
          <Text style={styles.productionInfoText}>
            Mechanic: Cody Owner (Owner Operator)
          </Text>
          <Text style={styles.productionInfoText}>
            Total Jobs: {mechanicJobs.length}
          </Text>
          <Text style={styles.productionInfoText}>
            System Status: Live
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return Colors.warning;
    case 'quoted': return Colors.primary;
    case 'accepted': return Colors.success;
    case 'in_progress': return Colors.mechanic;
    case 'completed': return Colors.success;
    default: return Colors.textMuted;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  productionBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  productionBadgeText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 8,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
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
  performanceSection: {
    marginBottom: 24,
  },
  performanceGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  performanceCard: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  performanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  performanceSubtext: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  quickActionsSection: {
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
  recentJobsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.mechanic,
    fontWeight: '500',
  },
  emptyJobs: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  jobsList: {
    gap: 12,
  },
  jobCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  jobStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  jobStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  jobDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  jobMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.error + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgencyText: {
    fontSize: 10,
    color: Colors.error,
    fontWeight: '600',
  },
  productionInfo: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 20,
  },
  productionInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  productionInfoText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
});