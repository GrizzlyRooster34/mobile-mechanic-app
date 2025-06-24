import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '@/constants/colors';
import * as Icons from 'lucide-react-native';
import { useAppStore } from '@/stores/app-store';

interface ReportsAnalyticsProps {
  mechanicId: string;
}

export function ReportsAnalytics({ mechanicId }: ReportsAnalyticsProps) {
  const { serviceRequests, quotes, jobLogs, getTotalRevenue, getPaymentHistory } = useAppStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Calculate date ranges
  const now = new Date();
  const getDateRange = (period: typeof selectedPeriod) => {
    const end = new Date(now);
    const start = new Date(now);
    
    switch (period) {
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }
    
    return { start, end };
  };

  const { start: periodStart, end: periodEnd } = getDateRange(selectedPeriod);

  // Calculate metrics
  const completedJobs = serviceRequests.filter(r => 
    r.status === 'completed' && 
    r.completedAt && 
    r.completedAt >= periodStart && 
    r.completedAt <= periodEnd
  );

  const totalRevenue = getTotalRevenue(periodStart, periodEnd);
  const averageJobValue = completedJobs.length > 0 ? totalRevenue / completedJobs.length : 0;

  const totalWorkTime = jobLogs
    .filter(log => 
      log.mechanicId === mechanicId &&
      log.startTime >= periodStart && 
      log.startTime <= periodEnd &&
      log.endTime
    )
    .reduce((total, log) => {
      if (log.endTime) {
        return total + (log.endTime.getTime() - log.startTime.getTime());
      }
      return total;
    }, 0);

  const averageJobTime = completedJobs.length > 0 ? totalWorkTime / completedJobs.length : 0;

  // Service type breakdown
  const serviceBreakdown = completedJobs.reduce((acc, job) => {
    acc[job.type] = (acc[job.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topServices = Object.entries(serviceBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Customer satisfaction (mock data for now)
  const customerRating = 4.8;
  const totalReviews = completedJobs.length;

  const periods = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'quarter', label: 'Quarter' },
    { key: 'year', label: 'Year' },
  ];

  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod(period.key as typeof selectedPeriod)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period.key && styles.periodButtonTextActive
            ]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Icons.DollarSign size={24} color={Colors.success} />
            </View>
            <Text style={styles.metricValue}>{formatCurrency(totalRevenue)}</Text>
            <Text style={styles.metricLabel}>Total Revenue</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Icons.CheckCircle size={24} color={Colors.primary} />
            </View>
            <Text style={styles.metricValue}>{completedJobs.length}</Text>
            <Text style={styles.metricLabel}>Jobs Completed</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Icons.TrendingUp size={24} color={Colors.warning} />
            </View>
            <Text style={styles.metricValue}>{formatCurrency(averageJobValue)}</Text>
            <Text style={styles.metricLabel}>Avg Job Value</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Icons.Clock size={24} color={Colors.mechanic} />
            </View>
            <Text style={styles.metricValue}>{formatTime(averageJobTime)}</Text>
            <Text style={styles.metricLabel}>Avg Job Time</Text>
          </View>
        </View>
      </View>

      {/* Performance Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        <View style={styles.performanceCard}>
          <View style={styles.performanceRow}>
            <View style={styles.performanceItem}>
              <Icons.Star size={20} color={Colors.warning} />
              <View style={styles.performanceContent}>
                <Text style={styles.performanceValue}>{customerRating}</Text>
                <Text style={styles.performanceLabel}>Customer Rating</Text>
              </View>
            </View>
            <View style={styles.performanceItem}>
              <Icons.MessageSquare size={20} color={Colors.primary} />
              <View style={styles.performanceContent}>
                <Text style={styles.performanceValue}>{totalReviews}</Text>
                <Text style={styles.performanceLabel}>Total Reviews</Text>
              </View>
            </View>
          </View>

          <View style={styles.performanceRow}>
            <View style={styles.performanceItem}>
              <Icons.Clock size={20} color={Colors.success} />
              <View style={styles.performanceContent}>
                <Text style={styles.performanceValue}>{formatTime(totalWorkTime)}</Text>
                <Text style={styles.performanceLabel}>Total Work Time</Text>
              </View>
            </View>
            <View style={styles.performanceItem}>
              <Icons.Target size={20} color={Colors.mechanic} />
              <View style={styles.performanceContent}>
                <Text style={styles.performanceValue}>95%</Text>
                <Text style={styles.performanceLabel}>On-Time Rate</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Top Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Services</Text>
        <View style={styles.servicesCard}>
          {topServices.length > 0 ? (
            topServices.map(([serviceType, count], index) => (
              <View key={serviceType} style={styles.serviceRow}>
                <View style={styles.serviceRank}>
                  <Text style={styles.serviceRankText}>{index + 1}</Text>
                </View>
                <View style={styles.serviceContent}>
                  <Text style={styles.serviceName}>
                    {serviceType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                  <Text style={styles.serviceCount}>{count} jobs</Text>
                </View>
                <View style={styles.serviceBar}>
                  <View 
                    style={[
                      styles.serviceBarFill,
                      { width: `${(count / Math.max(...topServices.map(([,c]) => c))) * 100}%` }
                    ]}
                  />
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icons.BarChart3 size={48} color={Colors.textMuted} />
              <Text style={styles.emptyStateText}>No completed jobs in this period</Text>
            </View>
          )}
        </View>
      </View>

      {/* Revenue Trend */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Revenue Breakdown</Text>
        <View style={styles.revenueCard}>
          <View style={styles.revenueRow}>
            <View style={styles.revenueItem}>
              <Text style={styles.revenueLabel}>Labor</Text>
              <Text style={styles.revenueValue}>{formatCurrency(totalRevenue * 0.7)}</Text>
            </View>
            <View style={styles.revenueItem}>
              <Text style={styles.revenueLabel}>Parts</Text>
              <Text style={styles.revenueValue}>{formatCurrency(totalRevenue * 0.3)}</Text>
            </View>
          </View>
          <View style={styles.revenueRow}>
            <View style={styles.revenueItem}>
              <Text style={styles.revenueLabel}>Travel Fees</Text>
              <Text style={styles.revenueValue}>{formatCurrency(completedJobs.length * 25)}</Text>
            </View>
            <View style={styles.revenueItem}>
              <Text style={styles.revenueLabel}>Emergency</Text>
              <Text style={styles.revenueValue}>{formatCurrency(totalRevenue * 0.1)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Export Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Export Reports</Text>
        <View style={styles.exportCard}>
          <TouchableOpacity style={styles.exportButton}>
            <Icons.FileText size={20} color={Colors.primary} />
            <Text style={styles.exportButtonText}>Export PDF Report</Text>
            <Icons.ChevronRight size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.exportButton}>
            <Icons.Download size={20} color={Colors.primary} />
            <Text style={styles.exportButtonText}>Download CSV Data</Text>
            <Icons.ChevronRight size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.exportButton}>
            <Icons.Share size={20} color={Colors.primary} />
            <Text style={styles.exportButtonText}>Share Summary</Text>
            <Icons.ChevronRight size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: Colors.white,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  performanceCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  performanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  performanceContent: {
    flex: 1,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  performanceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  servicesCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  serviceRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceRankText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  serviceContent: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  serviceCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  serviceBar: {
    width: 60,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  serviceBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  revenueCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  revenueItem: {
    flex: 1,
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  exportCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  exportButtonText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
});