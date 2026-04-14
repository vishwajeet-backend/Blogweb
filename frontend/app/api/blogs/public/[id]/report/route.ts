import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authService } from '@/lib/services/auth.service';

function extractArticleId(metadata: any): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const value = (metadata as Record<string, unknown>).articleId;
  return typeof value === 'string' ? value : null;
}

async function findPublishedArticle(idOrSlug: string) {
  return prisma.article.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      status: 'PUBLISHED',
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      blogId: true,
      userId: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const article = await findPublishedArticle(id);

    if (!article) {
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }

    if (article.userId === currentUser.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot report your own blog' },
        { status: 400 }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const reason = String(body.reason || '').trim();
    const details = String(body.details || '').trim();

    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'Report reason is required' },
        { status: 400 }
      );
    }

    const existingReports = await prisma.activityLog.findMany({
      where: {
        userId: currentUser.id,
        action: 'BLOG_REPORT_SUBMITTED',
      },
      select: {
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 400,
    });

    const hasRecentDuplicate = existingReports.some((log) => {
      const sameArticle = extractArticleId(log.metadata) === article.id;
      const ageHours = (Date.now() - log.createdAt.getTime()) / (1000 * 60 * 60);
      return sameArticle && ageHours < 24;
    });

    if (hasRecentDuplicate) {
      return NextResponse.json(
        { success: false, error: 'You already reported this blog recently' },
        { status: 409 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;

    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        blogId: article.blogId || undefined,
        action: 'BLOG_REPORT_SUBMITTED',
        metadata: {
          articleId: article.id,
          articleTitle: article.title,
          reason,
          details: details || undefined,
          reporterId: currentUser.id,
          reporterName: currentUser.name,
          reporterEmail: currentUser.email,
          publisherId: article.user.id,
          publisherName: article.user.name,
          publisherEmail: article.user.email,
          status: 'PENDING',
        },
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Report submitted. Admin and publisher have been notified.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit report' },
      { status: 500 }
    );
  }
}
