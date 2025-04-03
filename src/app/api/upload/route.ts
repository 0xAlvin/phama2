import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import imageService from "@/lib/services/imageService";
import { UserRoles } from "@/lib/models/User";
import { PharmacyStaffRoles } from "@/lib/models/PharmacyStaff";

// Allowed upload purposes and corresponding roles
const ALLOWED_UPLOADS = {
  'profile': [UserRoles.PATIENT, UserRoles.PHARMACY],
  'product': [UserRoles.PHARMACY],
  'prescription': [UserRoles.PATIENT],
  'pharmacy': [UserRoles.PHARMACY],
  'general': [UserRoles.PHARMACY],
  // Staff roles for pharmacy staff members
  'staff': [
    PharmacyStaffRoles.ADMIN,
    PharmacyStaffRoles.PHARMACIST,
  ]
};

export async function POST(request: NextRequest) {
  try {
    console.log("Processing image upload request");

    // Check authentication using the auth() function
    const session = await auth();

    if (!session || !session.user) {
      console.log("Unauthorized: No session or user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user role from session - handle type properly
    const userRole = session.user.role as keyof typeof UserRoles || UserRoles.PATIENT;
    // Get pharmacy staff role if available
    const staffRole = session.user.staffRole as keyof typeof PharmacyStaffRoles | undefined;

    console.log(`User authenticated - Role: ${userRole}, StaffRole: ${staffRole || 'none'}`);

    // Parse the request as FormData or JSON depending on content type
    let image, purpose, folder;

    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle form data upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }
      
      // Convert file to base64
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = file.type;
      image = `data:${mimeType};base64,${base64}`;
      
      purpose = formData.get('purpose') as string || 'general';
      folder = formData.get('folder') as string;
    } else {
      // Handle JSON upload with base64 image data
      const data = await request.json();
      image = data.image;
      purpose = data.purpose;
      folder = data.folder;
    }

    // Validate required fields
    if (!image) {
      console.log("Bad Request: Image data is required");
      return NextResponse.json({ error: "Image data is required" }, { status: 400 });
    }

    if (!purpose || !ALLOWED_UPLOADS[purpose as keyof typeof ALLOWED_UPLOADS]) {
      console.log(`Bad Request: Invalid upload purpose: ${purpose}`);
      return NextResponse.json({ error: "Valid upload purpose is required" }, { status: 400 });
    }

    // Check if user has permission for this upload type
    const allowedRoles = ALLOWED_UPLOADS[purpose as keyof typeof ALLOWED_UPLOADS];

    // Check primary role or staff role if available
    const hasPermission = (
      allowedRoles.includes(userRole as unknown as any) || 
      (staffRole && allowedRoles.includes(staffRole as unknown as any))
    );

    if (!hasPermission) {
      console.log(`Forbidden: User role ${userRole} or staff role ${staffRole} does not have permission for ${purpose} uploads`);
      return NextResponse.json({
        error: `Your role doesn't have permission for ${purpose} uploads`
      }, { status: 403 });
    }

    // Determine the appropriate folder
    const uploadFolder = folder || `phamapp/${purpose}`;

    console.log(`Uploading image to folder: ${uploadFolder}`);

    // Process the base64 or URL image using imageService
    try {
      const uploadResult = await imageService.uploadImage(
        image,
        uploadFolder
      );

      console.log("Image uploaded successfully");

      // Return success response with image info
      return NextResponse.json({
        success: true,
        message: "Image uploaded successfully",
        fileUrl: uploadResult.publicUrl,
        image: uploadResult
      }, { status: 200 });
    } catch (supabaseError: any) {
      console.error("Supabase upload error:", supabaseError);
      return NextResponse.json({
        success: false,
        error: supabaseError.message || "Failed to upload image to storage"
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Image upload error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to process upload request"
    }, { status: 500 });
  }
}

// Use Next.js Edge Runtime for this API route
export const runtime = 'edge';

// Configure the bodyParser size limit in next.config.js instead
