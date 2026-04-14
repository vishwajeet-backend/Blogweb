/**
 * Public Blogs API
 * Get all published blogs for the public home page
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: 'PUBLISHED',
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch published articles
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
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
          views: true,
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.article.count({ where }),
    ]);

    const articleIds = articles.map((article) => article.id);

    let platformAgg: Array<{ articleId: string; _sum: { likes: number | null; comments: number | null; shares: number | null; views: number | null } }> = [];
    let publishTypeAgg: Array<{ articleId: string; _sum: { comments: number | null; shares: number | null; views: number | null; clicks: number | null } }> = [];
    let threadCommentAgg: Array<{ articleId: string; _count: { _all: number } }> = [];

    if (articleIds.length > 0) {
      [platformAgg, publishTypeAgg, threadCommentAgg] = await Promise.all([
        prisma.platformAnalytics.groupBy({
          by: ['publishRecordId'],
          where: {
            publishRecord: {
              articleId: { in: articleIds },
            },
          },
          _sum: {
            likes: true,
            comments: true,
            shares: true,
            views: true,
          },
        }).then(async (rows) => {
          const recordIds = rows.map((row) => row.publishRecordId);
          if (recordIds.length === 0) return [];

          const records = await prisma.publishRecord.findMany({
            where: { id: { in: recordIds } },
            select: { id: true, articleId: true },
          });

          const recordToArticle = new Map(records.map((record) => [record.id, record.articleId]));

          return rows.map((row) => ({
            articleId: recordToArticle.get(row.publishRecordId) || '',
            _sum: row._sum,
          })).filter((row) => Boolean(row.articleId));
        }),
        prisma.analytics.groupBy({
          by: ['articleId'],
          where: {
            articleId: { in: articleIds },
            platform: 'PUBLISHTYPE',
          },
          _sum: {
            views: true,
            comments: true,
            shares: true,
            clicks: true,
          },
        }),
        prisma.articleComment.groupBy({
          by: ['articleId'],
          where: {
            articleId: { in: articleIds },
          },
          _count: {
            _all: true,
          },
        }),
      ]);
    }

    const engagementMap = new Map<string, { likes: number; comments: number; shares: number; views: number }>();

    for (const row of platformAgg) {
      const current = engagementMap.get(row.articleId) || { likes: 0, comments: 0, shares: 0, views: 0 };
      engagementMap.set(row.articleId, {
        likes: current.likes + Number(row._sum.likes || 0),
        comments: current.comments + Number(row._sum.comments || 0),
        shares: current.shares + Number(row._sum.shares || 0),
        views: current.views + Number(row._sum.views || 0),
      });
    }

    for (const row of publishTypeAgg) {
      const current = engagementMap.get(row.articleId) || { likes: 0, comments: 0, shares: 0, views: 0 };
      engagementMap.set(row.articleId, {
        likes: current.likes + Number(row._sum.clicks || 0),
        comments: current.comments + Number(row._sum.comments || 0),
        shares: current.shares + Number(row._sum.shares || 0),
        views: current.views + Number(row._sum.views || 0),
      });
    }

    const threadCommentsMap = new Map(threadCommentAgg.map((row) => [row.articleId, row._count._all]));

    const enrichedArticles = articles.map((article) => {
      const engagement = engagementMap.get(article.id) || { likes: 0, comments: 0, shares: 0, views: 0 };
      const threadComments = Number(threadCommentsMap.get(article.id) || 0);
      return {
        ...article,
        engagement: {
          likes: engagement.likes,
          comments: engagement.comments + threadComments,
          shares: engagement.shares,
          views: Math.max(engagement.views, Number(article.views || 0)),
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        articles: enrichedArticles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Public blogs API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch blogs',
      },
      { status: 500 }
    );
  }
}
