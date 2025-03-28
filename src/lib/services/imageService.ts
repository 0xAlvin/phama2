import { v2 as cloudinary } from 'cloudinary';
import { configureCloudinary } from '@/config/cloudinary';
import { 
  CloudinaryUploadResponse, 
  CloudinaryImageInfo,
  ImageTransformOptions 
} from '@/types/cloudinary';

class ImageServiceError extends Error {
  code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'ImageServiceError';
    this.code = code;
  }
}

class ImageService {
  constructor() {
    // Configure Cloudinary when service is instantiated
    configureCloudinary();
  }

  /**
   * Upload an image to Cloudinary
   * 
   * @param file File to upload
   * @param folder Optional folder to upload to
   * @param tags Optional tags for the image
   * @returns Promise with upload result
   */
  async uploadImage(
    file: Buffer | string, 
    folder = 'phamapp', 
    tags: string[] = []
  ): Promise<CloudinaryImageInfo> {
    try {
      // If file is a base64 string, upload directly
      const uploadOptions: any = {
        folder,
        tags,
      };

      const result = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
        const uploadCallback = (error: any, callResult: any) => {
          if (error) reject(error);
          else if (callResult) resolve(callResult as CloudinaryUploadResponse);
          else reject(new Error('No result returned from upload'));
        };

        if (typeof file === 'string' && file.startsWith('data:')) {
          cloudinary.uploader.upload(file, uploadOptions, uploadCallback);
        } else if (Buffer.isBuffer(file)) {
          cloudinary.uploader.upload_stream(uploadOptions, uploadCallback)
            .end(file);
        } else {
          throw new ImageServiceError('Invalid file format', 'invalid_file');
        }
      });
      
      return this.mapToImageInfo(result);
    } catch (error: any) {
      console.error('Image upload error:', error);
      throw new ImageServiceError(
        error.message || 'Failed to upload image',
        error.code || 'upload_failed'
      );
    }
  }

  /**
   * Delete an image from Cloudinary
   * 
   * @param publicId Public ID of the image to delete
   * @returns Promise with deletion result
   */
  async deleteImage(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error: any) {
      console.error('Image deletion error:', error);
      throw new ImageServiceError(
        error.message || 'Failed to delete image',
        error.code || 'delete_failed'
      );
    }
  }

  /**
   * Get transformation URL for an image
   * 
   * @param publicId Public ID of the image
   * @param options Transformation options
   * @returns URL of the transformed image
   */
  getTransformedImageUrl(
    publicId: string, 
    options: ImageTransformOptions
  ): string {
    const transformations: string[] = [];
    
    if (options.width || options.height) {
      const resize = `${options.width ? `w_${options.width}` : ''},${options.height ? `h_${options.height}` : ''}`;
      transformations.push(resize);
    }
    
    if (options.crop) {
      transformations.push(`c_${options.crop}`);
    }
    
    if (options.quality) {
      transformations.push(`q_${options.quality}`);
    }
    
    if (options.format) {
      transformations.push(`f_${options.format}`);
    }
    
    if (options.effect) {
      transformations.push(`e_${options.effect}`);
    }
    
    return cloudinary.url(publicId, {
      transformation: transformations.length > 0 ? [transformations.join(',')] : undefined,
      secure: true
    });
  }

  /**
   * Generate a URL for responsive images
   * 
   * @param publicId Public ID of the image
   * @param baseWidth Base width for responsive sizing
   * @returns URL with responsive transformation
   */
  getResponsiveImageUrl(publicId: string, baseWidth = 800): string {
    return cloudinary.url(publicId, {
      width: 'auto',
      dpr: 'auto',
      responsive: true,
      crop: 'scale',
      responsive_placeholder: 'blank',
      secure: true
    });
  }

  /**
   * Map Cloudinary response to our internal format
   * 
   * @param response Cloudinary upload response
   * @returns Mapped image info
   */
  private mapToImageInfo(response: CloudinaryUploadResponse): CloudinaryImageInfo {
    return {
      id: response.public_id,
      url: response.url,
      secureUrl: response.secure_url,
      format: response.format,
      width: response.width,
      height: response.height,
      bytes: response.bytes,
      createdAt: response.created_at
    };
  }
}

export default new ImageService();
