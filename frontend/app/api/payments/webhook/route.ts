import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { SubscriptionPlan } from '@prisma/client';

// Razorpay webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    const eventType = event.event;

    console.log('Razorpay webhook event:', eventType);

    switch (eventType) {
      case 'payment.captured': {
        // Payment was successful
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;
        const paymentId = payment.id;
        const notes = payment.notes;

        if (String(payment.currency || '').toUpperCase() !== 'INR') {
          return NextResponse.json(
            { success: false, error: 'Invalid currency in webhook payment. Only INR is supported.' },
            { status: 400 }
          );
        }

        if (notes && notes.userId && notes.plan) {
          // Calculate subscription dates
          const now = new Date();
          const subscriptionEndDate = new Date(now);

          if (notes.billingPeriod === 'annual') {
            subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
          } else {
            subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
          }

          // Update user subscription
          await prisma.user.update({
            where: { id: notes.userId },
            data: {
              subscriptionPlan: notes.plan as SubscriptionPlan,
              subscriptionStatus: 'ACTIVE',
              subscriptionStartDate: now,
              subscriptionEndDate: subscriptionEndDate,
            },
          });

          // Log the payment
          await prisma.activityLog.create({
            data: {
              userId: notes.userId,
              action: 'SUBSCRIPTION_WEBHOOK_CAPTURED',
              metadata: {
                plan: notes.plan,
                billingPeriod: notes.billingPeriod,
                paymentId,
                orderId,
                amountPaise: Number(payment.amount || 0),
                amountInRupees: Number(payment.amount || 0) / 100,
                currency: 'INR',
              },
            },
          });
        }
        break;
      }

      case 'payment.failed': {
        // Payment failed
        const payment = event.payload.payment.entity;
        const notes = payment.notes;

        if (notes && notes.userId) {
          await prisma.activityLog.create({
            data: {
              userId: notes.userId,
              action: 'PAYMENT_FAILED',
              metadata: {
                plan: notes.plan,
                billingPeriod: notes.billingPeriod,
                paymentId: payment.id,
                orderId: payment.order_id,
                amountPaise: Number(payment.amount || 0),
                amountInRupees: Number(payment.amount || 0) / 100,
                currency: String(payment.currency || 'INR').toUpperCase(),
                error: payment.error_description,
              },
            },
          });
        }
        break;
      }

      case 'subscription.activated': {
        // For Razorpay subscriptions (if using)
        const subscription = event.payload.subscription.entity;
        console.log('Subscription activated:', subscription.id);
        break;
      }

      case 'subscription.cancelled': {
        // Subscription was cancelled
        const subscription = event.payload.subscription.entity;
        const notes = subscription.notes;

        if (notes && notes.userId) {
          await prisma.user.update({
            where: { id: notes.userId },
            data: {
              subscriptionStatus: 'CANCELLED',
            },
          });
        }
        break;
      }

      default:
        console.log('Unhandled webhook event:', eventType);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
