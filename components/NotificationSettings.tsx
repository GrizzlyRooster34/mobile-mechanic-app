import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import * as Icons from 'lucide-react-native';

interface NotificationSettingsProps {
  onSettingsChange: (settings: NotificationSettings) => void;
}

interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  jobUpdates: boolean;
  maintenanceReminders: boolean;
  promotionalOffers: boolean;
  emergencyAlerts: boolean;
}

export function NotificationSettings({ onSettingsChange }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    jobUpdates: true,
    maintenanceReminders: true,
    promotionalOffers: false,
    emergencyAlerts: true,
  });

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const notificationTypes = [
    {
      key: 'pushNotifications' as keyof NotificationSettings,
      title: 'Push Notifications',
      description: 'Receive notifications on your device',
      icon: 'Bell',
    },
    {
      key: 'emailNotifications' as keyof NotificationSettings,
      title: 'Email Notifications',
      description: 'Receive updates via email',
      icon: 'Mail',
    },
    {
      key: 'smsNotifications' as keyof NotificationSettings,
      title: 'SMS Notifications',
      description: 'Receive text message updates',
      icon: 'MessageSquare',
    },
  ];

  const contentTypes = [
    {
      key: 'jobUpdates' as keyof NotificationSettings,
      title: 'Job Updates',
      description: 'Status changes, quotes, and completion notices',
      icon: 'Briefcase',
    },
    {
      key: 'maintenanceReminders' as keyof NotificationSettings,
      title: 'Maintenance Reminders',
      description: 'Scheduled service and maintenance alerts',
      icon: 'Clock',
    },
    {
      key: 'promotionalOffers' as keyof NotificationSettings,
      title: 'Promotional Offers',
      description: 'Special deals and discounts',
      icon: 'Tag',
    },
    {
      key: 'emergencyAlerts' as keyof NotificationSettings,
      title: 'Emergency Alerts',
      description: 'Urgent service notifications',
      icon: 'AlertTriangle',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Notification Methods */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Methods</Text>
        {notificationTypes.map((type) => {
          const IconComponent = Icons[type.icon as keyof typeof Icons] as any;
          return (
            <View key={type.key} style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={styles.settingIcon}>
                  {IconComponent && <IconComponent size={20} color={Colors.primary} />}
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{type.title}</Text>
                  <Text style={styles.settingDescription}>{type.description}</Text>
                </View>
              </View>
              <Switch
                value={settings[type.key]}
                onValueChange={(value) => updateSetting(type.key, value)}
                trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
                thumbColor={settings[type.key] ? Colors.primary : Colors.textMuted}
              />
            </View>
          );
        })}
      </View>

      {/* Content Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What to Notify About</Text>
        {contentTypes.map((type) => {
          const IconComponent = Icons[type.icon as keyof typeof Icons] as any;
          return (
            <View key={type.key} style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={styles.settingIcon}>
                  {IconComponent && <IconComponent size={20} color={Colors.primary} />}
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{type.title}</Text>
                  <Text style={styles.settingDescription}>{type.description}</Text>
                </View>
              </View>
              <Switch
                value={settings[type.key]}
                onValueChange={(value) => updateSetting(type.key, value)}
                trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
                thumbColor={settings[type.key] ? Colors.primary : Colors.textMuted}
              />
            </View>
          );
        })}
      </View>

      {/* Quiet Hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiet Hours</Text>
        <TouchableOpacity style={styles.quietHoursButton}>
          <View style={styles.settingInfo}>
            <View style={styles.settingIcon}>
              <Icons.Moon size={20} color={Colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Do Not Disturb</Text>
              <Text style={styles.settingDescription}>10:00 PM - 8:00 AM</Text>
            </View>
          </View>
          <Icons.ChevronRight size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
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
  quietHoursButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});