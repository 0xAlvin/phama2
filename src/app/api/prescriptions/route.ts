import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { prescriptions } from '@/lib/schema';

// This will handle GET requests to /api/prescriptions
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user session
    const session = await auth();

    // If no session or user is not authenticated, return unauthorized
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get userId from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    // Validate userId
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter', success: false },
        { status: 400 }
      );
    }

    // Authorization check - only allow access to own prescriptions or if admin
    if (userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized to access these prescriptions', success: false },
        { status: 403 }
      );
    }

    // Fetch prescriptions for the user
    const userPrescriptions = await db.query.prescriptions.findMany({
      where: eq(prescriptions.patientId, userId),
      with: {
        items: {
          with: {
            medication: true, // Include medication details in the relation
          },
        },
      },
      orderBy: (prescriptions, { desc }) => [desc(prescriptions.createdAt)],
    });

    // Check if prescriptions were found
    if (!userPrescriptions || userPrescriptions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No prescriptions found' },
        { status: 404 }
      );
    }

    // Return a consistent response structure
    return NextResponse.json({ 
      success: true,
      prescriptions: userPrescriptions 
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);

    // Log additional details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }

    // Ensure we always return a proper JSON response even for server errors
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch prescriptions', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// This will handle POST requests to /api/prescriptions
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user session
    const session = await auth();
    
    // If no session or user is not authenticated, return unauthorized
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    // Ensure required fields are provided
    if (!data.patientId || !data.doctorName || !data.issueDate) {
      return NextResponse.json(
        { error: 'Missing required fields', success: false },
        { status: 400 }
      );
    }
    
    // Ensure the prescription belongs to the authenticated user
    // or the user has admin/doctor privileges
    if (data.patientId !== session.user.id && 
        session.user.role !== 'ADMIN' && 
        session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Unauthorized to create prescriptions for other users', success: false },
        { status: 403 }
      );
    }
    
    // Process and save the prescription data
    // Implementation would go here
    // Since this is a placeholder, we'll just return success
    
    return NextResponse.json({ 
      success: true, 
      id: 'new-prescription-id', 
      message: 'Prescription created successfully'
    });
  } catch (error) {
    console.error('Error creating prescription:', error);
    
    // Ensure we always return a proper JSON response even for server errors
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create prescription', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
