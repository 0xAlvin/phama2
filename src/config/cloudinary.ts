import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryConfig } from '@/types/cloudinary';

/**
 * Configures the Cloudinary SDK with environment variables
 */
export const configureCloudinary = (): void => {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
};

/**
 * Gets the Cloudinary configuration for frontend use
 */
export const getCloudinaryConfig = (): CloudinaryConfig => {
  return {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '',
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '',
  };
};
