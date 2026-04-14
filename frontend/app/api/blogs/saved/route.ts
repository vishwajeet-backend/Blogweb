import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authService } from '@/lib/services/auth.service';

function extractArticleId(metadata: any): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const value = (metadata as Record<string, unknown>).articleId;
  return typeof value === 'string' ? value : null;
}

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

    const logs = await prisma.activityLog.findMany({
      where: {
        userId: currentUser.id,
        action: 'BLOG_SAVE',
      },
      select: {
        createdAt: true,
        metadata: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1000,
    });

    const uniqueArticleIds: string[] = [];
    const seen = new Set<string>();

    for (const log of logs) {
      const articleId = extractArticleId(log.metadata);
      if (!articleId) continue;
      if (seen.has(articleId)) continue;
      seen.add(articleId);
      uniqueArticleIds.push(articleId);
    }

    if (!uniqueArticleIds.length) {
      return NextResponse.json({ success: true, data: { articles: [] } });
    }

    const articles = await prisma.article.findMany({
      where: {
        id: { in: uniqueArticleIds },
        status: 'PUBLISHED',
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        excerpt: true,
        slug: true,
        coverImage: true,
        featuredImage: true,
        publishedAt: true,
        readTime: true,
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    const orderMap = new Map(uniqueArticleIds.map((id, idx) => [id, idx]));
    const ordered = [...articles].sort((a, b) => {
      const ai = orderMap.get(a.id) ?? 99999;
      const bi = orderMap.get(b.id) ?? 99999;
      return ai - bi;
    });

    return NextResponse.json({
      success: true,
      data: {
        articles: ordered,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch saved blogs' },
      { status: 500 }
    );
  }
}
