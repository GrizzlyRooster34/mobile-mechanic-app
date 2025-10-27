import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '~/lib/stripe';
import { db } from '~/server/db';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!endpointSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    const event = await stripeService.constructEvent(body, signature, endpointSecret);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object as Stripe.Dispute);
        break;
      
      case 'invoice.payment_succeeded':
        // Handle recurring payments if needed
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const payment = await db.payment.findFirst({
      where: { stripePaymentId: paymentIntent.id },
      include: { serviceRequest: true },
    });

    if (!payment) {
      console.error(`Payment not found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    // Update payment status
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(),
      },
    });

    // Update service request status
    await db.serviceRequest.update({
      where: { id: payment.serviceRequestId },
      data: { status: 'COMPLETED' },
    });

    console.log(`Payment ${payment.id} marked as completed`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const payment = await db.payment.findFirst({
      where: { stripePaymentId: paymentIntent.id },
    });

    if (!payment) {
      console.error(`Payment not found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    // Update payment status
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
      },
    });

    console.log(`Payment ${payment.id} marked as failed`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    const payment = await db.payment.findFirst({
      where: { stripePaymentId: paymentIntent.id },
    });

    if (!payment) {
      console.error(`Payment not found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    // Update payment status
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: 'CANCELLED',
      },
    });

    console.log(`Payment ${payment.id} marked as canceled`);
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}

async function handleChargeDispute(dispute: Stripe.Dispute) {
  try {
    // Find the payment associated with this charge
    const payment = await db.payment.findFirst({
      where: { stripePaymentId: dispute.payment_intent as string },
    });

    if (!payment) {
      console.error(`Payment not found for disputed charge: ${dispute.charge}`);
      return;
    }

    // Log the dispute - you might want to notify administrators
    console.log(`Dispute created for payment ${payment.id}:`, {
      disputeId: dispute.id,
      amount: dispute.amount,
      reason: dispute.reason,
      status: dispute.status,
    });

    // Optionally update payment status or create a dispute record
    // This depends on your business requirements
  } catch (error) {
    console.error('Error handling charge dispute:', error);
  }
}