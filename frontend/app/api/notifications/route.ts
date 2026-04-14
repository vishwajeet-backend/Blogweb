import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authService } from '@/lib/services/auth.service';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  type: 'info' | 'success' | 'warning' | 'admin';
  href?: string;
};

function readMetaString(metadata: any, key: string): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : null;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No access token provided' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    const currentUser = await authService.getCurrentUser(accessToken);

    const notifications: NotificationItem[] = [];

    if (currentUser.role === 'ADMIN') {
      const [recentPublished, adminLogs, reportLogs] = await Promise.all([
        prisma.article.findMany({
          where: {
            status: 'PUBLISHED',
            deletedAt: null,
            user: { role: 'USER' },
          },
          select: {
            id: true,
            title: true,
            createdAt: true,
            user: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 8,
        }),
        prisma.activityLog.findMany({
          where: {
            userId: currentUser.id,
            action: { contains: 'ADMIN_' },
          },
          select: {
            id: true,
            action: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 8,
        }),
        prisma.activityLog.findMany({
          where: {
            action: 'BLOG_REPORT_SUBMITTED',
          },
          select: {
            id: true,
            metadata: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 12,
        }),
      ]);

      for (const log of reportLogs) {
        const articleId = readMetaString(log.metadata, 'articleId');
        if (!articleId) continue;
        const articleTitle = readMetaString(log.metadata, 'articleTitle') || 'Reported article';
        const reason = readMetaString(log.metadata, 'reason') || 'Reported by user';
        const reporterName = readMetaString(log.metadata, 'reporterName') || 'A reader';

        notifications.push({
          id: `report-${log.id}`,
          title: 'Blog Reported',
          message: `${reporterName} reported "${articleTitle}" for ${reason}`,
          createdAt: log.createdAt.toISOString(),
          type: 'warning',
          href: `/admin/moderation?id=${articleId}`,
        });
      }

      for (const item of recentPublished) {
        notifications.push({
          id: `pub-${item.id}`,
          title: 'New Published Blog',
          message: `${item.user.name} published "${item.title}"`,
          createdAt: item.createdAt.toISOString(),
          type: 'admin',
          href: `/admin/moderation?id=${item.id}`,
        });
      }

      for (const log of adminLogs) {
        notifications.push({
          id: `log-${log.id}`,
          title: 'Admin Action Logged',
          message: log.action.replaceAll('_', ' '),
          createdAt: log.createdAt.toISOString(),
          type: 'info',
        });
      }
    } else {
      const [recentOwnArticles, collaborationInvites, accountLogs, reportLogs, reviewedReportLogs] = await Promise.all([
        prisma.article.findMany({
          where: {
            userId: currentUser.id,
            deletedAt: null,
          },
          select: {
            id: true,
            title: true,
            status: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: 8,
        }),
        prisma.articleCollaborator.findMany({
          where: {
            userId: currentUser.id,
            status: 'PENDING',
          },
          select: {
            id: true,
            invitedAt: true,
            role: true,
            article: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { invitedAt: 'desc' },
          take: 8,
        }),
        prisma.activityLog.findMany({
          where: {
            userId: currentUser.id,
            action: {
              in: [
                'subscription_payment_verified',
                'SUBSCRIPTION_PURCHASED',
                'BLOG_LIKE',
              ],
            },
          },
          select: {
            id: true,
            action: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 8,
        }),
        prisma.activityLog.findMany({
          where: {
            action: 'BLOG_REPORT_SUBMITTED',
          },
          select: {
            id: true,
            metadata: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 120,
        }),
        prisma.activityLog.findMany({
          where: {
            action: 'ADMIN_REVIEW_BLOG_REPORT',
          },
          select: {
            id: true,
            metadata: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 120,
        }),
      ]);

      const publisherReportLogs = reportLogs.filter((log) => readMetaString(log.metadata, 'publisherId') === currentUser.id);
      const publisherReviewedLogs = reviewedReportLogs.filter((log) => readMetaString(log.metadata, 'targetUserId') === currentUser.id);

      for (const log of publisherReportLogs.slice(0, 8)) {
        const articleId = readMetaString(log.metadata, 'articleId');
        const articleTitle = readMetaString(log.metadata, 'articleTitle') || 'your blog';
        const reason = readMetaString(log.metadata, 'reason') || 'policy concern';

        notifications.push({
          id: `publisher-report-${log.id}`,
          title: 'Your Blog Was Reported',
          message: `"${articleTitle}" was reported for ${reason}. Admin review is pending.`,
          createdAt: log.createdAt.toISOString(),
          type: 'warning',
          href: articleId ? `/dashboard/articles/${articleId}` : '/dashboard/articles',
        });
      }

      for (const log of publisherReviewedLogs.slice(0, 8)) {
        const articleId = readMetaString(log.metadata, 'articleId');
        const articleTitle = readMetaString(log.metadata, 'articleTitle') || 'your blog';
        const decision = readMetaString(log.metadata, 'decision') || 'REVIEWED';

        notifications.push({
          id: `publisher-reviewed-report-${log.id}`,
          title: 'Report Reviewed by Admin',
          message: `Admin marked "${articleTitle}" as ${decision}.`,
          createdAt: log.createdAt.toISOString(),
          type: decision === 'APPROVE' ? 'success' : 'info',
          href: articleId ? `/dashboard/articles/${articleId}` : '/dashboard/articles',
        });
      }

      for (const article of recentOwnArticles) {
        notifications.push({
          id: `article-${article.id}`,
          title: 'Article Update',
          message: `"${article.title}" is ${article.status.toLowerCase()}`,
          createdAt: article.updatedAt.toISOString(),
          type: article.status === 'PUBLISHED' ? 'success' : 'info',
          href: `/dashboard/articles/${article.id}`,
        });
      }

      for (const invite of collaborationInvites) {
        notifications.push({
          id: `invite-${invite.id}`,
          title: 'Collaboration Invite',
          message: `You were invited as ${invite.role} on "${invite.article.title}"`,
          createdAt: invite.invitedAt.toISOString(),
          type: 'warning',
          href: '/dashboard/team',
        });
      }

      for (const log of accountLogs) {
        notifications.push({
          id: `log-${log.id}`,
          title: 'Account Activity',
          message: log.action.replaceAll('_', ' '),
          createdAt: log.createdAt.toISOString(),
          type: 'info',
        });
      }
    }

    notifications.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    return NextResponse.json({
      success: true,
      data: {
        notifications: notifications.slice(0, 20),
      },
    });
  } catch (error: any) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch notifications',
      },
      { status: 500 }
    );
  }
}
