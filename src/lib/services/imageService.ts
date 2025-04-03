import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

const imageService = {
  async uploadImage(image: string, folder: string): Promise<{ publicUrl: string }> {
    try {
      // 1. Extract the base64 data and file extension
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const fileExtension = image.substring("data:image/".length, image.indexOf(";base64"));

      // 2. Generate a unique file name
      const imageName = `${uuidv4()}.${fileExtension}`;
      const imagePath = `${folder}/${imageName}`;

      // 3. Decode the base64 data
      const buffer = Buffer.from(base64Data, 'base64');

      // 4. Upload the image to Supabase storage
      const { data, error } = await supabase.storage
        .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET!)
        .upload(imagePath, buffer, {
          contentType: `image/${fileExtension}`,
          upsert: false // Prevent overwriting files with the same name
        });

      if (error) {
        console.error("Supabase upload error:", error);
        throw new Error(`Failed to upload image to Supabase: ${error.message}`);
      }

      // 5. Generate a public URL for the image
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.NEXT_PUBLIC_SUPABASE_BUCKET}/${imagePath}`;

      return { publicUrl };
    } catch (err: any) {
      console.error("Image service error:", err);
      throw new Error(err.message || "Failed to process image");
    }
  }
};

export default imageService;
