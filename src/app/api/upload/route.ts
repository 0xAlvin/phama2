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
    // Check authentication using the auth() function
    type UserType = { staffRole?: keyof typeof PharmacyStaffRoles } & { role?: keyof typeof UserRoles };
    const session = await auth() as { user: UserType };
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get user role from session
    const userRole = session.user.role || UserRoles.PATIENT;
    // Get pharmacy staff role if available
    const staffRole = session.user.staffRole as typeof PharmacyStaffRoles[keyof typeof PharmacyStaffRoles] | undefined;
    
    // Parse the request as JSON
    const { image, purpose, folder } = await request.json();
    
    // Validate required fields
    if (!image) {
      return NextResponse.json({ error: "Image data is required" }, { status: 400 });
    }
    
    if (!purpose || !ALLOWED_UPLOADS[purpose as keyof typeof ALLOWED_UPLOADS]) {
      return NextResponse.json({ error: "Valid upload purpose is required" }, { status: 400 });
    }
    
    // Check if user has permission for this upload type
    const allowedRoles = ALLOWED_UPLOADS[purpose as keyof typeof ALLOWED_UPLOADS] as Array<typeof UserRoles[keyof typeof UserRoles] | typeof PharmacyStaffRoles[keyof typeof PharmacyStaffRoles]>;
    
    // Check primary role or staff role if available
    const hasPermission = allowedRoles.includes(userRole as typeof UserRoles[keyof typeof UserRoles]) || 
      (staffRole && allowedRoles.includes(staffRole));
    
    if (!hasPermission) {
      return NextResponse.json({ 
        error: `Your role doesn't have permission for ${purpose} uploads` 
      }, { status: 403 });
    }
    
    // Determine the appropriate folder
    const uploadFolder = folder || `phamapp/${purpose}`;
    
    // Add relevant tags based on role
    const tags = [purpose];
    if (userRole) tags.push(userRole);
    if (staffRole) tags.push(staffRole);
    
    // Process the base64 or URL image using imageService
    const uploadResult = await imageService.uploadImage(
      image,
      uploadFolder,
      tags
    );
    
    // Return success response with image info
    return NextResponse.json({
      message: "Image uploaded successfully",
      image: uploadResult
    }, { status: 200 });
    
  } catch (error: any) {
    console.error("Image upload error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to upload image" 
    }, { status: 500 });
  }
}

// Config for API routes
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
