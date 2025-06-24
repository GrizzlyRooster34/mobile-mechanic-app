import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';
import { useAppStore } from '@/stores/app-store';
import { router } from 'expo-router';
import * as Icons from 'lucide-react-native';

export default function ScheduleScreen() {
  const { serviceRequests, updateServiceRequest } = useAppStore();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');

  const pendingRequests = serviceRequests.filter(r => 
    r.status === 'accepted' && !r.scheduledAt
  );

  const handleDateTimeSelect = (date: Date, timeSlot: string) => {
    setSelectedDate(date);
    setSelectedTime(timeSlot);
  };

  const handleScheduleConfirm = () => {
    if (!selectedDate || !selectedTime || pendingRequests.length === 0) {
      Alert.alert('Error', 'Please select a date and time for scheduling.');
      return;
    }

    const scheduledDateTime = new Date(selectedDate);
    const [time, period] = selectedTime.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    let adjustedHours = hours;
    if (period === 'PM' && hours !== 12) {
      adjustedHours += 12;
    } else if (period === 'AM' && hours === 12) {
      adjustedHours = 0;
    }
    
    scheduledDateTime.setHours(adjustedHours, minutes || 0, 0, 0);

    // Schedule the first pending request
    const requestToSchedule = pendingRequests[0];
    updateServiceRequest(requestToSchedule.id, {
      scheduledAt: scheduledDateTime,
      status: 'in_progress'
    });

    Alert.alert(
      'Service Scheduled',
      `Your service has been scheduled for ${selectedDate.toLocaleDateString()} at ${selectedTime}`,
      [
        { text: 'OK', onPress: () => router.back() }
      ]
    );
  };

  if (pendingRequests.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icons.Calendar size={64} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No Services to Schedule</Text>
        <Text style={styles.emptyText}>
          You don't have any accepted services that need scheduling.
        </Text>
        <Button
          title="View My Quotes"
          onPress={() => router.push('/quotes')}
          style={styles.emptyButton}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Service Info */}
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceTitle}>Schedule Your Service</Text>
          <Text style={styles.serviceDescription}>
            Select your preferred date and time for the service appointment.
          </Text>
          
          <View style={styles.serviceCard}>
            <Text style={styles.serviceName}>
              {pendingRequests[0].type.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.serviceDetails}>
              {pendingRequests[0].description}
            </Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendarSection}>
          <Text style={styles.sectionTitle}>Select Date & Time</Text>
          <AvailabilityCalendar
            onDateSelect={handleDateTimeSelect}
            selectedDate={selectedDate || undefined}
            selectedTime={selectedTime}
          />
        </View>

        {/* Selected DateTime Display */}
        {selectedDate && selectedTime && (
          <View style={styles.selectedDateTime}>
            <Icons.Calendar size={20} color={Colors.success} />
            <Text style={styles.selectedDateTimeText}>
              {selectedDate.toLocaleDateString()} at {selectedTime}
            </Text>
          </View>
        )}

        {/* Confirm Button */}
        <Button
          title="Confirm Appointment"
          onPress={handleScheduleConfirm}
          disabled={!selectedDate || !selectedTime}
          style={styles.confirmButton}
        />

        {/* Service Notes */}
        <View style={styles.serviceNotes}>
          <Text style={styles.notesTitle}>Service Notes</Text>
          <Text style={styles.notesText}>
            • Our mechanic will arrive at your location at the scheduled time
          </Text>
          <Text style={styles.notesText}>
            • Please ensure your vehicle is accessible
          </Text>
          <Text style={styles.notesText}>
            • You'll receive a confirmation and reminder notifications
          </Text>
          <Text style={styles.notesText}>
            • Contact us if you need to reschedule
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
  serviceInfo: {
    marginBottom: 24,
  },
  serviceTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 22,
  },
  serviceCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  serviceDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  calendarSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  selectedDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '20',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  selectedDateTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
  },
  confirmButton: {
    marginBottom: 24,
  },
  serviceNotes: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
    lineHeight: 20,
  },
});