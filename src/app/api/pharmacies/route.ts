import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { pharmacies } from '@/lib/schema';
import { unstable_cache } from 'next/cache';

// Cache pharmacy list for 5 minutes to reduce database load
const getCachedPharmacies = unstable_cache(
  async () => {
    const result = await db
      .select({
        id: pharmacies.id,
        name: pharmacies.name,
        email: pharmacies.email,
        phone: pharmacies.phone,
        licenseNumber: pharmacies.licenseNumber,
      })
      .from(pharmacies)
      .orderBy(pharmacies.name);
    
    return result;
  },
  ['pharmacies-list'],
  { revalidate: 300 } // 5 minutes
);

export async function GET(request: Request) {
  try {
    // Verify authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get pharmacies from cache or database
    const pharmaciesList = await getCachedPharmacies();
    
    return NextResponse.json(pharmaciesList);
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pharmacies' },
      { status: 500 }
    );
  }
}
