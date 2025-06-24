import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { Quote } from '@/types/service';
import * as Icons from 'lucide-react-native';

interface StripePaymentProps {
  quote: Quote;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

export function StripePayment({ quote, onSuccess, onCancel }: StripePaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'google_pay'>('card');

  const handleStripePayment = async () => {
    setIsProcessing(true);
    
    try {
      // In production, this would integrate with Stripe SDK
      // For now, we'll simulate the payment process
      
      // 1. Create payment intent on your backend
      const paymentIntent = await createPaymentIntent(quote);
      
      // 2. Confirm payment with Stripe
      const result = await confirmPayment(paymentIntent.client_secret, paymentMethod);
      
      if (result.success) {
        onSuccess(result.paymentIntentId);
      } else {
        Alert.alert('Payment Failed', result.error || 'Please try again.');
      }
    } catch (error) {
      Alert.alert('Payment Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Mock functions - replace with actual Stripe integration
  const createPaymentIntent = async (quote: Quote) => {
    // This would call your backend to create a Stripe PaymentIntent
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      client_secret: 'pi_mock_client_secret',
      amount: quote.totalCost * 100, // Stripe uses cents
    };
  };

  const confirmPayment = async (clientSecret: string, method: string) => {
    // This would use Stripe SDK to confirm the payment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 90% success rate for demo
    const success = Math.random() > 0.1;
    
    if (success) {
      return {
        success: true,
        paymentIntentId: 'pi_' + Date.now(),
      };
    } else {
      return {
        success: false,
        error: 'Your card was declined. Please try a different payment method.',
      };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Secure Payment</Text>
        <TouchableOpacity onPress={onCancel}>
          <Icons.X size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Payment Amount */}
      <View style={styles.amountSection}>
        <Text style={styles.amountLabel}>Total Amount</Text>
        <Text style={styles.amountValue}>${quote.totalCost}</Text>
      </View>

      {/* Payment Methods */}
      <View style={styles.paymentMethods}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        
        <TouchableOpacity
          style={[styles.paymentOption, paymentMethod === 'card' && styles.selectedOption]}
          onPress={() => setPaymentMethod('card')}
        >
          <Icons.CreditCard size={20} color={Colors.primary} />
          <Text style={styles.paymentOptionText}>Credit/Debit Card</Text>
          {paymentMethod === 'card' && <Icons.Check size={16} color={Colors.success} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.paymentOption, paymentMethod === 'apple_pay' && styles.selectedOption]}
          onPress={() => setPaymentMethod('apple_pay')}
        >
          <Icons.Smartphone size={20} color={Colors.primary} />
          <Text style={styles.paymentOptionText}>Apple Pay</Text>
          {paymentMethod === 'apple_pay' && <Icons.Check size={16} color={Colors.success} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.paymentOption, paymentMethod === 'google_pay' && styles.selectedOption]}
          onPress={() => setPaymentMethod('google_pay')}
        >
          <Icons.Wallet size={20} color={Colors.primary} />
          <Text style={styles.paymentOptionText}>Google Pay</Text>
          {paymentMethod === 'google_pay' && <Icons.Check size={16} color={Colors.success} />}
        </TouchableOpacity>
      </View>

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Icons.Shield size={16} color={Colors.success} />
        <Text style={styles.securityText}>
          Payments are processed securely by Stripe with 256-bit SSL encryption
        </Text>
      </View>

      {/* Payment Button */}
      <View style={styles.actions}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={onCancel}
          style={styles.cancelButton}
          disabled={isProcessing}
        />
        <Button
          title={isProcessing ? 'Processing...' : `Pay ${quote.totalCost}`}
          onPress={handleStripePayment}
          style={styles.payButton}
          disabled={isProcessing}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 20,
    backgroundColor: Colors.card,
    borderRadius: 12,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
  },
  paymentMethods: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  paymentOptionText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  securityText: {
    fontSize: 12,
    color: Colors.success,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  payButton: {
    flex: 2,
  },
});