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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const article = await findPublishedArticle(id);

    if (!article) {
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }

    const comments = await prisma.articleComment.findMany({
      where: { articleId: article.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        articleId: true,
        userId: true,
        parentId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const userIds = Array.from(new Set(comments.map((c) => c.userId).filter(Boolean))) as string[];
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, avatar: true },
        })
      : [];

    const usersMap = new Map(users.map((u) => [u.id, u]));

    const byParent = new Map<string | null, typeof comments>();
    for (const comment of comments) {
      const key = comment.parentId || null;
      const existing = byParent.get(key) || [];
      existing.push(comment);
      byParent.set(key, existing);
    }

    const toNode = (comment: (typeof comments)[number]): any => {
      const author = comment.userId ? usersMap.get(comment.userId) : null;
      const replies = (byParent.get(comment.id) || []).map(toNode);

      return {
        ...comment,
        user: {
          id: author?.id || null,
          name: author?.name || 'Anonymous',
          avatar: author?.avatar || null,
        },
        replies,
      };
    };

    const topLevel = (byParent.get(null) || []).map(toNode).reverse();

    return NextResponse.json({
      success: true,
      data: {
        comments: topLevel,
        total: comments.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch comments' },
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

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const content = String(body.content || '').trim();
    const parentId = body.parentId ? String(body.parentId) : null;

    if (!content) {
      return NextResponse.json({ success: false, error: 'Comment is required' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ success: false, error: 'Comment is too long' }, { status: 400 });
    }

    if (parentId) {
      const parent = await prisma.articleComment.findFirst({
        where: {
          id: parentId,
          articleId: article.id,
        },
        select: { id: true },
      });

      if (!parent) {
        return NextResponse.json({ success: false, error: 'Parent comment not found' }, { status: 404 });
      }
    }

    const created = await prisma.articleComment.create({
      data: {
        articleId: article.id,
        userId: currentUser.id,
        content,
        parentId,
      },
      select: {
        id: true,
        articleId: true,
        userId: true,
        parentId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

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
        comments: { increment: 1 },
      },
      create: {
        articleId: article.id,
        platform: 'PUBLISHTYPE',
        date: today,
        comments: 1,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        blogId: article.blogId || undefined,
        action: 'BLOG_COMMENT',
        metadata: {
          articleId: article.id,
          commentId: created.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...created,
        user: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar || null,
        },
        replies: [],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add comment' },
      { status: 500 }
    );
  }
}
