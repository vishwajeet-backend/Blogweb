import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { createOrder, PlanType, BillingPeriod } from '@/lib/services/razorpay.service';

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

    // Get plan details from request body
    const body = await request.json();
    const { plan, billingPeriod } = body as {
      plan: string;
      billingPeriod: string;
    };

    // Accept legacy plan ids from older UI as aliases.
    const normalizedPlan = String(plan || '').toUpperCase();
    const planAliasMap: Record<string, PlanType> = {
      STARTER: 'STARTER',
      CREATOR: 'CREATOR',
      PROFESSIONAL: 'PROFESSIONAL',
      BASIC: 'STARTER',
      BUSINESS: 'CREATOR',
      ENTERPRISE: 'PROFESSIONAL',
    };

    const normalizedBillingPeriod = String(billingPeriod || '').toLowerCase() as BillingPeriod;
    const resolvedPlan = planAliasMap[normalizedPlan];

    // Validate plan
    if (!resolvedPlan) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Validate billing period
    if (!['monthly', 'annual'].includes(normalizedBillingPeriod)) {
      return NextResponse.json(
        { success: false, error: 'Invalid billing period' },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const orderData = await createOrder({
      plan: resolvedPlan,
      billingPeriod: normalizedBillingPeriod,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: currentUser.name,
    });

    return NextResponse.json({
      success: true,
      data: orderData,
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
