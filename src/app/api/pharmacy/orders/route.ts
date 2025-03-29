import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPharmacyIdFromUserId, getPharmacyOrders } from '@/services/orderService';
import { unstable_cache } from 'next/cache';

// Cache pharmacy orders for 30 seconds to reduce database load
const getCachedPharmacyOrders = unstable_cache(
  async (pharmacyId: string, session: any) => {
    return await getPharmacyOrders(pharmacyId, session);
  },
  ['pharmacy-orders'],
  { revalidate: 30 }
);

export async function GET(request: Request) {
  try {
    // Get pharmacy ID from the URL
    const url = new URL(request.url);
    let pharmacyId = url.searchParams.get('pharmacyId');
    
    // Verify authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // If pharmacyId not provided, try to get it from the logged-in user
    if (!pharmacyId) {
      if (session.user.role === 'PHARMACY' || session.user.role === 'PHARMACY_STAFF') {
        // Find the pharmacy ID from the user ID
        if (!session.user.id) {
          return NextResponse.json(
            { error: 'User ID is missing' },
            { status: 400 }
          );
        }
        pharmacyId = await getPharmacyIdFromUserId(session.user.id);
        
        if (!pharmacyId) {
          return NextResponse.json(
            { error: 'Pharmacy not found for current user' },
            { status: 404 }
          );
        }
      } else if (session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Pharmacy ID is required when not accessing as a pharmacy user' },
          { status: 400 }
        );
      }
    }
    
    try {
      // Use cached version of the function to reduce database load
      const ordersData = await getCachedPharmacyOrders(pharmacyId as string, session);
      
      return NextResponse.json({
        success: true,
        data: ordersData,
        pharmacyId,
        currency: 'KES',
        isPharmacy: ['PHARMACY', 'PHARMACY_STAFF'].includes(session.user.role || '')
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Unauthorized access to pharmacy orders') {
          return NextResponse.json({ 
            success: false, 
            error: 'You do not have permission to access these orders' 
          }, { status: 403 });
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching pharmacy orders:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
