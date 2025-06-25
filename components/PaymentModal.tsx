import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { StripePayment } from '@/components/StripePayment';
import { Quote } from '@/src/types';
import * as Icons from 'lucide-react-native';

interface PaymentModalProps {
  visible: boolean;
  quote: Quote;
  onPaymentSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

export function PaymentModal({ visible, quote, onPaymentSuccess, onCancel }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaymentSuccess = (paymentId: string) => {
    setIsProcessing(false);
    onPaymentSuccess(paymentId);
  };

  const handlePaymentError = (error: string) => {
    setIsProcessing(false);
    Alert.alert('Payment Failed', error);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete Payment</Text>
          <TouchableOpacity 
            onPress={onCancel} 
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close payment modal"
          >
            <Icons.X size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.quoteSection}>
            <Text style={styles.sectionTitle}>Quote Summary</Text>
            <View style={styles.quoteDetails}>
              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>Service:</Text>
                <Text style={styles.quoteValue}>{quote.description}</Text>
              </View>
              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>Labor:</Text>
                <Text style={styles.quoteValue}>${quote.laborCost}</Text>
              </View>
              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>Parts:</Text>
                <Text style={styles.quoteValue}>${quote.partsCost}</Text>
              </View>
              <View style={[styles.quoteRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>${quote.totalCost}</Text>
              </View>
            </View>
          </View>

          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <StripePayment
              amount={quote.totalCost}
              description={quote.description}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              isProcessing={isProcessing}
              onProcessingChange={setIsProcessing}
            />
          </View>
        </View>

        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.processingText}>Processing payment...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    padding: 8,
    minHeight: 44, // Accessibility touch target
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  quoteSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  quoteDetails: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
    paddingTop: 16,
  },
  quoteLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  quoteValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  paymentSection: {
    flex: 1,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    color: Colors.white,
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
});