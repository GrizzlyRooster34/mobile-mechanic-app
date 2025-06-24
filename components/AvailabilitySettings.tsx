import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '@/constants/colors';
import * as Icons from 'lucide-react-native';

interface AvailabilitySettingsProps {
  onSettingsChange: (settings: AvailabilitySettings) => void;
}

interface AvailabilitySettings {
  isAvailable: boolean;
  workingDays: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  workingHours: {
    start: string;
    end: string;
  };
  emergencyAvailable: boolean;
  maxJobsPerDay: number;
  travelRadius: number; // in miles
  autoAcceptJobs: boolean;
}

export function AvailabilitySettings({ onSettingsChange }: AvailabilitySettingsProps) {
  const [settings, setSettings] = useState<AvailabilitySettings>({
    isAvailable: true,
    workingDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: false,
    },
    workingHours: {
      start: '08:00',
      end: '18:00',
    },
    emergencyAvailable: true,
    maxJobsPerDay: 8,
    travelRadius: 25,
    autoAcceptJobs: false,
  });

  const updateSetting = <K extends keyof AvailabilitySettings>(
    key: K,
    value: AvailabilitySettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const updateWorkingDay = (day: keyof AvailabilitySettings['workingDays'], value: boolean) => {
    const newWorkingDays = { ...settings.workingDays, [day]: value };
    updateSetting('workingDays', newWorkingDays);
  };

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Overall Availability */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General Availability</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <View style={styles.settingIcon}>
              <Icons.Power size={20} color={settings.isAvailable ? Colors.success : Colors.textMuted} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Available for Jobs</Text>
              <Text style={styles.settingDescription}>
                {settings.isAvailable ? 'Currently accepting new jobs' : 'Not accepting new jobs'}
              </Text>
            </View>
          </View>
          <Switch
            value={settings.isAvailable}
            onValueChange={(value) => updateSetting('isAvailable', value)}
            trackColor={{ false: Colors.border, true: Colors.success + '40' }}
            thumbColor={settings.isAvailable ? Colors.success : Colors.textMuted}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <View style={styles.settingIcon}>
              <Icons.AlertTriangle size={20} color={Colors.warning} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Emergency Services</Text>
              <Text style={styles.settingDescription}>Available for emergency roadside assistance</Text>
            </View>
          </View>
          <Switch
            value={settings.emergencyAvailable}
            onValueChange={(value) => updateSetting('emergencyAvailable', value)}
            trackColor={{ false: Colors.border, true: Colors.warning + '40' }}
            thumbColor={settings.emergencyAvailable ? Colors.warning : Colors.textMuted}
          />
        </View>
      </View>

      {/* Working Days */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Working Days</Text>
        {daysOfWeek.map((day) => (
          <View key={day.key} style={styles.dayItem}>
            <Text style={styles.dayLabel}>{day.label}</Text>
            <Switch
              value={settings.workingDays[day.key as keyof typeof settings.workingDays]}
              onValueChange={(value) => updateWorkingDay(day.key as keyof typeof settings.workingDays, value)}
              trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
              thumbColor={settings.workingDays[day.key as keyof typeof settings.workingDays] ? Colors.primary : Colors.textMuted}
            />
          </View>
        ))}
      </View>

      {/* Working Hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Working Hours</Text>
        <View style={styles.hoursContainer}>
          <TouchableOpacity style={styles.timeButton}>
            <Icons.Clock size={20} color={Colors.primary} />
            <View style={styles.timeContent}>
              <Text style={styles.timeLabel}>Start Time</Text>
              <Text style={styles.timeValue}>{settings.workingHours.start}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.timeButton}>
            <Icons.Clock size={20} color={Colors.primary} />
            <View style={styles.timeContent}>
              <Text style={styles.timeLabel}>End Time</Text>
              <Text style={styles.timeValue}>{settings.workingHours.end}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Job Limits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Job Management</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <View style={styles.settingIcon}>
              <Icons.Calendar size={20} color={Colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Max Jobs Per Day</Text>
              <Text style={styles.settingDescription}>{settings.maxJobsPerDay} jobs maximum</Text>
            </View>
          </View>
          <Icons.ChevronRight size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <View style={styles.settingIcon}>
              <Icons.MapPin size={20} color={Colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Travel Radius</Text>
              <Text style={styles.settingDescription}>{settings.travelRadius} miles from base location</Text>
            </View>
          </View>
          <Icons.ChevronRight size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <View style={styles.settingIcon}>
              <Icons.Zap size={20} color={Colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Auto-Accept Jobs</Text>
              <Text style={styles.settingDescription}>Automatically accept jobs within criteria</Text>
            </View>
          </View>
          <Switch
            value={settings.autoAcceptJobs}
            onValueChange={(value) => updateSetting('autoAcceptJobs', value)}
            trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
            thumbColor={settings.autoAcceptJobs ? Colors.primary : Colors.textMuted}
          />
        </View>
      </View>

      {/* Status Summary */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Icons.Info size={20} color={Colors.primary} />
          <Text style={styles.statusTitle}>Current Status</Text>
        </View>
        <Text style={styles.statusText}>
          {settings.isAvailable 
            ? `Available for jobs • ${Object.values(settings.workingDays).filter(Boolean).length} days/week • ${settings.workingHours.start} - ${settings.workingHours.end}`
            : 'Currently unavailable for new jobs'
          }
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
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
  settingDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  dayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  hoursContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  timeContent: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  statusCard: {
    backgroundColor: Colors.primary + '10',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  statusText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});