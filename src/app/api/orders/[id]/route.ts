import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getOrderById } from '@/services/orderService';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order ID is required' 
      }, { status: 400 });
    }
    
    const order = await getOrderById(id, session);
    
    if (!order) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    
    // If it's an unauthorized access error, return a 403
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ 
        success: false, 
        error: 'You do not have permission to access this order' 
      }, { status: 403 });
    }
    
    // For all other errors
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}
