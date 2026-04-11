/**
 * Bulk Publishing API
 * Publishes multiple articles to multiple platforms
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
    const { articleIds, platforms, published = true } = body;

    if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one article ID is required' },
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
    const invalidPlatforms = platforms.filter((p: string) => !validPlatforms.includes(p as Platform));

    if (invalidPlatforms.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid platforms: ${invalidPlatforms.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Bulk publish
    const results = await PublishingService.bulkPublish({
      articleIds,
      userId: currentUser.id,
      platforms,
      published,
    });

    // Calculate statistics
    const stats = {
      totalArticles: results.length,
      totalPlatforms: platforms.length,
      totalPublishes: results.length * platforms.length,
      successfulPublishes: 0,
      failedPublishes: 0,
    };

    results.forEach((articleResult) => {
      articleResult.results.forEach((platformResult) => {
        if (platformResult.success) {
          stats.successfulPublishes++;
        } else {
          stats.failedPublishes++;
        }
      });
    });

    return NextResponse.json({
      success: stats.successfulPublishes > 0,
      message: `Bulk publish completed: ${stats.successfulPublishes}/${stats.totalPublishes} successful`,
      data: {
        results,
        stats,
      },
    });
  } catch (error: any) {
    console.error('Bulk publish error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to bulk publish articles',
      },
      { status: 500 }
    );
  }
}
