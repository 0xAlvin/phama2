import { createUser } from "@/lib/services/userService";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@/types/authTypes";

// Helper function to create error responses with consistent structure
function createErrorResponse(message: string, code: string, status: number) {
  console.log(`Sending error response: ${code} - ${message}`);
  return NextResponse.json({
    success: false,
    error: {
      message,
      code,
    }
  }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { 
      email, 
      password, 
      role, 
      firstName, 
      lastName, 
      phoneNumber,
      pharmacyName, 
      licenseNumber,
      dateOfBirth,
      address,
      // Add other fields as needed
    } = body;
    
    // Basic validation
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password, and role are required" },
        { status: 400 }
      );
    }
    
    // Check if role is valid
    if (role !== Role.PATIENT && role !== Role.PHARMACY) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }
    
    try {
      const user = await createUser({
        email,
        password,
        role,
        firstName,
        lastName,
        phoneNumber,
        pharmacyName,
        licenseNumber,
        dateOfBirth,
        address,
        // Pass other fields as needed
      });
      
      return NextResponse.json(
        { 
          success: true, 
          message: "Registration successful",
          userId: user.id,
          email: user.email,
          role: user.role
        },
        { status: 201 }
      );
    } catch (error: any) { // Use any type to make property access easier
      console.error("Raw error from service:", error);
      
      // Just return the error message directly without any processing
      return NextResponse.json(
        { 
          error: error.message || "Registration failed",
          originalError: JSON.stringify(error)
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Request parsing error:", error);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
