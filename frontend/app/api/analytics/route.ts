import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import prisma from '@/lib/prisma';

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

    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');
    const platform = searchParams.get('platform');

    // FETCH BOTH: PlatformAnalytics (external platforms) AND Analytics (PublishType)

    // 1. Fetch PlatformAnalytics (external platforms like WordPress, Dev.to, etc.)
    const whereExternal: any = {
      publishRecord: {
        platformConnection: {
          userId: currentUser.id,
        },
      },
    };

    if (articleId) {
      whereExternal.publishRecord.articleId = articleId;
    }

    if (platform && platform !== 'PUBLISHTYPE') {
      whereExternal.publishRecord.platform = platform;
    }

    const externalAnalytics = await prisma.platformAnalytics.findMany({
      where: whereExternal,
      include: {
        publishRecord: {
          include: {
            article: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
            platformConnection: {
              select: {
                platform: true,
                metadata: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastSyncAt: 'desc',
      },
    });

    // 2. Fetch Analytics (PublishType - our own platform)
    const wherePublishType: any = {
      platform: 'PUBLISHTYPE',
      article: {
        userId: currentUser.id,
      },
    };

    if (articleId) {
      wherePublishType.articleId = articleId;
    }

    if (platform && platform !== 'PUBLISHTYPE') {
      // If filtering by a specific non-PublishType platform, skip PublishType analytics
      // Do nothing - we'll only show external analytics
    }

    const publishTypeAnalytics = (!platform || platform === 'PUBLISHTYPE')
      ? await prisma.analytics.findMany({
          where: wherePublishType,
          include: {
            article: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
        })
      : [];

    // Aggregate PublishType analytics by article (sum across all dates)
    const publishTypeByArticle: Record<string, any> = {};
    publishTypeAnalytics.forEach((a) => {
      if (!publishTypeByArticle[a.articleId]) {
        publishTypeByArticle[a.articleId] = {
          articleId: a.articleId,
          article: a.article,
          totalViews: 0,
          totalUniqueVisitors: 0,
          totalClicks: 0,
          totalShares: 0,
          totalComments: 0,
        };
      }
      publishTypeByArticle[a.articleId].totalViews += a.views;
      publishTypeByArticle[a.articleId].totalUniqueVisitors += a.uniqueVisitors;
      publishTypeByArticle[a.articleId].totalClicks += a.clicks;
      publishTypeByArticle[a.articleId].totalShares += a.shares;
      publishTypeByArticle[a.articleId].totalComments += a.comments;
    });

    // Calculate totals
    const totals = {
      views: 0,
      uniqueVisitors: 0,
      clicks: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      bookmarks: 0,
    };

    // Add external analytics to totals
    externalAnalytics.forEach((a) => {
      totals.views += a.views;
      totals.uniqueVisitors += a.uniqueVisitors;
      totals.likes += a.likes;
      totals.comments += a.comments;
      totals.shares += a.shares;
      totals.bookmarks += a.bookmarks;
    });

    // Add PublishType analytics to totals
    Object.values(publishTypeByArticle).forEach((a: any) => {
      totals.views += a.totalViews;
      totals.uniqueVisitors += a.totalUniqueVisitors;
      totals.clicks += a.totalClicks;
      totals.shares += a.totalShares;
      totals.comments += a.totalComments;
      totals.likes += a.totalClicks;
    });

    // Group by platform
    const byPlatform: Record<string, any> = {};

    // Add external platforms
    externalAnalytics.forEach((a) => {
      const platform = a.publishRecord.platform;
      if (!byPlatform[platform]) {
        byPlatform[platform] = {
          platform,
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          articles: 0,
        };
      }
      byPlatform[platform].totalViews += a.views;
      byPlatform[platform].totalLikes += a.likes;
      byPlatform[platform].totalComments += a.comments;
      byPlatform[platform].articles += 1;
    });

    // Add PublishType platform
    if (Object.keys(publishTypeByArticle).length > 0) {
      byPlatform['PUBLISHTYPE'] = {
        platform: 'PUBLISHTYPE',
        totalViews: Object.values(publishTypeByArticle).reduce((sum: number, a: any) => sum + a.totalViews, 0),
        totalLikes: Object.values(publishTypeByArticle).reduce((sum: number, a: any) => sum + a.totalClicks, 0),
        totalComments: Object.values(publishTypeByArticle).reduce((sum: number, a: any) => sum + a.totalComments, 0),
        articles: Object.keys(publishTypeByArticle).length,
      };
    }

    // Group by article
    const byArticle: Record<string, any> = {};

    // Add external analytics by article
    externalAnalytics.forEach((a) => {
      const articleId = a.publishRecord.articleId;
      if (!byArticle[articleId]) {
        byArticle[articleId] = {
          articleId,
          articleTitle: a.publishRecord.article.title,
          articleSlug: a.publishRecord.article.slug,
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          platforms: [],
        };
      }
      byArticle[articleId].totalViews += a.views;
      byArticle[articleId].totalLikes += a.likes;
      byArticle[articleId].totalComments += a.comments;
      byArticle[articleId].platforms.push({
        platform: a.publishRecord.platform,
        views: a.views,
        likes: a.likes,
        comments: a.comments,
        url: a.publishRecord.url,
      });
    });

    // Add PublishType analytics by article
    Object.values(publishTypeByArticle).forEach((a: any) => {
      if (!byArticle[a.articleId]) {
        byArticle[a.articleId] = {
          articleId: a.articleId,
          articleTitle: a.article.title,
          articleSlug: a.article.slug,
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          platforms: [],
        };
      }
      byArticle[a.articleId].totalViews += a.totalViews;
      byArticle[a.articleId].totalLikes += a.totalClicks;
      byArticle[a.articleId].totalComments += a.totalComments;
      byArticle[a.articleId].platforms.push({
        platform: 'PUBLISHTYPE',
        views: a.totalViews,
        likes: a.totalClicks,
        comments: a.totalComments,
        url: `/blog/${a.article.slug}`,
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        analytics: externalAnalytics, // Keep for backwards compatibility
        totals,
        byPlatform: Object.values(byPlatform),
        byArticle: Object.values(byArticle),
        lastSync: externalAnalytics[0]?.lastSyncAt || null,
      },
    });
  } catch (error: any) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch analytics',
      },
      { status: 500 }
    );
  }
}
