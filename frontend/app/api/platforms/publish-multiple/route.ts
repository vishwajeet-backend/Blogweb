/**
 * Cross-platform Simultaneous Publishing API
 * Publishes an article to multiple platforms at once
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { PublishingService, Platform } from '@/lib/services/publishing.service';

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
    const { articleId, platforms, published = true, scheduleAt } = body;

    if (!articleId) {
      return NextResponse.json(
        { success: false, error: 'Article ID is required' },
        { status: 400 }
      );
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one platform is required' },
        { status: 400 }
      );
    }

    // Validate platforms
    const validPlatforms: Platform[] = ['PUBLISHTYPE', 'DEVTO', 'HASHNODE', 'GHOST', 'WORDPRESS', 'WIX'];
    const invalidPlatforms = platforms.filter((p) => !validPlatforms.includes(p));

    if (invalidPlatforms.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid platforms: ${invalidPlatforms.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // If scheduled, add to queue
    if (scheduleAt) {
      const prisma = (await import('@/lib/prisma')).default;

      await prisma.publishQueue.create({
        data: {
          articleId,
          platforms,
          scheduleAt: new Date(scheduleAt),
          status: 'PENDING',
        },
      });

      return NextResponse.json({
        success: true,
        message: `Article scheduled for publishing to ${platforms.length} platform(s) at ${new Date(scheduleAt).toLocaleString()}`,
        data: {
          platforms,
          scheduleAt,
        },
      });
    }

    // Publish immediately to all platforms
    const results = await PublishingService.publishToMultiplePlatforms({
      articleId,
      userId: currentUser.id,
      platforms,
      published,
    });

    // Count successes and failures
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return NextResponse.json({
      success: successful.length > 0,
      message: `Published to ${successful.length}/${platforms.length} platform(s)`,
      data: {
        results,
        summary: {
          total: results.length,
          successful: successful.length,
          failed: failed.length,
        },
      },
    });
  } catch (error: any) {
    console.error('Multi-platform publish error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to publish to platforms',
      },
      { status: 500 }
    );
  }
}
