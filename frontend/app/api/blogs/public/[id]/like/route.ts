import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authService } from '@/lib/services/auth.service';

function extractArticleId(metadata: any): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const value = (metadata as Record<string, unknown>).articleId;
  return typeof value === 'string' ? value : null;
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

    const article = await prisma.article.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        status: 'PUBLISHED',
        deletedAt: null,
      },
      select: {
        id: true,
        blogId: true,
      },
    });

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    const existingLikes = await prisma.activityLog.findMany({
      where: {
        userId: currentUser.id,
        action: 'BLOG_LIKE',
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

    const alreadyLiked = existingLikes.some((log) => extractArticleId(log.metadata) === article.id);

    if (!alreadyLiked) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.analytics.upsert({
        where: {
          articleId_platform_date: {
            articleId: article.id,
            platform: 'PUBLISHTYPE',
            date: today,
          },
        },
        update: {
          clicks: { increment: 1 },
        },
        create: {
          articleId: article.id,
          platform: 'PUBLISHTYPE',
          date: today,
          clicks: 1,
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: currentUser.id,
          blogId: article.blogId || undefined,
          action: 'BLOG_LIKE',
          metadata: {
            articleId: article.id,
          },
        },
      });
    }

    const likesTotal = await prisma.analytics.aggregate({
      where: {
        articleId: article.id,
        platform: 'PUBLISHTYPE',
      },
      _sum: { clicks: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        likes: Number(likesTotal._sum.clicks || 0),
        liked: true,
        alreadyLiked,
      },
      message: alreadyLiked ? 'Blog already liked' : 'Blog liked successfully',
    });
  } catch (error: any) {
    console.error('Blog like error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to like blog',
      },
      { status: 500 }
    );
  }
}
