import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAppStore } from '@/stores/app-store';
import { calculateMaintenanceDue, getMaintenanceIntervals } from '@/utils/quote-generator';
import { SERVICE_CATEGORIES } from '@/constants/services';
import * as Icons from 'lucide-react-native';
import { router } from 'expo-router';

export function MaintenanceReminders() {
  const { vehicles, addMaintenanceReminder, maintenanceReminders } = useAppStore();

  const getMaintenanceReminders = () => {
    const reminders: Array<{
      vehicleId: string;
      vehicleName: string;
      serviceType: string;
      serviceTypeId: string;
      dueDate: Date;
      isOverdue: boolean;
      daysDue: number;
      priority: 'low' | 'medium' | 'high';
      dueMileage?: number;
      reason: string;
    }> = [];

    vehicles.forEach(vehicle => {
      const intervals = getMaintenanceIntervals();
      const currentMileage = vehicle.mileage || 0;
      const vehicleAge = new Date().getFullYear() - vehicle.year;
      
      intervals.forEach(interval => {
        // Check if we have maintenance history for this service type
        const lastService = vehicle.maintenanceHistory?.find(
          record => record.serviceType === interval.serviceType
        );

        let dueDate: Date | null = null;
        let reason = '';
        let dueMileage: number | undefined;

        if (lastService) {
          // Calculate based on last service
          dueDate = calculateMaintenanceDue(lastService.performedAt, interval.serviceType, currentMileage);
          reason = `Last ${interval.description.toLowerCase()} was ${Math.floor((new Date().getTime() - lastService.performedAt.getTime()) / (1000 * 60 * 60 * 24))} days ago`;
          
          if (interval.intervalMiles && lastService.mileage) {
            dueMileage = lastService.mileage + interval.intervalMiles;
            if (currentMileage >= dueMileage) {
              dueDate = new Date(); // Due now based on mileage
              reason = `${currentMileage - dueMileage} miles overdue`;
            }
          }
        } else if (vehicle.lastServiceDate) {
          // Calculate based on general last service date
          dueDate = calculateMaintenanceDue(vehicle.lastServiceDate, interval.serviceType, currentMileage);
          reason = `No record of ${interval.description.toLowerCase()}`;
          
          if (interval.intervalMiles) {
            dueMileage = currentMileage + interval.intervalMiles;
          }
        } else {
          // For vehicles without service history, create reminders based on age/mileage
          const shouldRemind = (
            (vehicleAge >= 2 && interval.serviceType === 'oil_change') ||
            (vehicleAge >= 3 && ['brake_service', 'tire_service'].includes(interval.serviceType)) ||
            (currentMileage > 30000 && interval.serviceType === 'transmission') ||
            (currentMileage > 50000 && ['engine_diagnostic', 'ac_service'].includes(interval.serviceType)) ||
            (vehicleAge >= 5)
          );

          if (shouldRemind) {
            dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30)); // Due within 30 days
            reason = `Recommended for ${vehicle.year} vehicle with ${currentMileage.toLocaleString()} miles`;
            
            if (interval.intervalMiles) {
              dueMileage = currentMileage + interval.intervalMiles;
            }
          }
        }
        
        if (dueDate) {
          const today = new Date();
          const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          // Show reminders for items due within 45 days or overdue
          if (daysDiff <= 45) {
            const serviceCategory = SERVICE_CATEGORIES.find(s => s.id === interval.serviceType);
            
            // Determine priority based on service type and how overdue
            let priority: 'low' | 'medium' | 'high' = 'low';
            if (daysDiff < -14 || ['brake_service', 'engine_diagnostic'].includes(interval.serviceType)) {
              priority = 'high';
            } else if (daysDiff < 0 || ['oil_change', 'battery_service'].includes(interval.serviceType)) {
              priority = 'medium';
            }
            
            reminders.push({
              vehicleId: vehicle.id,
              vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
              serviceType: serviceCategory?.title || interval.description,
              serviceTypeId: interval.serviceType,
              dueDate,
              isOverdue: daysDiff < 0,
              daysDue: Math.abs(daysDiff),
              priority,
              dueMileage,
              reason,
            });
          }
        }
      });
    });

    return reminders.sort((a, b) => {
      // Sort by priority first, then by due date
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  };

  const handleScheduleService = (serviceTypeId: string, vehicleId: string) => {
    router.push({
      pathname: '/request',
      params: { 
        serviceType: serviceTypeId,
        vehicleId: vehicleId
      }
    });
  };

  const handleDismissReminder = (vehicleId: string, serviceType: string) => {
    // Add to dismissed reminders or mark as acknowledged
    const reminder = {
      id: `${vehicleId}-${serviceType}-${Date.now()}`,
      vehicleId,
      serviceType: serviceType as any,
      dueDate: new Date(),
      dueMileage: undefined,
      isOverdue: false,
      reminderSent: true,
      priority: 'low' as const,
    };
    
    addMaintenanceReminder(reminder);
  };

  const handleViewAllMaintenance = () => {
    router.push('/profile');
  };

  const reminders = getMaintenanceReminders();

  if (reminders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icons.CheckCircle size={24} color={Colors.success} />
        <Text style={styles.emptyTitle}>All Caught Up!</Text>
        <Text style={styles.emptyText}>
          No maintenance reminders at this time. We will notify you when services are due.
        </Text>
        <TouchableOpacity style={styles.addVehicleButton} onPress={() => router.push('/profile')}>
          <Icons.Plus size={16} color={Colors.primary} />
          <Text style={styles.addVehicleText}>Add Vehicle</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icons.Clock size={20} color={Colors.warning} />
        <Text style={styles.title}>Maintenance Reminders</Text>
        <View style={styles.headerActions}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{reminders.length}</Text>
          </View>
          <TouchableOpacity onPress={handleViewAllMaintenance} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.remindersList}>
        {reminders.slice(0, 5).map((reminder, index) => (
          <View
            key={`${reminder.vehicleId}-${reminder.serviceTypeId}-${index}`}
            style={[
              styles.reminderCard,
              reminder.isOverdue && styles.overdueCard,
              reminder.priority === 'high' && styles.highPriorityCard
            ]}
          >
            <View style={styles.reminderHeader}>
              <Text style={[
                styles.reminderTitle,
                reminder.isOverdue && styles.overdueText
              ]}>
                {reminder.serviceType}
              </Text>
              <TouchableOpacity
                onPress={() => handleDismissReminder(reminder.vehicleId, reminder.serviceTypeId)}
                style={styles.dismissButton}
              >
                <Icons.X size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.vehicleName}>{reminder.vehicleName}</Text>
            
            <View style={styles.dueDateRow}>
              {reminder.isOverdue ? (
                <Icons.AlertTriangle size={16} color={Colors.error} />
              ) : (
                <Icons.Clock size={16} color={Colors.warning} />
              )}
              <Text style={[
                styles.dueText,
                reminder.isOverdue && styles.overdueText
              ]}>
                {reminder.isOverdue 
                  ? `${reminder.daysDue} days overdue`
                  : `Due in ${reminder.daysDue} days`
                }
              </Text>
            </View>

            {reminder.dueMileage && (
              <Text style={styles.mileageText}>
                Due at {reminder.dueMileage.toLocaleString()} miles
              </Text>
            )}

            <Text style={styles.reasonText} numberOfLines={2}>
              {reminder.reason}
            </Text>

            <TouchableOpacity
              style={[
                styles.scheduleButton,
                reminder.isOverdue && styles.overdueScheduleButton
              ]}
              onPress={() => handleScheduleService(reminder.serviceTypeId, reminder.vehicleId)}
            >
              <Text style={[
                styles.scheduleButtonText,
                reminder.isOverdue && styles.overdueScheduleButtonText
              ]}>
                Schedule Service
              </Text>
              <Icons.ChevronRight size={14} color={
                reminder.isOverdue ? Colors.error : Colors.primary
              } />
            </TouchableOpacity>

            {/* Priority Indicator */}
            <View style={[
              styles.priorityIndicator,
              { backgroundColor: getPriorityColor(reminder.priority) }
            ]} />
          </View>
        ))}
        
        {reminders.length > 5 && (
          <TouchableOpacity style={styles.viewMoreCard} onPress={handleViewAllMaintenance}>
            <Icons.MoreHorizontal size={32} color={Colors.primary} />
            <Text style={styles.viewMoreText}>View {reminders.length - 5} More</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push('/profile')}
        >
          <Icons.Plus size={16} color={Colors.primary} />
          <Text style={styles.quickActionText}>Add Vehicle</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push('/request')}
        >
          <Icons.Wrench size={16} color={Colors.primary} />
          <Text style={styles.quickActionText}>Request Service</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getPriorityColor(priority: 'low' | 'medium' | 'high'): string {
  switch (priority) {
    case 'high': return Colors.error;
    case 'medium': return Colors.warning;
    default: return Colors.success;
  }
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  emptyContainer: {
    backgroundColor: Colors.card,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  addVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addVehicleText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    backgroundColor: Colors.warning,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  remindersList: {
    paddingLeft: 20,
    marginBottom: 16,
  },
  reminderCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 240,
    position: 'relative',
  },
  overdueCard: {
    borderColor: Colors.error + '40',
    backgroundColor: Colors.error + '10',
  },
  highPriorityCard: {
    borderWidth: 2,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reminderTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 20,
  },
  overdueText: {
    color: Colors.error,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  vehicleName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dueText: {
    fontSize: 12,
    color: Colors.warning,
    fontWeight: '500',
  },
  mileageText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 12,
    lineHeight: 14,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  overdueScheduleButton: {
    backgroundColor: Colors.error + '20',
    borderColor: Colors.error,
  },
  scheduleButtonText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  overdueScheduleButtonText: {
    color: Colors.error,
  },
  priorityIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 4,
    height: '100%',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  viewMoreCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 32,
    marginRight: 12,
    width: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewMoreText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
});