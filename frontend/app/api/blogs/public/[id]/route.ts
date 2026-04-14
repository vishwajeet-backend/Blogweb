/**
 * Public Blog Article API
 * Get a single published blog by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await params;

    // Fetch single article by id or slug for public reading
    const article = await prisma.article.findFirst({
      where: {
        OR: [{ id: articleId }, { slug: articleId }],
        status: 'PUBLISHED',
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        excerpt: true,
        content: true,
        slug: true,
        coverImage: true,
        featuredImage: true,
        publishedAt: true,
        readTime: true,
        wordCount: true,
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!article) {
      return NextResponse.json(
        {
          success: false,
          error: 'Article not found',
        },
        { status: 404 }
      );
    }

    const [platformAggRows, publishTypeAgg, commentThreadsCount] = await Promise.all([
      prisma.platformAnalytics.findMany({
        where: { publishRecord: { articleId: article.id } },
        select: { likes: true, comments: true, shares: true, views: true },
      }),
      prisma.analytics.aggregate({
        where: { articleId: article.id, platform: 'PUBLISHTYPE' },
        _sum: { clicks: true, comments: true, shares: true, views: true },
      }),
      prisma.articleComment.count({
        where: { articleId: article.id },
      }),
    ]);

    const platformTotals = platformAggRows.reduce(
      (acc, row) => {
        acc.likes += row.likes || 0;
        acc.comments += row.comments || 0;
        acc.shares += row.shares || 0;
        acc.views += row.views || 0;
        return acc;
      },
      { likes: 0, comments: 0, shares: 0, views: 0 }
    );

    const engagement = {
      likes: platformTotals.likes + Number(publishTypeAgg._sum.clicks || 0),
      comments: platformTotals.comments + Number(publishTypeAgg._sum.comments || 0) + Number(commentThreadsCount || 0),
      shares: platformTotals.shares + Number(publishTypeAgg._sum.shares || 0),
      views: Math.max(platformTotals.views + Number(publishTypeAgg._sum.views || 0), Number(article.views || 0)),
    };

    // Update Analytics asynchronously
    const recordView = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Increment total views on Article
        await prisma.article.update({
          where: { id: article.id },
          data: { views: { increment: 1 } },
        });

        // 2. Track detailed analytics for PublishType platform
        await prisma.analytics.upsert({
          where: {
            articleId_platform_date: {
              articleId: article.id,
              platform: 'PUBLISHTYPE',
              date: today,
            },
          },
          update: {
            views: { increment: 1 },
          },
          create: {
            articleId: article.id,
            platform: 'PUBLISHTYPE',
            date: today,
            views: 1,
            uniqueVisitors: 1,
          },
        });
      } catch (err) {
        console.error('Failed to record analytics:', err);
      }
    };

    recordView();

    return NextResponse.json({
      success: true,
      data: {
        ...article,
        engagement,
      },
    });
  } catch (error: any) {
    console.error('Public blog article API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch article',
      },
      { status: 500 }
    );
  }
}
