import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, patients, pharmacies } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({
        authenticated: false,
        message: 'No authenticated user'
      });
    }
    
    const userId = session.user.id;
    
    // Get user details
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    
    // Get patient info if exists
    const patient = await db.query.patients.findFirst({
      where: eq(patients.userId, userId),
    });
    
    // Get pharmacy info if exists
    const pharmacy = await db.query.pharmacies.findFirst({
      where: eq(pharmacies.userId, userId),
    });
    
    return NextResponse.json({
      authenticated: true,
      sessionData: {
        userId: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      userData: user ? {
        id: user.id,
        email: user.email,
        role: user.role,
      } : null,
      patientData: patient ? {
        id: patient.id,
        exists: true
      } : null,
      pharmacyData: pharmacy ? {
        id: pharmacy.id,
        exists: true
      } : null
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Error retrieving user data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
