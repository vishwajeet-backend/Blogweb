/**
 * Cloudinary Service
 * Handles image uploads, transformations, and management with Cloudinary
 */

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  success: boolean;
  data?: {
    url: string;
    secureUrl: string;
    publicId: string;
    format: string;
    width: number;
    height: number;
    bytes: number;
    thumbnailUrl?: string;
  };
  error?: string;
}

export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'limit';
  quality?: number | 'auto';
  format?: 'jpg' | 'png' | 'webp' | 'auto';
  gravity?: 'auto' | 'center' | 'face';
}

export class CloudinaryService {
  private static sanitizePublicId(filename: string): string {
    const withoutExtension = filename.replace(/\.[^/.]+$/, '');
    const normalized = withoutExtension
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '');

    const sanitized = normalized
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-_]+|[-_]+$/g, '')
      .toLowerCase()
      .slice(0, 100);

    return sanitized || `image-${Date.now()}`;
  }

  /**
   * Upload image from file buffer
   */
  static async uploadImage(
    buffer: Buffer,
    options?: {
      folder?: string;
      filename?: string;
      transformation?: CloudinaryTransformOptions;
    }
  ): Promise<CloudinaryUploadResult> {
    try {
      // Convert buffer to base64
      const base64Image = `data:image/jpeg;base64,${buffer.toString('base64')}`;

      const uploadOptions: any = {
        folder: options?.folder || 'blogweb',
        resource_type: 'image',
        allowed_formats: ['jpg', 'png', 'gif', 'webp'],
      };

      if (options?.filename) {
        uploadOptions.public_id = this.sanitizePublicId(options.filename);
        uploadOptions.use_filename = false;
        uploadOptions.unique_filename = true;
      }

      // Add transformations if provided
      if (options?.transformation) {
        uploadOptions.transformation = this.buildTransformation(options.transformation);
      }

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(base64Image, uploadOptions);

      // Generate thumbnail URL
      const thumbnailUrl = cloudinary.url(result.public_id, {
        width: 300,
        height: 300,
        crop: 'thumb',
        quality: 'auto',
        format: 'auto',
      });

      return {
        success: true,
        data: {
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          thumbnailUrl,
        },
      };
    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload image to Cloudinary',
      };
    }
  }

  /**
   * Upload image from URL
   */
  static async uploadFromUrl(
    imageUrl: string,
    options?: {
      folder?: string;
      filename?: string;
      transformation?: CloudinaryTransformOptions;
    }
  ): Promise<CloudinaryUploadResult> {
    try {
      const uploadOptions: any = {
        folder: options?.folder || 'blogweb',
        resource_type: 'image',
      };

      if (options?.filename) {
        uploadOptions.public_id = this.sanitizePublicId(options.filename);
        uploadOptions.use_filename = false;
        uploadOptions.unique_filename = true;
      }

      if (options?.transformation) {
        uploadOptions.transformation = this.buildTransformation(options.transformation);
      }

      const result = await cloudinary.uploader.upload(imageUrl, uploadOptions);

      const thumbnailUrl = cloudinary.url(result.public_id, {
        width: 300,
        height: 300,
        crop: 'thumb',
        quality: 'auto',
        format: 'auto',
      });

      return {
        success: true,
        data: {
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          thumbnailUrl,
        },
      };
    } catch (error: any) {
      console.error('Cloudinary upload from URL error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload image from URL',
      };
    }
  }

  /**
   * Delete image from Cloudinary
   */
  static async deleteImage(publicId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await cloudinary.uploader.destroy(publicId);
      return { success: true };
    } catch (error: any) {
      console.error('Cloudinary delete error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete image',
      };
    }
  }

  /**
   * Get optimized image URL with transformations
   */
  static getOptimizedUrl(publicId: string, options?: CloudinaryTransformOptions): string {
    return cloudinary.url(publicId, this.buildTransformation(options));
  }

  /**
   * Generate multiple size variants
   */
  static getImageVariants(publicId: string): {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    original: string;
  } {
    return {
      thumbnail: cloudinary.url(publicId, {
        width: 150,
        height: 150,
        crop: 'thumb',
        quality: 'auto',
        format: 'auto',
      }),
      small: cloudinary.url(publicId, {
        width: 400,
        crop: 'scale',
        quality: 'auto',
        format: 'auto',
      }),
      medium: cloudinary.url(publicId, {
        width: 800,
        crop: 'scale',
        quality: 'auto',
        format: 'auto',
      }),
      large: cloudinary.url(publicId, {
        width: 1200,
        crop: 'scale',
        quality: 'auto',
        format: 'auto',
      }),
      original: cloudinary.url(publicId, {
        quality: 'auto',
        format: 'auto',
      }),
    };
  }

  /**
   * Compress image
   */
  static async compressImage(
    publicId: string,
    quality: number = 80
  ): Promise<CloudinaryUploadResult> {
    try {
      // Fetch original image
      const originalUrl = cloudinary.url(publicId);

      // Re-upload with compression
      const result = await cloudinary.uploader.upload(originalUrl, {
        public_id: publicId,
        overwrite: true,
        quality: quality,
        format: 'auto',
      });

      const thumbnailUrl = cloudinary.url(result.public_id, {
        width: 300,
        height: 300,
        crop: 'thumb',
        quality: 'auto',
        format: 'auto',
      });

      return {
        success: true,
        data: {
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          thumbnailUrl,
        },
      };
    } catch (error: any) {
      console.error('Cloudinary compress error:', error);
      return {
        success: false,
        error: error.message || 'Failed to compress image',
      };
    }
  }

  /**
   * Resize image
   */
  static async resizeImage(
    publicId: string,
    width: number,
    height?: number
  ): Promise<CloudinaryUploadResult> {
    try {
      const originalUrl = cloudinary.url(publicId);

      const result = await cloudinary.uploader.upload(originalUrl, {
        public_id: `${publicId}_resized`,
        transformation: {
          width,
          height,
          crop: 'scale',
          quality: 'auto',
          format: 'auto',
        },
      });

      const thumbnailUrl = cloudinary.url(result.public_id, {
        width: 300,
        height: 300,
        crop: 'thumb',
        quality: 'auto',
        format: 'auto',
      });

      return {
        success: true,
        data: {
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          thumbnailUrl,
        },
      };
    } catch (error: any) {
      console.error('Cloudinary resize error:', error);
      return {
        success: false,
        error: error.message || 'Failed to resize image',
      };
    }
  }

  /**
   * Build transformation object for Cloudinary
   */
  private static buildTransformation(options?: CloudinaryTransformOptions): any {
    if (!options) {
      return {
        quality: 'auto',
        format: 'auto',
      };
    }

    const transformation: any = {};

    if (options.width) transformation.width = options.width;
    if (options.height) transformation.height = options.height;
    if (options.crop) transformation.crop = options.crop;
    if (options.quality) transformation.quality = options.quality;
    if (options.format) transformation.format = options.format;
    if (options.gravity) transformation.gravity = options.gravity;

    // Default to auto quality and format if not specified
    if (!transformation.quality) transformation.quality = 'auto';
    if (!transformation.format) transformation.format = 'auto';

    return transformation;
  }

  /**
   * Batch delete images
   */
  static async batchDelete(publicIds: string[]): Promise<{
    success: boolean;
    deleted: number;
    failed: number;
    errors?: string[];
  }> {
    try {
      const results = await Promise.allSettled(
        publicIds.map((id) => cloudinary.uploader.destroy(id))
      );

      const deleted = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      const errors = results
        .filter((r) => r.status === 'rejected')
        .map((r) => (r as PromiseRejectedResult).reason?.message);

      return {
        success: deleted > 0,
        deleted,
        failed,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        deleted: 0,
        failed: publicIds.length,
        errors: [error.message],
      };
    }
  }

  /**
   * Get image metadata
   */
  static async getImageInfo(publicId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const result = await cloudinary.api.resource(publicId);
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get image info',
      };
    }
  }
}
