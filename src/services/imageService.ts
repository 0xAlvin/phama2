import { supabase } from '@/lib/supabase';

class ImageService {
  /**
   * Uploads an image to Supabase storage
   * @param {File | string} file - File object or base64 string
   * @param {string} folder - Folder path in storage
   * @returns {Promise<{publicUrl: string}>} - Public URL of uploaded image
   */
  async uploadImage(file: File | string, folder: string): Promise<{ publicUrl: string }> {
    try {
      let fileToUpload: File;
      let fileName: string;
      
      // Handle both File objects and base64/dataURL strings
      if (typeof file === 'string') {
        // Convert base64 to File object
        if (file.startsWith('data:')) {
          const res = await fetch(file);
          const blob = await res.blob();
          fileName = `${Date.now()}-image.${this.getFileExtFromMimeType(blob.type)}`;
          fileToUpload = new File([blob], fileName, { type: blob.type });
        } else {
          throw new Error('Invalid image format. Expected File or data URL');
        }
      } else {
        fileToUpload = file;
        fileName = `${Date.now()}-${file.name}`;
      }
      
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('prescriptions')
        .upload(`${folder}/${fileName}`, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        throw error;
      }
      
      // Get public URL of the uploaded file
      const { data: urlData } = supabase.storage
        .from('prescriptions')
        .getPublicUrl(data.path);
      
      return { publicUrl: urlData.publicUrl };
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw error;
    }
  }
  
  /**
   * Get file extension from MIME type
   */
  private getFileExtFromMimeType(mimeType: string): string {
    const types: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'application/pdf': 'pdf',
      'image/webp': 'webp'
    };
    
    return types[mimeType] || 'jpg';
  }
}

const imageService = new ImageService();
export default imageService;
