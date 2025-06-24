import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { ServicePricing, ServiceCategory } from '@/src/types';
import * as Icons from 'lucide-react-native';

interface ServicePricingSettingsProps {
  initialPricing?: ServicePricing;
  onSave: (pricing: ServicePricing) => Promise<void>;
  onCancel?: () => void;
}

const DEFAULT_PRICING: ServicePricing = {
  generalRates: {
    laborRate: 85,
    emergencyRate: 125,
    travelRate: 1.5,
    minimumCharge: 50,
  },
  serviceRates: {
    oil_change: 45,
    brake_repair: 120,
    tire_service: 35,
    battery_service: 25,
    engine_diagnostics: 95,
    transmission: 150,
    electrical: 110,
    cooling_system: 85,
    suspension: 135,
    exhaust: 90,
    general_maintenance: 75,
  },
  discounts: {
    senior: 10,
    military: 15,
    repeatCustomer: 5,
  },
};

const SERVICE_CATEGORIES: Array<{ key: ServiceCategory; label: string }> = [
  { key: 'oil_change', label: 'Oil Change' },
  { key: 'brake_repair', label: 'Brake Repair' },
  { key: 'tire_service', label: 'Tire Service' },
  { key: 'battery_service', label: 'Battery Service' },
  { key: 'engine_diagnostics', label: 'Engine Diagnostics' },
  { key: 'transmission', label: 'Transmission' },
  { key: 'electrical', label: 'Electrical' },
  { key: 'cooling_system', label: 'Cooling System' },
  { key: 'suspension', label: 'Suspension' },
  { key: 'exhaust', label: 'Exhaust' },
  { key: 'general_maintenance', label: 'General Maintenance' },
];

export function ServicePricingSettings({
  initialPricing,
  onSave,
  onCancel,
}: ServicePricingSettingsProps) {
  const [pricing, setPricing] = useState<ServicePricing>(
    initialPricing || DEFAULT_PRICING
  );
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    services: false,
    discounts: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateGeneralRate = (field: keyof ServicePricing['generalRates'], value: string) => {
    const numValue = parseFloat(value) || 0;
    setPricing(prev => ({
      ...prev,
      generalRates: {
        ...prev.generalRates,
        [field]: numValue,
      },
    }));
  };

  const updateServiceRate = (service: ServiceCategory, value: string) => {
    const numValue = parseFloat(value) || 0;
    setPricing(prev => ({
      ...prev,
      serviceRates: {
        ...prev.serviceRates,
        [service]: numValue,
      },
    }));
  };

  const updateDiscount = (type: keyof ServicePricing['discounts'], value: string) => {
    const numValue = parseFloat(value) || 0;
    setPricing(prev => ({
      ...prev,
      discounts: {
        ...prev.discounts,
        [type]: Math.min(100, Math.max(0, numValue)), // Keep between 0-100%
      },
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(pricing);
      Alert.alert('Success', 'Pricing settings saved successfully');
    } catch (error) {
      console.error('Error saving pricing:', error);
      Alert.alert('Error', 'Failed to save pricing settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset all pricing to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => setPricing({ ...DEFAULT_PRICING }),
        },
      ]
    );
  };

  const renderSectionHeader = (
    title: string,
    section: keyof typeof expandedSections,
    icon: React.ReactNode
  ) => (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={() => toggleSection(section)}
    >
      <View style={styles.sectionHeaderLeft}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Icons.ChevronDown
        size={20}
        color={Colors.textSecondary}
        style={[
          styles.chevron,
          expandedSections[section] && styles.chevronExpanded,
        ]}
      />
    </TouchableOpacity>
  );

  const renderInputRow = (
    label: string,
    value: number,
    onChangeText: (text: string) => void,
    prefix?: string,
    suffix?: string
  ) => (
    <View style={styles.inputRow}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputContainer}>
        {prefix && <Text style={styles.inputPrefix}>{prefix}</Text>}
        <TextInput
          style={styles.input}
          value={value.toString()}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholder="0"
        />
        {suffix && <Text style={styles.inputSuffix}>{suffix}</Text>}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* General Rates Section */}
        {renderSectionHeader(
          'General Rates',
          'general',
          <Icons.DollarSign size={20} color={Colors.primary} />
        )}
        {expandedSections.general && (
          <View style={styles.sectionContent}>
            {renderInputRow(
              'Labor Rate (per hour)',
              pricing.generalRates.laborRate,
              (value) => updateGeneralRate('laborRate', value),
              '$'
            )}
            {renderInputRow(
              'Emergency Rate (per hour)',
              pricing.generalRates.emergencyRate,
              (value) => updateGeneralRate('emergencyRate', value),
              '$'
            )}
            {renderInputRow(
              'Travel Rate (per mile)',
              pricing.generalRates.travelRate,
              (value) => updateGeneralRate('travelRate', value),
              '$'
            )}
            {renderInputRow(
              'Minimum Charge',
              pricing.generalRates.minimumCharge,
              (value) => updateGeneralRate('minimumCharge', value),
              '$'
            )}
          </View>
        )}

        {/* Service-Specific Rates Section */}
        {renderSectionHeader(
          'Service-Specific Rates',
          'services',
          <Icons.Wrench size={20} color={Colors.primary} />
        )}
        {expandedSections.services && (
          <View style={styles.sectionContent}>
            {SERVICE_CATEGORIES.map(({ key, label }) => (
              renderInputRow(
                label,
                pricing.serviceRates[key],
                (value) => updateServiceRate(key, value),
                '$',
                'base'
              )
            ))}
          </View>
        )}

        {/* Customer Discounts Section */}
        {renderSectionHeader(
          'Customer Discounts',
          'discounts',
          <Icons.Percent size={20} color={Colors.primary} />
        )}
        {expandedSections.discounts && (
          <View style={styles.sectionContent}>
            {renderInputRow(
              'Senior Discount',
              pricing.discounts.senior,
              (value) => updateDiscount('senior', value),
              undefined,
              '%'
            )}
            {renderInputRow(
              'Military Discount',
              pricing.discounts.military,
              (value) => updateDiscount('military', value),
              undefined,
              '%'
            )}
            {renderInputRow(
              'Repeat Customer Discount',
              pricing.discounts.repeatCustomer,
              (value) => updateDiscount('repeatCustomer', value),
              undefined,
              '%'
            )}
          </View>
        )}

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Pricing Summary</Text>
          <Text style={styles.summaryText}>
            Base Labor: ${pricing.generalRates.laborRate}/hr
          </Text>
          <Text style={styles.summaryText}>
            Emergency: ${pricing.generalRates.emergencyRate}/hr
          </Text>
          <Text style={styles.summaryText}>
            Maximum Discount: {Math.max(...Object.values(pricing.discounts))}%
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          title="Reset to Defaults"
          onPress={handleReset}
          variant="outline"
          size="medium"
          style={styles.resetButton}
        />
        <View style={styles.buttonRow}>
          {onCancel && (
            <Button
              title="Cancel"
              onPress={onCancel}
              variant="outline"
              size="medium"
              style={styles.cancelButton}
            />
          )}
          <Button
            title="Save Settings"
            onPress={handleSave}
            variant="primary"
            size="medium"
            loading={isLoading}
            style={styles.saveButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
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
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 12,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  sectionContent: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    minWidth: 100,
  },
  inputPrefix: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.text,
    textAlign: 'right',
  },
  inputSuffix: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  summarySection: {
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  actionButtons: {
    padding: 16,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  resetButton: {
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});