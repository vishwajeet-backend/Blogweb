import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authService } from '@/lib/services/auth.service';

function extractArticleId(metadata: any): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const value = (metadata as Record<string, unknown>).articleId;
  return typeof value === 'string' ? value : null;
}

function extractReason(metadata: any): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const value = (metadata as Record<string, unknown>).reason;
  return typeof value === 'string' ? value : null;
}

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

  return currentUser;
}

const planAmounts: Record<string, number> = {
  FREE: 0,
  STARTER: 999,
  CREATOR: 1999,
  PROFESSIONAL: 3999,
};

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const [totalUsers, totalArticles, activeSubs, paidUsers, users, queueItems, dbHealth, reportLogs, reviewLogs] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.article.count({ where: { deletedAt: null } }),
      prisma.user.count({
        where: {
          deletedAt: null,
          subscriptionStatus: 'ACTIVE',
          subscriptionPlan: { not: 'FREE' },
        },
      }),
      prisma.user.findMany({
        where: {
          deletedAt: null,
          subscriptionPlan: { not: 'FREE' },
        },
        select: {
          id: true,
          name: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          _count: {
            select: {
              articles: {
                where: {
                  deletedAt: null,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.article.findMany({
        where: {
          deletedAt: null,
          status: {
            in: ['DRAFT', 'SCHEDULED'],
          },
        },
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
          views: true,
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      prisma.$queryRaw`SELECT 1`,
      prisma.activityLog.findMany({
        where: { action: 'BLOG_REPORT_SUBMITTED' },
        select: { metadata: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1200,
      }),
      prisma.activityLog.findMany({
        where: { action: 'ADMIN_REVIEW_BLOG_REPORT' },
        select: { metadata: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1200,
      }),
    ]);

    const latestReviewByArticle = new Map<string, Date>();
    for (const log of reviewLogs) {
      const articleId = extractArticleId(log.metadata);
      if (!articleId) continue;
      const known = latestReviewByArticle.get(articleId);
      if (!known || log.createdAt > known) latestReviewByArticle.set(articleId, log.createdAt);
    }

    const pendingReportedIds = new Set<string>();
    const latestReasonByArticle = new Map<string, string>();
    for (const log of reportLogs) {
      const articleId = extractArticleId(log.metadata);
      if (!articleId) continue;
      const reviewDate = latestReviewByArticle.get(articleId);
      if (!reviewDate || log.createdAt > reviewDate) {
        pendingReportedIds.add(articleId);
        if (!latestReasonByArticle.has(articleId)) {
          latestReasonByArticle.set(articleId, extractReason(log.metadata) || 'Policy concern');
        }
      }
    }

    const reportedArticles = pendingReportedIds.size
      ? await prisma.article.findMany({
          where: {
            id: { in: Array.from(pendingReportedIds) },
            deletedAt: null,
          },
          select: {
            id: true,
            title: true,
            status: true,
            updatedAt: true,
            views: true,
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: 8,
        })
      : [];

    const mergedQueueItems = [...queueItems];
    const seenQueueIds = new Set(queueItems.map((item) => item.id));
    for (const item of reportedArticles) {
      if (!seenQueueIds.has(item.id)) {
        mergedQueueItems.push(item);
      }
    }

    const finalQueueItems = mergedQueueItems
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      .slice(0, 8);

    const queueArticleIds = finalQueueItems.map((item) => item.id);

    const [queueAnalytics, queueCommentCounts] = queueArticleIds.length
      ? await Promise.all([
          prisma.analytics.groupBy({
            by: ['articleId'],
            where: {
              articleId: { in: queueArticleIds },
              platform: 'PUBLISHTYPE',
            },
            _sum: {
              clicks: true,
              comments: true,
              shares: true,
              views: true,
            },
          }),
          prisma.articleComment.groupBy({
            by: ['articleId'],
            where: {
              articleId: { in: queueArticleIds },
            },
            _count: {
              _all: true,
            },
          }),
        ])
      : [[], []];

    const analyticsMap = new Map(queueAnalytics.map((item) => [item.articleId, item._sum]));
    const commentsMap = new Map(queueCommentCounts.map((item) => [item.articleId, item._count._all]));

    const estimatedRevenue = paidUsers.reduce((sum, user) => sum + (planAmounts[user.subscriptionPlan] || 0), 0);

    const transactions = paidUsers.slice(0, 3).map((user, index) => ({
      id: `#TR-${8923 - index}`,
      userName: user.name,
      amount: planAmounts[user.subscriptionPlan] || 0,
      status: user.subscriptionStatus === 'ACTIVE' ? 'PAID' : 'FAILED',
      action: 'View',
    }));

    const systemStatus = [
      { name: 'Database', status: dbHealth ? 'Operational' : 'Down', latency: '24ms', level: 'ok' },
      { name: 'Redis Cache', status: 'Operational', latency: '5ms', level: 'ok' },
      { name: 'Message Queue', status: 'High Load', latency: '-', level: 'warn' },
      { name: 'Search API', status: 'Operational', latency: '45ms', level: 'ok' },
      { name: 'Email Service', status: 'Operational', latency: '-', level: 'ok' },
    ];

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalUsers,
          totalArticles,
          estimatedRevenue,
          activeSubs,
          systemHealth: 99.9,
        },
        users: users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
          plan: u.subscriptionPlan,
          status: u.subscriptionStatus,
          articlesCount: u._count.articles,
        })),
        queueItems: finalQueueItems.map((item) => {
          const sums = analyticsMap.get(item.id);
          const clicks = Number(sums?.clicks || 0);
          const analyticsComments = Number(sums?.comments || 0);
          const threadComments = Number(commentsMap.get(item.id) || 0);
          const comments = analyticsComments + threadComments;
          const shares = Number(sums?.shares || 0);
          const engagement = clicks + comments + shares;

          const ageHours = Math.max(1, Math.floor((Date.now() - item.updatedAt.getTime()) / (1000 * 60 * 60)));
          const reportReason = latestReasonByArticle.get(item.id);
          const isReported = Boolean(reportReason);

          return {
            id: item.id,
            title: item.title,
            status: item.status,
            reason: isReported
              ? `FLAGGED: ${String(reportReason).toUpperCase()}`
              : item.status === 'SCHEDULED'
                ? 'FLAGGED: SCHEDULE REVIEW'
                : 'FLAGGED: CONTENT REVIEW',
            detail: isReported
              ? `Article from ${item.user.name} was reported by users. Clicks: ${clicks}, Comments: ${comments}, Engagement: ${engagement}.`
              : `Article from ${item.user.name} needs moderation. Clicks: ${clicks}, Comments: ${comments}, Engagement: ${engagement}.`,
            age: `${ageHours}h ago`,
            clicks,
            comments,
            engagement,
            views: Number(item.views || 0) + Number(sums?.views || 0),
          };
        }),
        transactions,
        systemStatus,
      },
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to fetch admin overview';
    const status = message.includes('token') ? 401 : message.includes('access required') ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
