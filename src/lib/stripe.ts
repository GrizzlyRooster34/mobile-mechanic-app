import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
  typescript: true,
});

export { stripe };

export interface CreatePaymentIntentParams {
  amount: number; // in cents
  currency?: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

export class StripeService {
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    const {
      amount,
      currency = 'usd',
      customerId,
      description,
      metadata = {}
    } = params;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      description,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  }

  async createCustomer(params: {
    email: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, string>;
  }) {
    return await stripe.customers.create(params);
  }

  async retrievePaymentIntent(paymentIntentId: string) {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async updatePaymentIntent(paymentIntentId: string, params: Partial<CreatePaymentIntentParams>) {
    return await stripe.paymentIntents.update(paymentIntentId, params);
  }

  async cancelPaymentIntent(paymentIntentId: string) {
    return await stripe.paymentIntents.cancel(paymentIntentId);
  }

  async createRefund(params: {
    paymentIntentId: string;
    amount?: number; // in cents, if not provided refunds full amount
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    metadata?: Record<string, string>;
  }) {
    return await stripe.refunds.create({
      payment_intent: params.paymentIntentId,
      amount: params.amount,
      reason: params.reason,
      metadata: params.metadata,
    });
  }

  async constructEvent(payload: string | Buffer, signature: string, endpointSecret: string) {
    return stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  }
}

// Singleton instance
export const stripeService = new StripeService();