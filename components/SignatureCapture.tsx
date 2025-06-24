import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
  TextInput,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { SignatureData } from '@/src/types';
import * as Icons from 'lucide-react-native';

// Mock signature canvas component - in production you'd use react-native-signature-canvas
interface SignatureCanvasProps {
  onSignatureChange: (signature: string) => void;
  backgroundColor?: string;
  penColor?: string;
  strokeWidth?: number;
  style?: any;
}

// Simplified signature canvas mock for demonstration
const SignatureCanvas = ({ onSignatureChange, style, backgroundColor = 'white' }: SignatureCanvasProps) => {
  const [hasSignature, setHasSignature] = useState(false);
  
  const handlePress = useCallback(() => {
    // In production, this would capture actual signature data
    const mockSignature = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
    setHasSignature(true);
    onSignatureChange(mockSignature);
  }, [onSignatureChange]);
  
  return (
    <View style={[styles.canvasContainer, style, { backgroundColor }]}>
      <View style={styles.canvasPlaceholder} onTouchStart={handlePress}>
        {hasSignature ? (
          <Text style={styles.signatureText}>Signature Captured</Text>
        ) : (
          <Text style={styles.placeholderText}>Tap here to sign</Text>
        )}
      </View>
    </View>
  );
};

interface SignatureCaptureProps {
  jobId: string;
  customerName?: string;
  onSignatureComplete: (signatureData: SignatureData) => Promise<void>;
  onCancel?: () => void;
  agreementText?: string;
  requireCustomerName?: boolean;
}

const DEFAULT_AGREEMENT = `I acknowledge that the work described above has been completed to my satisfaction. I agree to pay the total amount due and understand that additional charges may apply for any additional services requested.

By signing below, I confirm that:
• The work has been completed as requested
• I have been informed of any issues found during service
• I accept responsibility for payment of services rendered
• I understand the warranty terms for this service`;

const { width: screenWidth } = Dimensions.get('window');
const CANVAS_WIDTH = screenWidth - 32;
const CANVAS_HEIGHT = 200;

export function SignatureCapture({
  jobId,
  customerName: initialCustomerName = '',
  onSignatureComplete,
  onCancel,
  agreementText = DEFAULT_AGREEMENT,
  requireCustomerName = true,
}: SignatureCaptureProps) {
  const [signature, setSignature] = useState<string>('');
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const signatureRef = useRef<any>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (requireCustomerName && !customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!signature) {
      newErrors.signature = 'Signature is required';
    }

    if (!agreementAccepted) {
      newErrors.agreement = 'Please accept the service agreement';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignatureChange = (signatureData: string) => {
    setSignature(signatureData);
    if (errors.signature) {
      setErrors(prev => ({ ...prev, signature: '' }));
    }
  };

  const handleClearSignature = () => {
    setSignature('');
    // In production, you'd clear the signature canvas
    // signatureRef.current?.clearSignature();
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const signatureData: SignatureData = {
        signature,
        timestamp: new Date(),
        customerName: customerName.trim(),
        jobId,
        agreementAccepted,
      };

      await onSignatureComplete(signatureData);
      
      // Log successful signature capture in production
      if (__DEV__) {
        console.log('Signature captured successfully:', {
          jobId,
          customerName: customerName.trim(),
          timestamp: new Date().toISOString(),
        });
      }
      
      Alert.alert('Success', 'Service completion confirmed successfully!');
    } catch (error) {
      console.error('Error saving signature:', error);
      Alert.alert(
        'Error',
        'Failed to save signature. Please try again or contact support.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgreementToggle = () => {
    setAgreementAccepted(!agreementAccepted);
    if (errors.agreement) {
      setErrors(prev => ({ ...prev, agreement: '' }));
    }
  };

  const isFormValid = signature && customerName.trim() && agreementAccepted;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icons.FileSignature size={24} color={Colors.primary} />
        <Text style={styles.title}>Service Completion</Text>
      </View>

      {/* Customer Name Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.textInput,
              errors.customerName && styles.inputError,
            ]}
            value={customerName}
            onChangeText={(text) => {
              setCustomerName(text);
              if (errors.customerName) {
                setErrors(prev => ({ ...prev, customerName: '' }));
              }
            }}
            placeholder="Enter customer full name"
            autoCapitalize="words"
            autoCorrect={false}
          />
          {errors.customerName && (
            <Text style={styles.errorText}>{errors.customerName}</Text>
          )}
        </View>
      </View>

      {/* Service Agreement */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Agreement</Text>
        <View style={styles.agreementContainer}>
          <Text style={styles.agreementText}>{agreementText}</Text>
        </View>
      </View>

      {/* Signature Canvas */}
      <View style={styles.section}>
        <View style={styles.signatureHeader}>
          <Text style={styles.sectionTitle}>Digital Signature</Text>
          <Button
            title="Clear"
            onPress={handleClearSignature}
            variant="outline"
            size="small"
          />
        </View>
        
        <SignatureCanvas
          ref={signatureRef}
          onSignatureChange={handleSignatureChange}
          backgroundColor={Colors.white}
          penColor={Colors.text}
          strokeWidth={3}
          style={[
            styles.signatureCanvas,
            errors.signature && styles.canvasError,
          ]}
        />
        
        {errors.signature && (
          <Text style={styles.errorText}>{errors.signature}</Text>
        )}
        
        <Text style={styles.signatureHint}>
          {Platform.OS === 'web' 
            ? 'Click and drag to create your signature'
            : 'Use your finger to sign above'
          }
        </Text>
      </View>

      {/* Agreement Acceptance */}
      <View style={styles.section}>
        <View style={styles.checkboxContainer}>
          <Button
            title={agreementAccepted ? '✓' : ''}
            onPress={handleAgreementToggle}
            variant={agreementAccepted ? 'primary' : 'outline'}
            size="small"
            style={styles.checkbox}
          />
          <Text style={styles.checkboxLabel}>
            I accept the service agreement and confirm work completion
          </Text>
        </View>
        {errors.agreement && (
          <Text style={styles.errorText}>{errors.agreement}</Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
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
          title="Complete Service"
          onPress={handleSubmit}
          variant="primary"
          size="medium"
          loading={isLoading}
          disabled={!isFormValid}
          style={styles.submitButton}
        />
      </View>

      {/* Form Status Indicator */}
      {Platform.OS !== 'web' && (
        <View style={styles.statusIndicator}>
          <View style={[
            styles.statusDot,
            { backgroundColor: signature ? Colors.success : Colors.gray400 }
          ]} />
          <Text style={styles.statusText}>Signature</Text>
          
          <View style={[
            styles.statusDot,
            { backgroundColor: customerName.trim() ? Colors.success : Colors.gray400 }
          ]} />
          <Text style={styles.statusText}>Name</Text>
          
          <View style={[
            styles.statusDot,
            { backgroundColor: agreementAccepted ? Colors.success : Colors.gray400 }
          ]} />
          <Text style={styles.statusText}>Agreement</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
  agreementContainer: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    maxHeight: 120,
  },
  agreementText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  signatureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  signatureCanvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  canvasError: {
    borderColor: Colors.error,
  },
  canvasContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvasPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  placeholderText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  signatureText: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '500',
  },
  signatureHint: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 30,
    height: 30,
    marginRight: 12,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  statusText: {
    fontSize: 10,
    color: Colors.textMuted,
    marginRight: 12,
  },
});