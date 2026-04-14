import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authService } from '@/lib/services/auth.service';

function extractArticleId(metadata: any): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const value = (metadata as Record<string, unknown>).articleId;
  return typeof value === 'string' ? value : null;
}

function extractString(metadata: any, key: string): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const value = (metadata as Record<string, unknown>)[key];
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

    if (!['ARCHIVE', 'RESTORE', 'WARN', 'APPROVE', 'REMOVE', 'SUSPEND'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use APPROVE, WARN, SUSPEND, ARCHIVE, RESTORE or REMOVE.' },
        { status: 400 }
      );
    }

    const existing = await prisma.article.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true, title: true, blogId: true, userId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;

    let updated = {
      id: existing.id,
      title: existing.title,
      status: existing.status,
      publishedAt: null as Date | null,
    };

    const reviewDecisionMap: Record<string, string> = {
      WARN: 'WARN',
      APPROVE: 'APPROVE',
      ARCHIVE: 'ARCHIVE',
      REMOVE: 'REMOVE',
      SUSPEND: 'SUSPEND',
      RESTORE: 'RESTORE',
    };

    const logReportReview = async (decision: string) => {
      await prisma.activityLog.create({
        data: {
          userId: adminUser.id,
          blogId: existing.blogId || undefined,
          action: 'ADMIN_REVIEW_BLOG_REPORT',
          metadata: {
            articleId: existing.id,
            articleTitle: existing.title,
            decision,
            targetUserId: existing.userId,
            note: note || undefined,
          },
          ipAddress,
          userAgent,
        },
      });
    };

    if (action === 'WARN') {
      await prisma.activityLog.create({
        data: {
          userId: adminUser.id,
          blogId: existing.blogId || undefined,
          action: 'ADMIN_WARN_USER',
          metadata: {
            articleId: existing.id,
            articleTitle: existing.title,
            targetUserId: existing.userId,
            note: note || 'Publisher warning issued by admin',
          },
          ipAddress,
          userAgent,
        },
      });

      await logReportReview(reviewDecisionMap[action]);

      return NextResponse.json({
        success: true,
        data: { article: updated },
        message: 'Publisher warning logged successfully',
      });
    }

    if (action === 'REMOVE') {
      const removed = await prisma.article.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: 'ARCHIVED',
        },
        select: {
          id: true,
          title: true,
          status: true,
          publishedAt: true,
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: adminUser.id,
          blogId: existing.blogId || undefined,
          action: 'ADMIN_REMOVE_ARTICLE',
          metadata: {
            articleId: existing.id,
            articleTitle: existing.title,
            targetUserId: existing.userId,
            previousStatus: existing.status,
            newStatus: removed.status,
            removedAt: new Date().toISOString(),
            note: note || undefined,
          },
          ipAddress,
          userAgent,
        },
      });

      await logReportReview(reviewDecisionMap[action]);

      return NextResponse.json({
        success: true,
        data: { article: removed },
        message: 'Article removed by admin',
      });
    }

    if (action === 'SUSPEND') {
      const suspensionResult = await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            subscriptionStatus: 'CANCELLED',
          },
        });

        await tx.platformConnection.updateMany({
          where: { userId: existing.userId },
          data: { status: 'DISCONNECTED' },
        });

        await tx.article.updateMany({
          where: {
            userId: existing.userId,
            deletedAt: null,
          },
          data: {
            status: 'ARCHIVED',
            isPublicOnPublishType: false,
          },
        });

        return tx.article.findUnique({
          where: { id },
          select: {
            id: true,
            title: true,
            status: true,
            publishedAt: true,
          },
        });
      });

      if (!suspensionResult) {
        return NextResponse.json({ success: false, error: 'Article not found after suspension' }, { status: 404 });
      }

      updated = suspensionResult;

      await prisma.activityLog.create({
        data: {
          userId: adminUser.id,
          blogId: existing.blogId || undefined,
          action: 'ADMIN_SUSPEND_PUBLISHER',
          metadata: {
            articleId: existing.id,
            articleTitle: existing.title,
            targetUserId: existing.userId,
            previousStatus: existing.status,
            newStatus: updated.status,
            note: note || 'Publisher account suspended and content archived by admin',
          },
          ipAddress,
          userAgent,
        },
      });

      await logReportReview(reviewDecisionMap[action]);

      return NextResponse.json({
        success: true,
        data: { article: updated },
        message: 'Publisher suspended and all creator blogs archived',
      });
    }

    const nextStatus = action === 'ARCHIVE' ? 'ARCHIVED' : 'PUBLISHED';
    updated = await prisma.article.update({
      where: { id },
      data: {
        status: nextStatus,
        ...(nextStatus === 'PUBLISHED' ? { publishedAt: existing.status === 'PUBLISHED' ? undefined : new Date() } : {}),
      },
      select: {
        id: true,
        title: true,
        status: true,
        publishedAt: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: adminUser.id,
        blogId: existing.blogId || undefined,
        action:
          action === 'ARCHIVE'
            ? 'ADMIN_ARCHIVE_ARTICLE'
            : action === 'APPROVE'
              ? 'ADMIN_APPROVE_ARTICLE'
              : 'ADMIN_RESTORE_ARTICLE',
        metadata: {
          articleId: existing.id,
          articleTitle: existing.title,
          targetUserId: existing.userId,
          previousStatus: existing.status,
          newStatus: updated.status,
          note: note || undefined,
        },
        ipAddress,
        userAgent,
      },
    });

    await logReportReview(reviewDecisionMap[action]);

    return NextResponse.json({
      success: true,
      data: { article: updated },
      message:
        action === 'ARCHIVE'
          ? 'Article archived by admin'
          : action === 'APPROVE'
            ? 'Article approved and published'
            : 'Article restored to published state',
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to moderate article';
    const status = message.includes('token') ? 401 : message.includes('access required') ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const article = await prisma.article.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        title: true,
        excerpt: true,
        content: true,
        featuredImage: true,
        coverImage: true,
        status: true,
        createdAt: true,
        publishedAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!article) {
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }

    const caseNumber = `#${article.id.replace(/-/g, '').slice(0, 4).toUpperCase()}`;

    const [reportLogs, reviewLogs] = await Promise.all([
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

    const articleReports = reportLogs.filter((log) => extractArticleId(log.metadata) === article.id);
    const latestReport = articleReports[0];
    const latestReview = reviewLogs.find((log) => extractArticleId(log.metadata) === article.id);

    const latestReviewDecision = extractString(latestReview?.metadata, 'decision');
    const isPendingReview = Boolean(latestReport) && (!latestReview || latestReport.createdAt > latestReview.createdAt);

    const reportReason = extractString(latestReport?.metadata, 'reason') || 'Reported Content';
    const reportDetails = extractString(latestReport?.metadata, 'details');
    const reportedBy = extractString(latestReport?.metadata, 'reporterName') || 'community_user';

    return NextResponse.json({
      success: true,
      data: {
        article,
        caseNumber,
        flag: {
          reason: reportDetails ? `${reportReason} · ${reportDetails}` : reportReason,
          reportedBy,
          date: latestReport?.createdAt || article.updatedAt,
          status: isPendingReview ? 'PENDING REVIEW' : latestReviewDecision || article.status,
        },
      },
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to fetch moderation case';
    const status = message.includes('token') ? 401 : message.includes('access required') ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
