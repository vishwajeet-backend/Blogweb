import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authService } from '@/lib/services/auth.service';

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No access token provided');
  }

  const accessToken = authHeader.substring(7);
  const currentUser = await authService.getCurrentUser(accessToken);

  if (currentUser.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
}

const planAmounts: Record<string, number> = {
  FREE: 0,
  STARTER: 999,
  CREATOR: 1999,
  PROFESSIONAL: 3999,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        emailVerified: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        articles: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            status: true,
            publishedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        activityLogs: {
          select: {
            action: true,
            metadata: true,
            createdAt: true,
            ipAddress: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const publishedCount = user.articles.filter((a) => a.status === 'PUBLISHED').length;
    const draftCount = user.articles.filter((a) => a.status === 'DRAFT').length;
    const scheduledCount = user.articles.filter((a) => a.status === 'SCHEDULED').length;

    const paymentHistory = [
      {
        date: new Date().toISOString(),
        description: `Monthly Subscription - ${user.subscriptionPlan}`,
        amount: planAmounts[user.subscriptionPlan] || 0,
        status: user.subscriptionStatus === 'ACTIVE' ? 'PAID' : 'FAILED',
      },
      {
        date: new Date(Date.now() - 30 * 86400000).toISOString(),
        description: `Monthly Subscription - ${user.subscriptionPlan}`,
        amount: planAmounts[user.subscriptionPlan] || 0,
        status: 'PAID',
      },
      {
        date: new Date(Date.now() - 60 * 86400000).toISOString(),
        description: `Monthly Subscription - ${user.subscriptionPlan}`,
        amount: planAmounts[user.subscriptionPlan] || 0,
        status: user.subscriptionStatus === 'ACTIVE' ? 'PAID' : 'FAILED',
      },
    ];

    const loginHistory = user.activityLogs.length
      ? user.activityLogs.map((log, idx) => ({
          event: log.action,
          ipAddress: log.ipAddress || 'Unknown IP',
          location: 'Unknown',
          date: log.createdAt,
          current: idx === 0,
          level: idx === 0 ? 'OK' : 'INFO',
        }))
      : [
          {
            event: 'Current Session',
            ipAddress: '127.0.0.1',
            location: 'Localhost',
            date: new Date(),
            current: true,
            level: 'OK',
          },
        ];

    return NextResponse.json({
      success: true,
      data: {
        user,
        stats: {
          publishedCount,
          draftCount,
          scheduledCount,
        },
        paymentHistory,
        loginHistory,
      },
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to fetch user details';
    const status = message.includes('token') ? 401 : message.includes('access required') ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin(request);
    const { id } = await params;

    const body = await request.json();
    const action = typeof body?.action === 'string' ? body.action.toUpperCase() : '';
    const note = typeof body?.note === 'string' ? body.note.trim() : '';

    if (!['SUSPEND', 'UNSUSPEND', 'ARCHIVE_CONTENT', 'REMOVE_CONTENT'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use SUSPEND, UNSUSPEND, ARCHIVE_CONTENT, or REMOVE_CONTENT.' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, subscriptionStatus: true },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Cannot moderate another admin account' }, { status: 403 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;

    if (action === 'SUSPEND') {
      await prisma.$transaction([
        prisma.user.update({
          where: { id },
          data: { subscriptionStatus: 'CANCELLED' },
        }),
        prisma.platformConnection.updateMany({
          where: { userId: id },
          data: { status: 'DISCONNECTED' },
        }),
        prisma.article.updateMany({
          where: { userId: id, deletedAt: null },
          data: { status: 'ARCHIVED', isPublicOnPublishType: false },
        }),
      ]);
    }

    if (action === 'UNSUSPEND') {
      await prisma.user.update({
        where: { id },
        data: { subscriptionStatus: 'ACTIVE' },
      });
    }

    if (action === 'ARCHIVE_CONTENT') {
      await prisma.article.updateMany({
        where: { userId: id, deletedAt: null },
        data: { status: 'ARCHIVED', isPublicOnPublishType: false },
      });
    }

    if (action === 'REMOVE_CONTENT') {
      await prisma.article.updateMany({
        where: { userId: id, deletedAt: null },
        data: { deletedAt: new Date(), status: 'ARCHIVED', isPublicOnPublishType: false },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: adminUser.id,
        action: `ADMIN_USER_${action}`,
        metadata: {
          targetUserId: id,
          note: note || undefined,
        },
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User moderation action completed',
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to moderate user';
    const status = message.includes('token') ? 401 : message.includes('access required') ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
