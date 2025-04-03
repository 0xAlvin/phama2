import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { prescriptions, prescriptionItems, medications, patients } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

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

    // Add debugging output
    console.log(`Fetching prescriptions for userId: ${userId}, userRole: ${session.user.role}`);

    // Find the patient record associated with this user
    const patient = await db.query.patients.findFirst({
      where: eq(patients.userId, userId),
      columns: {
        id: true
      }
    });

    if (!patient) {
      console.log(`No patient record found for userId: ${userId}`);
      return NextResponse.json(
        { prescriptions: [], success: true, message: 'No patient record found' }, 
        { status: 200 }
      );
    }

    console.log(`Found patient record: ${patient.id} for user: ${userId}`);

    // Fetch prescriptions with their items and medications
    const userPrescriptions = await db.query.prescriptions.findMany({
      where: eq(prescriptions.patientId, patient.id),
      orderBy: [desc(prescriptions.createdAt)],
      with: {
        items: {
          with: {
            medication: true
          }
        }
      }
    });

    console.log(`Found ${userPrescriptions.length} prescriptions for patient: ${patient.id}`);

    // Check if we have any prescriptions
    if (!userPrescriptions.length) {
      return NextResponse.json(
        { prescriptions: [], success: true }, 
        { status: 200 }
      );
    }

    // Return the prescriptions
    return NextResponse.json(
      { 
        prescriptions: userPrescriptions,
        success: true
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch prescriptions', 
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// This will handle POST requests to /api/prescriptions
export async function POST(request: NextRequest) {
  const requestStartTime = Date.now();
  console.log(`POST /api/prescriptions invoked at ${new Date(requestStartTime).toISOString()}`);
  
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
    console.log("Received prescription data:", JSON.stringify(data, null, 2));
    
    // Ensure required fields are provided - removed issueDate from required fields
    if (!data.patientId || !data.doctorName || !data.medications) {
      return NextResponse.json(
        { error: 'Missing required fields', success: false, details: 'Please provide patientId, doctorName, and medications' },
        { status: 400 }
      );
    }
    
    // Validate medications array
    if (!Array.isArray(data.medications) || data.medications.length === 0) {
      return NextResponse.json(
        { error: 'Invalid medications data', success: false, details: 'Medications must be a non-empty array' },
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
    
    // Create prescription ID and get current date for created/updated timestamps
    const prescriptionId = randomUUID();
    const now = new Date();
    
    try {
      // Start database transaction
      await db.transaction(async (tx) => {
        // Insert prescription - removed issueDate and expiryDate
        await tx.insert(prescriptions).values({
          id: prescriptionId,
          patientId: data.patientId,
          doctorName: data.doctorName,
          doctorContact: data.doctorContact || null,
          status: data.status || 'pending',
          notes: data.notes || null,
          pharmacyId: data.pharmacyId || null,
          imageUrl: data.imageUrl || null,
          createdAt: now,
          updatedAt: now
        });
        
        // Process medications
        for (const med of data.medications) {
          if (!med.name || !med.dosage || !med.frequency) {
            throw new Error('Each medication must include name, dosage, and frequency');
          }
          
          // Find or create medication
          let medicationId: string;
          const existingMed = await tx.query.medications.findFirst({
            where: eq(medications.name, med.name),
            columns: { id: true }
          });
          
          if (existingMed) {
            medicationId = existingMed.id;
          } else {
            const [newMed] = await tx.insert(medications).values({
              name: med.name,
              description: med.description || null,
              type: med.type || 'tablet',
              createdAt: now,
              updatedAt: now
            }).returning({ id: medications.id });
            
            medicationId = newMed.id;
          }
          
          // Insert prescription item
          await tx.insert(prescriptionItems).values({
            prescriptionId: prescriptionId,
            medicationId: medicationId,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration || null,
            quantity: med.quantity || null,
            instructions: med.instructions || null,
            createdAt: now,
            updatedAt: now
          });
        }
      });
      
      // Return success
      const duration = Date.now() - requestStartTime;
      console.log(`Prescription ${prescriptionId} created successfully in ${duration}ms`);
      return NextResponse.json({ 
        success: true, 
        id: prescriptionId, 
        message: 'Prescription created successfully'
      }, { status: 201 });
      
    } catch (dbError) {
      const duration = Date.now() - requestStartTime;
      console.error(`Database error after ${duration}ms:`, dbError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to create prescription in database', 
          details: dbError instanceof Error ? dbError.message : 'Unknown database error' 
        },
        { status: 500 }
      );
    }
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
