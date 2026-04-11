import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import prisma from '@/lib/prisma';



// GET /api/articles - List user's articles
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
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const folderId = searchParams.get('folderId');

    const where: any = {
      deletedAt: null,
      OR: [
        { userId: currentUser.id },
        {
          collaborators: {
            some: {
              userId: currentUser.id,
              status: { in: ['ACCEPTED', 'PENDING'] }
            }
          }
        }
      ]
    };

    if (status) {
      where.status = status;
    }

    if (folderId) {
      where.folderId = folderId;
    }

    // Check if publishRecords are needed (only for non-dashboard views)
    const includePublishRecords = !searchParams.get('limit') || parseInt(searchParams.get('limit') || '10') > 10;

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          status: true,
          wordCount: true,
          readingTime: true,
          views: true,
          publishedAt: true,
          scheduleAt: true,
          createdAt: true,
          updatedAt: true,
          ...(includePublishRecords && {
            publishRecords: {
              select: {
                platform: true,
                url: true,
              },
              where: {
                status: 'PUBLISHED',
              },
            },
          }),
        },
      }),
      prisma.article.count({ where }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          articles,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        },
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

// POST /api/articles - Create new article
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      folderId,
      toneOfVoice,
      contentFramework,
      featuredImage,
      metaTitle,
      metaDescription,
      focusKeyword,
      scheduleAt,
    } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Calculate word count and reading time
    const normalizedContent = typeof content === 'string' ? content : '';
    const wordCount = normalizedContent ? normalizedContent.split(/\s+/).length : 0;
    const readingTime = Math.ceil(wordCount / 200); // Assuming 200 words per minute

    const article = await prisma.article.create({
      data: {
        userId: currentUser.id,
        title,
        slug: `${slug}-${Date.now()}`,
        content: normalizedContent,
        excerpt,
        folderId,
        featuredImage,
        metaTitle,
        metaDescription,
        focusKeyword,
        ...(scheduleAt ? { scheduleAt: new Date(scheduleAt) } : {}),
        wordCount,
        readingTime,
        toneOfVoice,
        contentFramework,
        status: scheduleAt ? 'SCHEDULED' : 'DRAFT',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { article },
        message: 'Article created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create article' },
      { status: 500 }
    );
  }
}
