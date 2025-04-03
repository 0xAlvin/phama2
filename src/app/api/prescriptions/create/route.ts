import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { prescriptions, prescriptionItems, medications, patients } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
    const requestStartTime = Date.now();
    console.log(`POST /api/prescriptions/create invoked at ${new Date(requestStartTime).toISOString()}`);

    try {
        // 1. Authentication & Authorization
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ 
                error: 'Authentication required',
                success: false
            }, { status: 401 });
        }
        
        const userId = session.user.id;
        const userRole = session.user.role as string | undefined;

        // 2. Parse Request Body
        let data: any;
        try { 
            data = await request.json();
        } catch (parseError: any) { 
            return NextResponse.json({ 
                error: 'Invalid JSON in request body',
                details: parseError.message,
                success: false
            }, { status: 400 });
        }
        
        console.log("API received data:", JSON.stringify(data, null, 2));

        // 3. Payload Validation - removed issueDate from validation
        if (!data.patientId || !data.doctorName || !data.medications) {
            return NextResponse.json({ 
                error: 'Missing required fields',
                details: 'patientId, doctorName, and medications are required',
                success: false
            }, { status: 400 });
        }
        
        if (!Array.isArray(data.medications) || data.medications.length === 0) {
            return NextResponse.json({ 
                error: 'Invalid medications data',
                details: 'Medications must be a non-empty array',
                success: false
            }, { status: 400 });
        }

        // 4. Authorization Check
        if (data.patientId !== userId && userRole !== 'ADMIN' && userRole !== 'DOCTOR') {
            return NextResponse.json({ 
                error: 'Unauthorized to create prescriptions for other users',
                success: false
            }, { status: 403 });
        }

        // 5. Verify patient exists in database
        const patientExists = await db.query.patients.findFirst({
            where: eq(patients.id, data.patientId),
            columns: { id: true }
        });

        if (!patientExists) {
            console.error(`Patient ID ${data.patientId} not found in the database`);
            
            // Check if this is the user's own ID (they might be trying to create a prescription for themselves)
            if (data.patientId === userId) {
                // Try to find patient record by userId instead
                const userPatient = await db.query.patients.findFirst({
                    where: eq(patients.userId, userId),
                    columns: { id: true }
                });
                
                if (userPatient) {
                    // Update patientId to the correct one from the database
                    console.log(`Correcting patient ID from ${data.patientId} to ${userPatient.id}`);
                    data.patientId = userPatient.id;
                } else {
                    // Need to create a patient record for this user
                    console.log(`No patient record found for user ${userId}. Creating one...`);
                    
                    try {
                        // Create basic patient record
                        const [newPatient] = await db.insert(patients).values({
                            userId: userId,
                            firstName: session.user.name?.split(' ')[0] || 'New',
                            lastName: session.user.name?.split(' ')[1] || 'Patient',
                            dateOfBirth: new Date('2000-01-01'), // Default date
                            phone: '0000000000', // Default phone
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }).returning({ id: patients.id });
                        
                        if (!newPatient?.id) {
                            throw new Error('Failed to create patient record');
                        }
                        
                        // Update patientId with the newly created patient ID
                        data.patientId = newPatient.id;
                        console.log(`Created new patient record with ID: ${data.patientId}`);
                    } catch (createError) {
                        console.error('Failed to create patient record:', createError);
                        return NextResponse.json({ 
                            error: 'Patient record not found and could not be created',
                            details: 'Please complete your patient profile before creating prescriptions',
                            success: false
                        }, { status: 400 });
                    }
                }
            } else {
                // They're trying to create a prescription for someone else who doesn't exist
                return NextResponse.json({ 
                    error: 'Invalid patient ID',
                    details: 'The specified patient does not exist in the system',
                    success: false
                }, { status: 400 });
            }
        }

        // 6. Prepare Data for Insertion
        const prescriptionId = randomUUID();
        const now = new Date();
        const processedMedications = data.medications;
        const pharmacyIdValue = data.pharmacyId || data.pharmaciesId || null;

        // 7. Database Transaction
        console.log(`Starting database transaction for prescription ${prescriptionId}...`);
        try {
            await db.transaction(async (tx) => {
                // Insert prescription - removed issueDate and expiryDate fields
                await tx.insert(prescriptions).values({
                    id: prescriptionId,
                    patientId: data.patientId,
                    doctorName: data.doctorName,
                    doctorContact: data.doctorContact || null,
                    status: data.status || 'pending',
                    notes: data.notes || null,
                    pharmacyId: pharmacyIdValue,
                    imageUrl: data.imageUrl || null,
                    createdAt: now,
                    updatedAt: now
                });
                console.log(`Inserted prescription record ${prescriptionId}.`);

                // Insert items with proper Date objects
                for (const med of processedMedications) {
                    if (!med.name || !med.dosage || !med.frequency) {
                        throw new Error('Each medication must include name, dosage, and frequency');
                    }
                    
                    let medicationId: string | undefined;
                    // --- Find or Create Medication Logic
                    const existingMed = await tx.select({ id: medications.id }).from(medications).where(eq(medications.name, med.name));
                    if (existingMed.length > 0) { 
                        medicationId = existingMed[0].id; 
                    } else {
                        const newMed = await tx.insert(medications).values({
                            name: med.name,
                            description: med.description || null,
                            type: med.type || 'tablet',
                            createdAt: now,
                            updatedAt: now
                        }).returning({ id: medications.id });
                        
                        if (!newMed?.[0]?.id) { 
                            throw new Error(`Failed to create/get ID for med ${med.name}`); 
                        }
                        medicationId = newMed[0].id;
                    }

                    if (!medicationId) {
                        throw new Error(`Failed to determine medicationId for ${med.name}`);
                    }

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
                    console.log(`Inserted prescription item for med ID ${medicationId}`);
                }
            });

            // 8. Return Success Response
            const duration = Date.now() - requestStartTime;
            console.log(`Successfully completed transaction for prescription ${prescriptionId} in ${duration}ms.`);
            return NextResponse.json({ 
                success: true, 
                prescriptionId: prescriptionId,
                message: 'Prescription created successfully' 
            }, { status: 201 });

        } catch (dbError: any) {
            const duration = Date.now() - requestStartTime;
            console.error(`Database transaction error after ${duration}ms:`, dbError);
            console.error('Database error stack:', dbError?.stack);
            return NextResponse.json({ 
                error: 'Database error while creating prescription',
                details: dbError.message
            }, { status: 500 });
        }

    } catch (error: any) {
        const duration = Date.now() - requestStartTime;
        console.error(`Unhandled error after ${duration}ms:`, error);
        console.error('Unhandled error stack:', error?.stack);
        return NextResponse.json({ 
            error: 'Failed to create prescription',
            details: error.message
        }, { status: 500 });
    }
}