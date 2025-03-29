import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync } from 'fs';

export async function POST(request: Request) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the formData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Supported formats: JPEG, PNG, GIF, PDF' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    // Generate a unique filename with the original extension
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${uuidv4()}.${fileExt}`;
    
    // Create the uploads directory path
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'prescriptions');
    
    // Ensure directory exists
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    
    const filePath = join(uploadsDir, fileName);
    
    // Convert the file to a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Write the file to the filesystem
    await writeFile(filePath, buffer);
    
    // Return the path to the file (relative to public folder for serving statically)
    const fileUrl = `/uploads/prescriptions/${fileName}`;
    
    return NextResponse.json({ 
      success: true, 
      fileUrl,
      fileName
    });
  } catch (error) {
    console.error('Error uploading prescription image:', error);
    return NextResponse.json({ error: 'Failed to upload prescription image' }, { status: 500 });
  }
}
