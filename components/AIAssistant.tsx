import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { trpc } from '@/lib/trpc';
import { Vehicle, DiagnosticResult, ServiceType } from '@/types/service';
import { SERVICE_CATEGORIES } from '@/constants/services';
import * as Icons from 'lucide-react-native';
import { router } from 'expo-router';

interface AIAssistantProps {
  vehicle?: Vehicle;
  onDiagnosisComplete?: (diagnosis: DiagnosticResult) => void;
  initialSymptoms?: string;
}

export function AIAssistant({ vehicle, onDiagnosisComplete, initialSymptoms = '' }: AIAssistantProps) {
  const [symptoms, setSymptoms] = useState(initialSymptoms);
  const [additionalContext, setAdditionalContext] = useState('');
  const [diagnosis, setDiagnosis] = useState<DiagnosticResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const diagnosisMutation = trpc.diagnosis.diagnose.useMutation({
    onSuccess: (result: DiagnosticResult) => {
      setDiagnosis(result);
      onDiagnosisComplete?.(result);
      setIsAnalyzing(false);
    },
    onError: (error: any) => {
      Alert.alert(
        'Analysis Failed', 
        error.message || 'Unable to analyze symptoms. Please try again or contact support.',
        [{ text: 'OK' }]
      );
      setIsAnalyzing(false);
    },
  });

  const handleAnalyze = async () => {
    if (!vehicle) {
      Alert.alert('Vehicle Required', 'Please select or add a vehicle first.');
      return;
    }

    if (!symptoms.trim()) {
      Alert.alert('Symptoms Required', 'Please describe the issue you are experiencing.');
      return;
    }

    setIsAnalyzing(true);
    setDiagnosis(null);

    diagnosisMutation.mutate({
      vehicleInfo: {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        mileage: vehicle.mileage,
        engine: vehicle.engine,
        vin: vehicle.vin,
      },
      symptoms: symptoms.trim(),
      additionalContext: additionalContext.trim() || undefined,
    });
  };

  const handleRequestService = (serviceType: string) => {
    if (!vehicle) return;
    
    router.push({
      pathname: '/request',
      params: {
        serviceType,
        vehicleId: vehicle.id,
        symptoms: symptoms.trim(),
        aiDiagnosis: JSON.stringify(diagnosis),
        urgent: diagnosis?.urgencyLevel === 'emergency' ? 'true' : 'false',
      }
    });
  };

  const handleCreateQuote = () => {
    if (!diagnosis || !vehicle) return;
    
    // Navigate to request with pre-filled AI diagnosis data
    router.push({
      pathname: '/request',
      params: {
        serviceType: diagnosis.recommendedServiceTypes?.[0] || 'general_repair',
        vehicleId: vehicle.id,
        symptoms: symptoms.trim(),
        aiDiagnosis: JSON.stringify(diagnosis),
        urgent: diagnosis.urgencyLevel === 'emergency' ? 'true' : 'false',
        autoQuote: 'true', // Flag to auto-generate quote
      }
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return Colors.error;
      case 'high': return Colors.warning;
      case 'medium': return Colors.primary;
      default: return Colors.success;
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high': return <Icons.CheckCircle size={16} color={Colors.success} />;
      case 'medium': return <Icons.AlertCircle size={16} color={Colors.warning} />;
      default: return <Icons.HelpCircle size={16} color={Colors.textMuted} />;
    }
  };

  const getServiceTitle = (serviceType: string) => {
    return SERVICE_CATEGORIES.find(s => s.id === serviceType)?.title || serviceType;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icons.Brain size={24} color={Colors.primary} />
        <Text style={styles.title}>AI Diagnostic Assistant</Text>
      </View>

      <Text style={styles.subtitle}>
        Describe your vehicle's symptoms and get AI-powered diagnostic suggestions
      </Text>

      {/* Vehicle Info Display */}
      {vehicle && (
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleText}>
            {vehicle.year} {vehicle.make} {vehicle.model}
            {vehicle.mileage && ` • ${vehicle.mileage.toLocaleString()} miles`}
          </Text>
        </View>
      )}

      {/* Symptoms Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Describe the Problem *</Text>
        <TextInput
          style={styles.textArea}
          value={symptoms}
          onChangeText={setSymptoms}
          placeholder="Example: Engine makes a grinding noise when starting, especially in cold weather. The noise lasts about 5 seconds then stops..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Additional Context */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Additional Context (Optional)</Text>
        <TextInput
          style={styles.textInput}
          value={additionalContext}
          onChangeText={setAdditionalContext}
          placeholder="When did it start? Any recent repairs? Driving conditions?"
          placeholderTextColor={Colors.textMuted}
          multiline
        />
      </View>

      {/* Analyze Button */}
      <Button
        title={isAnalyzing ? 'Analyzing...' : 'Analyze Issue'}
        onPress={handleAnalyze}
        disabled={isAnalyzing || !symptoms.trim() || !vehicle}
        style={styles.analyzeButton}
      />

      {/* Loading State */}
      {isAnalyzing && (
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text style={styles.loadingText}>AI is analyzing your vehicle's symptoms...</Text>
          <Text style={styles.loadingSubtext}>This may take a few moments</Text>
        </View>
      )}

      {/* Diagnosis Results */}
      {diagnosis && (
        <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Diagnostic Analysis Complete</Text>
            <View style={styles.confidenceRow}>
              {getConfidenceIcon(diagnosis.confidence)}
              <Text style={styles.confidenceText}>
                {diagnosis.confidence.charAt(0).toUpperCase() + diagnosis.confidence.slice(1)} Confidence
              </Text>
            </View>
          </View>

          {/* Urgency Level */}
          <View style={[styles.urgencyBadge, { borderColor: getUrgencyColor(diagnosis.urgencyLevel) }]}>
            <Icons.AlertTriangle size={16} color={getUrgencyColor(diagnosis.urgencyLevel)} />
            <Text style={[styles.urgencyText, { color: getUrgencyColor(diagnosis.urgencyLevel) }]}>
              {diagnosis.urgencyLevel.toUpperCase()} PRIORITY
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.quickActions}>
            <Button
              title="Get Quote Now"
              onPress={handleCreateQuote}
              style={styles.primaryAction}
            />
            <Button
              title="Request Service"
              variant="outline"
              onPress={() => handleRequestService(diagnosis.recommendedServiceTypes?.[0] || 'general_repair')}
              style={styles.secondaryAction}
            />
          </View>

          {/* Likely Causes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Most Likely Causes</Text>
            {diagnosis.likelyCauses.map((cause, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.causeNumber}>
                  <Text style={styles.causeNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.listText}>{cause}</Text>
              </View>
            ))}
          </View>

          {/* Diagnostic Steps */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Diagnostic Steps</Text>
            {diagnosis.diagnosticSteps.map((step, index) => (
              <View key={index} style={styles.listItem}>
                <Icons.CheckSquare size={16} color={Colors.primary} />
                <Text style={styles.listText}>{step}</Text>
              </View>
            ))}
          </View>

          {/* Recommended Services */}
          {diagnosis.recommendedServiceTypes && diagnosis.recommendedServiceTypes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommended Services</Text>
              {diagnosis.recommendedServiceTypes.map((serviceType, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.serviceRecommendation}
                  onPress={() => handleRequestService(serviceType)}
                >
                  <View style={styles.serviceInfo}>
                    <Icons.Wrench size={16} color={Colors.primary} />
                    <Text style={styles.serviceTitle}>{getServiceTitle(serviceType)}</Text>
                  </View>
                  <View style={styles.serviceAction}>
                    <Text style={styles.serviceActionText}>Request</Text>
                    <Icons.ChevronRight size={16} color={Colors.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Matched Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Related Services</Text>
            {diagnosis.matchedServices.map((service, index) => (
              <View key={index} style={styles.serviceItem}>
                <Icons.Settings size={16} color={Colors.secondary} />
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
          </View>

          {/* Estimated Cost */}
          {diagnosis.estimatedCost && (
            <View style={styles.costSection}>
              <Text style={styles.sectionTitle}>Estimated Cost Range</Text>
              <View style={styles.costDisplay}>
                <Text style={styles.costText}>
                  ${diagnosis.estimatedCost.min} - ${diagnosis.estimatedCost.max}
                </Text>
                <Text style={styles.costNote}>
                  *Actual costs may vary based on parts availability and labor requirements
                </Text>
              </View>
            </View>
          )}

          <View style={styles.disclaimer}>
            <Icons.Info size={16} color={Colors.textMuted} />
            <Text style={styles.disclaimerText}>
              This AI analysis is for informational purposes only. Professional diagnosis is recommended for accurate assessment and safety.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  vehicleInfo: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  vehicleText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
    minHeight: 80,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
    minHeight: 40,
  },
  analyzeButton: {
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  resultsContainer: {
    maxHeight: 600,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickActionsHeader: {
    marginBottom: 8,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  primaryAction: {
    flex: 1,
  },
  secondaryAction: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  causeNumber: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  causeNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  serviceRecommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary + '10',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  serviceAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.background,
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  serviceText: {
    fontSize: 14,
    color: Colors.text,
  },
  costSection: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  costDisplay: {
    alignItems: 'center',
  },
  costText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  costNote: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});