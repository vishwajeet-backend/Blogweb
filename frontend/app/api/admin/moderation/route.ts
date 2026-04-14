import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authService } from '@/lib/services/auth.service';

function extractArticleId(metadata: any): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const value = (metadata as Record<string, unknown>).articleId;
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

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const status = (searchParams.get('status') || 'ALL').toUpperCase();
    const search = (searchParams.get('search') || '').trim();
    const skip = (Math.max(page, 1) - 1) * Math.max(limit, 1);

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

    const latestReviewByArticle = new Map<string, Date>();
    for (const log of reviewLogs) {
      const articleId = extractArticleId(log.metadata);
      if (!articleId) continue;
      const known = latestReviewByArticle.get(articleId);
      if (!known || log.createdAt > known) latestReviewByArticle.set(articleId, log.createdAt);
    }

    const pendingReportedIds = new Set<string>();
    for (const log of reportLogs) {
      const articleId = extractArticleId(log.metadata);
      if (!articleId) continue;
      const reviewDate = latestReviewByArticle.get(articleId);
      if (!reviewDate || log.createdAt > reviewDate) {
        pendingReportedIds.add(articleId);
      }
    }

    const where: any = { deletedAt: null };

    if (status === 'PENDING') {
      const reportedIds = Array.from(pendingReportedIds);
      where.OR = [
        { status: { in: ['DRAFT', 'SCHEDULED'] } },
        ...(reportedIds.length ? [{ id: { in: reportedIds } }] : []),
      ];
    } else if (status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      const searchClause = {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      };

      if (where.OR) {
        where.AND = [searchClause];
      } else {
        Object.assign(where, searchClause);
      }
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          excerpt: true,
          featuredImage: true,
          coverImage: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          views: true,
          wordCount: true,
          isPublicOnPublishType: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          publishRecords: {
            where: { status: 'PUBLISHED' },
            select: {
              platform: true,
              url: true,
              publishedAt: true,
            },
            orderBy: { updatedAt: 'desc' },
          },
        },
      }),
      prisma.article.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        articles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to fetch moderation data';
    const status = message.includes('token') ? 401 : message.includes('access required') ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
