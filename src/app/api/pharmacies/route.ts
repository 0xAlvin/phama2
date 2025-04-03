import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { pharmacies } from '@/lib/schema';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user session
    const session  = await auth();

    // If no session or user is not authenticated, return unauthorized
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch pharmacies from database
    const pharmacyList = await db.query.pharmacies.findMany({
      orderBy: (pharmacies, { asc }) => [asc(pharmacies.name)],
    });

    return NextResponse.json({
      pharmacies: pharmacyList
    });
  } catch (error) {
    console.error('Error fetching pharmacies:', error);

    // Return fallback data for development to avoid breaking the app
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        pharmacies: [
          { id: '1', name: 'Downtown Pharmacy', address: '123 Main St' },
          { id: '2', name: 'Community Pharmacy', address: '456 Oak Ave' },
          { id: '3', name: 'City Health Pharmacy', address: '789 Pine Blvd' }
        ]
      });
    }

    return NextResponse.json({
      error: 'Failed to fetch pharmacies',
      pharmacies: []
    }, { status: 500 });
  }
}
