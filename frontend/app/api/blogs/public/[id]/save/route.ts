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
      blogId: true,
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const article = await findPublishedArticle(id);

    if (!article) {
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: true, data: { saved: false } });
    }

    const accessToken = authHeader.substring(7);
    const currentUser = await authService.getCurrentUser(accessToken);

    const saveLogs = await prisma.activityLog.findMany({
      where: {
        userId: currentUser.id,
        action: 'BLOG_SAVE',
      },
      select: {
        metadata: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 500,
    });

    const saved = saveLogs.some((log) => extractArticleId(log.metadata) === article.id);

    return NextResponse.json({ success: true, data: { saved } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch saved status' },
      { status: 500 }
    );
  }
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

    const saveLogs = await prisma.activityLog.findMany({
      where: {
        userId: currentUser.id,
        action: 'BLOG_SAVE',
      },
      select: {
        id: true,
        metadata: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 500,
    });

    const existingSave = saveLogs.find((log) => extractArticleId(log.metadata) === article.id);

    if (existingSave) {
      await prisma.activityLog.delete({ where: { id: existingSave.id } });
      return NextResponse.json({
        success: true,
        data: {
          saved: false,
        },
        message: 'Blog removed from saved items',
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        blogId: article.blogId || undefined,
        action: 'BLOG_SAVE',
        metadata: {
          articleId: article.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        saved: true,
      },
      message: 'Blog saved',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save blog' },
      { status: 500 }
    );
  }
}
