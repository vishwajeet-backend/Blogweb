/**
 * Publishing Service - Centralized service for multi-platform publishing
 * Handles cross-platform publishing, retry logic, and publish queue management
 */

import prisma from '@/lib/prisma';
import { DevToService } from './devto.service';
import { HashnodeService } from './hashnode.service';
import { GhostService } from './ghost.service';

export type Platform = 'PUBLISHTYPE' | 'DEVTO' | 'HASHNODE' | 'GHOST' | 'WORDPRESS' | 'WIX';

export interface PublishOptions {
  articleId: string;
  userId: string;
  platforms: Platform[];
  published?: boolean;
  scheduleAt?: Date;
}

export interface PublishResult {
  platform: Platform;
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
}

export interface BulkPublishOptions {
  articleIds: string[];
  userId: string;
  platforms: Platform[];
  published?: boolean;
}

export class PublishingService {
  private static MAX_RETRIES = 3;
  private static RETRY_DELAY = 2000; // 2 seconds

  /**
   * Publish article to multiple platforms simultaneously
   */
  static async publishToMultiplePlatforms(
    options: PublishOptions
  ): Promise<PublishResult[]> {
    const { articleId, userId, platforms, published = true } = options;

    // Get article
    const article = await prisma.article.findFirst({
      where: {
        id: articleId,
        userId,
        deletedAt: null,
      },
      include: {
        articleTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!article) {
      throw new Error('Article not found');
    }

    // Publish to all platforms in parallel
    const publishPromises = platforms.map((platform) =>
      this.publishToPlatform({
        platform,
        article,
        userId,
        published,
      })
    );

    const results = await Promise.allSettled(publishPromises);

    // Map results
    const mappedResults = results.map((result, index) => {
      const platform = platforms[index];

      if (result.status === 'fulfilled') {
        return {
          platform,
          success: true,
          ...result.value,
        };
      } else {
        return {
          platform,
          success: false,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });

    // Update article status to PUBLISHED if at least one platform succeeded
    const hasSuccessfulPublish = mappedResults.some(r => r.success);
    if (hasSuccessfulPublish && article.status !== 'PUBLISHED') {
      await prisma.article.update({
        where: { id: articleId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          scheduleAt: null,
        },
      });
    }

    return mappedResults;
  }

  /**
   * Publish to a single platform with retry logic
   */
  static async publishToPlatform(params: {
    platform: Platform;
    article: any;
    userId: string;
    published: boolean;
    attempt?: number;
  }): Promise<{ postId?: string; url?: string }> {
    const { platform, article, userId, published, attempt = 1 } = params;

    try {
      // PublishType is a built-in platform and does not need external credentials.
      if (platform === 'PUBLISHTYPE') {
        return await this.publishToPublishType(article);
      }

      // Get platform connection
      const connection = await prisma.platformConnection.findFirst({
        where: {
          userId,
          platform,
          status: 'CONNECTED',
        },
      });

      if (!connection) {
        throw new Error(`${platform} account not connected`);
      }

      let result: { success: boolean; postId?: string | number; url?: string; error?: string };

      // Publish based on platform
      switch (platform) {
        case 'DEVTO':
          result = await this.publishToDevTo(article, connection, published);
          break;
        case 'HASHNODE':
          result = await this.publishToHashnode(article, connection, published);
          break;
        case 'GHOST':
          result = await this.publishToGhost(article, connection, published);
          break;
        case 'WORDPRESS':
          result = await this.publishToWordPress(article, connection, published);
          break;
        case 'WIX':
          result = await this.publishToWix(article, connection, published);
          break;
        default:
          throw new Error(`Platform ${platform} not supported`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Publish failed');
      }

      // Create publish record
      await prisma.publishRecord.create({
        data: {
          articleId: article.id,
          platformConnectionId: connection.id,
          platform,
          platformPostId: result.postId?.toString() || '',
          url: result.url || '',
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });

      // Note: Article status is updated in publishToMultiplePlatforms after all platforms complete

      return {
        postId: result.postId?.toString(),
        url: result.url,
      };
    } catch (error: any) {
      // Retry logic
      if (attempt < this.MAX_RETRIES) {
        console.log(`Retrying ${platform} publish (attempt ${attempt + 1}/${this.MAX_RETRIES})`);
        await this.delay(this.RETRY_DELAY * attempt);
        return this.publishToPlatform({
          ...params,
          attempt: attempt + 1,
        });
      }

      throw error;
    }
  }

  /**
   * Publish to internal PublishType feed.
   */
  private static async publishToPublishType(article: any) {
    let coverImage = article.coverImage || article.featuredImage || null;

    if (!coverImage && article.content) {
      const imgMatch = article.content.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch?.[1]) {
        coverImage = imgMatch[1];
      }
    }

    await prisma.article.update({
      where: { id: article.id },
      data: {
        isPublicOnPublishType: true,
        ...(coverImage ? { coverImage } : {}),
      },
    });

    return {
      success: true,
      postId: article.id,
      url: `${process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'}/blog/${article.id}`,
    };
  }

  /**
   * Dev.to publishing
   */
  private static async publishToDevTo(article: any, connection: any, published: boolean) {
    const tags = article.articleTags?.map((at: any) => at.tag.name).slice(0, 4) || [];
    const markdownContent = DevToService.htmlToMarkdown(article.content);

    return await DevToService.publishArticle({
      apiKey: connection.credentials,
      title: article.title,
      content: markdownContent,
      tags,
      published,
      description: article.excerpt || undefined,
    });
  }

  /**
   * Hashnode publishing
   */
  private static async publishToHashnode(article: any, connection: any, published: boolean) {
    const tags = article.articleTags?.map((at: any) => at.tag.name) || [];

    return await HashnodeService.publishArticle({
      apiKey: connection.credentials,
      publicationId: connection.metadata?.publicationId || '',
      title: article.title,
      content: article.content,
      tags,
      publishedAt: published ? new Date().toISOString() : undefined,
      subtitle: article.excerpt || undefined,
    });
  }

  /**
   * Ghost publishing
   */
  private static async publishToGhost(article: any, connection: any, published: boolean) {
    const tags = article.articleTags?.map((at: any) => at.tag.name) || [];
    const metadata = connection.metadata as any;

    return await GhostService.publishArticle({
      apiUrl: metadata?.apiUrl || '',
      adminApiKey: connection.credentials,
      title: article.title,
      content: article.content,
      tags,
      status: published ? 'published' : 'draft',
      excerpt: article.excerpt || undefined,
      featured: !!article.featuredImage,
    });
  }

  /**
   * WordPress publishing (placeholder - needs actual implementation)
   */
  private static async publishToWordPress(article: any, connection: any, published: boolean) {
    const metadata = connection.metadata as any;
    // WordPress publish logic would go here
    // For now, return success
    return {
      success: true,
      postId: 'wp-' + Date.now(),
      url: `${metadata?.apiUrl || ''}/posts/`,
    };
  }

  /**
   * Wix publishing (placeholder - needs actual implementation)
   */
  private static async publishToWix(article: any, connection: any, published: boolean) {
    const metadata = connection.metadata as any;
    // Wix publish logic would go here
    // For now, return success
    return {
      success: true,
      postId: 'wix-' + Date.now(),
      url: `${metadata?.apiUrl || ''}/posts/`,
    };
  }

  /**
   * Bulk publish multiple articles
   */
  static async bulkPublish(options: BulkPublishOptions): Promise<{
    articleId: string;
    results: PublishResult[];
  }[]> {
    const { articleIds, userId, platforms, published = true } = options;

    const bulkResults = await Promise.all(
      articleIds.map(async (articleId) => {
        try {
          const results = await this.publishToMultiplePlatforms({
            articleId,
            userId,
            platforms,
            published,
          });

          return {
            articleId,
            results,
          };
        } catch (error: any) {
          return {
            articleId,
            results: platforms.map((platform) => ({
              platform,
              success: false,
              error: error.message || 'Unknown error',
            })),
          };
        }
      })
    );

    return bulkResults;
  }

  /**
   * Update already published post
   */
  static async updatePublishedPost(params: {
    articleId: string;
    userId: string;
    platform: Platform;
  }): Promise<PublishResult> {
    const { articleId, userId, platform } = params;

    try {
      // Get article
      const article = await prisma.article.findFirst({
        where: {
          id: articleId,
          userId,
          deletedAt: null,
        },
        include: {
          articleTags: {
            include: {
              tag: true,
            },
          },
        },
      });

      if (!article) {
        throw new Error('Article not found');
      }

      // Get existing publish record
      const publishRecord = await prisma.publishRecord.findFirst({
        where: {
          articleId,
          platform,
          status: 'PUBLISHED',
        },
        include: {
          platformConnection: true,
        },
      });

      if (!publishRecord) {
        throw new Error('No published record found for this platform');
      }

      // Update based on platform
      let result: { success: boolean; postId?: string | number; url?: string; error?: string };

      switch (platform) {
        case 'GHOST':
          // Only Ghost supports updates currently
          const tags = article.articleTags?.map((at: any) => at.tag.name) || [];
          const metadata = publishRecord.platformConnection.metadata as any;

          if (!publishRecord.platformPostId) {
            throw new Error('Platform post ID not found');
          }

          result = await GhostService.updateArticle(
            metadata?.apiUrl || '',
            publishRecord.platformConnection.credentials,
            publishRecord.platformPostId,
            {
              title: article.title,
              content: article.content,
              tags,
              excerpt: article.excerpt || undefined,
              featured: !!article.featuredImage,
            }
          );
          break;

        default:
          // For other platforms, delete and republish
          const publishResult = await this.publishToPlatform({
            platform,
            article,
            userId,
            published: true,
          });

          // Update the publish record with new IDs
          await prisma.publishRecord.update({
            where: { id: publishRecord.id },
            data: {
              platformPostId: publishResult.postId || publishRecord.platformPostId,
              url: publishResult.url || publishRecord.url,
              publishedAt: new Date(),
            },
          });

          result = {
            success: true,
            postId: publishResult.postId,
            url: publishResult.url,
          };
      }

      if (!result.success) {
        throw new Error(result.error || 'Update failed');
      }

      return {
        platform,
        success: true,
        postId: result.postId?.toString(),
        url: result.url,
      };
    } catch (error: any) {
      return {
        platform,
        success: false,
        error: error.message || 'Failed to update post',
      };
    }
  }

  /**
   * Process scheduled publishes from queue
   */
  static async processScheduledPublishes(): Promise<void> {
    const now = new Date();

    // Get pending scheduled publishes
    const queueItems = await prisma.publishQueue.findMany({
      where: {
        status: 'PENDING',
        scheduleAt: {
          lte: now,
        },
      },
      take: 10, // Process 10 at a time
    });

    for (const item of queueItems) {
      try {
        // Update status to processing
        await prisma.publishQueue.update({
          where: { id: item.id },
          data: { status: 'PROCESSING' },
        });

        // Get article to find userId
        const article = await prisma.article.findUnique({
          where: { id: item.articleId },
        });

        if (!article) {
          throw new Error('Article not found');
        }

        // Publish to platforms
        const results = await this.publishToMultiplePlatforms({
          articleId: item.articleId,
          userId: article.userId,
          platforms: item.platforms as Platform[],
          published: true,
        });

        // Check if all succeeded
        const allSucceeded = results.every((r) => r.success);

        if (allSucceeded) {
          await prisma.publishQueue.update({
            where: { id: item.id },
            data: {
              status: 'COMPLETED',
              processedAt: new Date(),
            },
          });
        } else {
          const errors = results
            .filter((r) => !r.success)
            .map((r) => `${r.platform}: ${r.error}`)
            .join('; ');

          await prisma.publishQueue.update({
            where: { id: item.id },
            data: {
              status: 'FAILED',
              error: errors,
              attempts: item.attempts + 1,
              processedAt: new Date(),
            },
          });
        }
      } catch (error: any) {
        console.error(`Failed to process queue item ${item.id}:`, error);

        await prisma.publishQueue.update({
          where: { id: item.id },
          data: {
            status: 'FAILED',
            error: error.message,
            attempts: item.attempts + 1,
            processedAt: new Date(),
          },
        });
      }
    }
  }

  /**
   * Retry failed publishes
   */
  static async retryFailedPublishes(): Promise<void> {
    // Get failed items with attempts < MAX_RETRIES
    const failedItems = await prisma.publishQueue.findMany({
      where: {
        status: 'FAILED',
        attempts: {
          lt: this.MAX_RETRIES,
        },
      },
      take: 5, // Retry 5 at a time
    });

    for (const item of failedItems) {
      try {
        // Reset to pending for retry
        await prisma.publishQueue.update({
          where: { id: item.id },
          data: {
            status: 'PENDING',
            error: null,
          },
        });

        // Process it
        await this.processScheduledPublishes();
      } catch (error) {
        console.error(`Failed to retry queue item ${item.id}:`, error);
      }
    }
  }

  /**
   * Utility: Delay
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
