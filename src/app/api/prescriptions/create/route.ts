import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { prescriptions, prescriptionItems, medications } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Remove the formatTimestampForPostgres function as Drizzle expects Date objects, not strings

export async function POST(request: NextRequest) {
    const requestStartTime = Date.now();
    console.log(`POST /api/prescriptions/create invoked at ${new Date(requestStartTime).toISOString()}`);

    try {
        // 1. Authentication & Authorization (Keep existing logic)
        const session = await auth();
        if (!session?.user?.id) { /* ... return 401 ... */ }
        const userId = session.user.id;
        const userRole = session.user.role as string | undefined;

        // 2. Parse Request Body (Keep existing logic)
        let data: any;
        try { data = await request.json(); /* ... */ }
        catch (parseError: any) { /* ... return 400 ... */ }
        console.log("API received data:", JSON.stringify(data, null, 2));

        // 3. Payload Validation (Keep existing logic)
        // ... requiredFields check ...
        // ... medications array check ...
        // ... individual medication item check ...

        // 4. Authorization Check (Keep existing logic)
        if (data.patientId !== userId && userRole !== 'ADMIN' && userRole !== 'DOCTOR') {
             /* ... return 403 ... */
        }

        // 5. Date Parsing and Validation - Fix date handling
        let parsedIssueDate: Date;
        let parsedExpiryDate: Date | null = null;
        const now = new Date(); // Current timestamp

        try {
            const issueDateInput = data.issueDate;
            if (!issueDateInput) { throw new Error('issueDate is missing.'); }
            let date = new Date(issueDateInput);
            if (isNaN(date.getTime())) { throw new Error(`Invalid issueDate format: ${issueDateInput}`); }
            parsedIssueDate = date;

            const expiryDateInput = data.expiryDate;
            if (expiryDateInput) {
                date = new Date(expiryDateInput);
                if (!isNaN(date.getTime())) {
                    parsedExpiryDate = date;
                } else { console.warn(`Invalid expiryDate format: ${expiryDateInput}. Treating as null.`); }
            }
        } catch (dateParseError: any) {
            console.error('Date Parsing Error:', dateParseError);
            return NextResponse.json({ 
                error: 'Invalid date format', 
                details: dateParseError.message 
            }, { status: 400 });
        }

        // 6. Prepare Data for Insertion
        const prescriptionId = randomUUID();
        const processedMedications = data.medications.map((med: any) => { /* ... keep existing mapping logic ... */ });

        // Verify pharmacyId column name (adjust 'pharmacyId' if needed)
        const pharmacyIdValue = data.pharmacyId || data.pharmaciesId || null;

        // 7. Database Transaction - Pass Date objects directly to Drizzle
        console.log(`Starting database transaction for prescription ${prescriptionId}...`);
        try {
            await db.transaction(async (tx) => {
                // Insert prescription with proper Date objects
                await tx.insert(prescriptions).values({
                    id: prescriptionId,
                    patientId: data.patientId,
                    doctorName: data.doctorName,
                    doctorContact: data.doctorContact || null,
                    issueDate: parsedIssueDate,     // Pass Date object directly
                    expiryDate: parsedExpiryDate,   // Pass Date object or null
                    status: data.status,
                    notes: data.notes || null,
                    pharmacyId: pharmacyIdValue,
                    imageUrl: data.imageUrl || null,
                    createdAt: now,           // Pass Date object directly
                    updatedAt: now            // Pass Date object directly
                });
                console.log(`Inserted prescription record ${prescriptionId}.`);

                // Insert items with proper Date objects
                for (const med of processedMedications) {
                    let medicationId: string | undefined;
                    // --- Find or Create Medication Logic (Keep existing) ---
                    const existingMed = await tx.select({ id: medications.id }).from(medications).where(eq(medications.name, med.name));
                    if (existingMed.length > 0) { 
                        medicationId = existingMed[0].id; 
                    } else {
                        const newMed = await tx.insert(medications).values({
                            name: med.name, /* other fields */
                            createdAt: now, // Use Date object directly
                            updatedAt: now  // Use Date object directly
                        }).returning({ id: medications.id });
                        if (!newMed?.[0]?.id) { 
                            throw new Error(`Failed to create/get ID for med ${med.name}`); 
                        }
                        medicationId = newMed[0].id;
                    }
                    // --- End Find or Create ---

                    if (!medicationId) { // Defensive check
                        throw new Error(`Failed to determine medicationId for ${med.name}`);
                    }

                    await tx.insert(prescriptionItems).values({
                        prescriptionId: prescriptionId,
                        medicationId: medicationId,
                        dosage: med.dosage,
                        frequency: med.frequency,
                        duration: med.duration,
                        quantity: med.quantity,
                        instructions: med.instructions,
                        createdAt: now, // Use Date object directly
                        updatedAt: now  // Use Date object directly
                    });
                    console.log(`Inserted prescription item for med ID ${medicationId}`);
                } // End loop
            }); // End transaction

            // 8. Return Success Response (Keep existing logic)
             const duration = Date.now() - requestStartTime;
             console.log(`Successfully completed transaction for prescription ${prescriptionId} in ${duration}ms.`);
             return NextResponse.json({ 
                success: true, 
                prescriptionId: prescriptionId,
                message: 'Prescription created successfully' 
             }, { status: 201 });

        } catch (dbError: any) {
             // 9. Handle DB Error (Keep existing logic)
             const duration = Date.now() - requestStartTime;
             console.error(`Database transaction error after ${duration}ms:`, dbError);
             console.error('Database error stack:', dbError?.stack);
             return NextResponse.json({ 
                error: 'Database error while creating prescription',
                details: dbError.message
             }, { status: 500 });
        }

    } catch (error: any) {
        // 10. Handle Outer Error (Keep existing logic)
        const duration = Date.now() - requestStartTime;
        console.error(`Unhandled error after ${duration}ms:`, error);
        console.error('Unhandled error stack:', error?.stack);
        return NextResponse.json({ 
            error: 'Failed to create prescription',
            details: error.message
        }, { status: 500 });
    }
}