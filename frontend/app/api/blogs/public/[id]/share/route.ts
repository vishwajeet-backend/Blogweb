import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authService } from '@/lib/services/auth.service';

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const article = await findPublishedArticle(id);

    if (!article) {
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }

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
        shares: { increment: 1 },
      },
      create: {
        articleId: article.id,
        platform: 'PUBLISHTYPE',
        date: today,
        shares: 1,
      },
    });

    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);
      const currentUser = await authService.getCurrentUser(accessToken);

      await prisma.activityLog.create({
        data: {
          userId: currentUser.id,
          blogId: article.blogId || undefined,
          action: 'BLOG_SHARE',
          metadata: {
            articleId: article.id,
          },
        },
      });
    }

    const totalShares = await prisma.analytics.aggregate({
      where: {
        articleId: article.id,
        platform: 'PUBLISHTYPE',
      },
      _sum: {
        shares: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        shares: Number(totalShares._sum.shares || 0),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to track share' },
      { status: 500 }
    );
  }
}
