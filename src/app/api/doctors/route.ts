import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { doctors } from '@/lib/schema';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all doctors
    const doctorsData = await db.select({
      id: doctors.id,
      name: doctors.name,
      specialization: doctors.specialization,
      licenseNumber: doctors.licenseNumber,
      contactInfo: doctors.contact,
    }).from(doctors);
    
    return NextResponse.json(doctorsData);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
  }
}
