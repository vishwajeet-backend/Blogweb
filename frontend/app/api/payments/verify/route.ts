import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { verifyPayment, fetchOrderDetails, fetchPaymentDetails } from '@/lib/services/razorpay.service';
import prisma from '@/lib/prisma';
import { SubscriptionPlan } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No access token provided' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    const currentUser = await authService.getCurrentUser(accessToken);

    // Get payment details from request body
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing payment details' },
        { status: 400 }
      );
    }

    // Verify the payment signature
    const isValid = verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Fetch order details to get plan info
    const orderDetails = await fetchOrderDetails(razorpay_order_id);
    const paymentDetails = await fetchPaymentDetails(razorpay_payment_id);
    const notes = orderDetails.notes as { plan: string; billingPeriod: string; userId: string };

    if (String(orderDetails.currency || '').toUpperCase() !== 'INR') {
      return NextResponse.json(
        { success: false, error: 'Invalid currency in order. Only INR is supported.' },
        { status: 400 }
      );
    }

    if (String(paymentDetails.currency || '').toUpperCase() !== 'INR') {
      return NextResponse.json(
        { success: false, error: 'Invalid currency in payment. Only INR is supported.' },
        { status: 400 }
      );
    }

    if (paymentDetails.order_id !== razorpay_order_id) {
      return NextResponse.json(
        { success: false, error: 'Payment/order mismatch' },
        { status: 400 }
      );
    }

    if (Number(paymentDetails.amount || 0) !== Number(orderDetails.amount || 0)) {
      return NextResponse.json(
        { success: false, error: 'Payment amount mismatch' },
        { status: 400 }
      );
    }

    // Verify the order belongs to the current user
    if (notes.userId !== currentUser.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Calculate subscription dates
    const now = new Date();
    const subscriptionEndDate = new Date(now);

    if (notes.billingPeriod === 'annual') {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
    } else {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    }

    // Update user subscription in database
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        subscriptionPlan: notes.plan as SubscriptionPlan,
        subscriptionStatus: 'ACTIVE',
        subscriptionStartDate: now,
        subscriptionEndDate: subscriptionEndDate,
      },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
      },
    });

    // Log the payment in activity log
    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: 'SUBSCRIPTION_PURCHASED',
        metadata: {
          plan: notes.plan,
          billingPeriod: notes.billingPeriod,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          amountPaise: Number(orderDetails.amount || 0),
          amountInRupees: Number(orderDetails.amount || 0) / 100,
          currency: 'INR',
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription activated',
      data: {
        user: updatedUser,
        payment: {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          amountInRupees: Number(orderDetails.amount || 0) / 100,
          currency: 'INR',
        },
      },
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
