import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getOrderById } from '@/services/orderService';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Fix the NextJS error by explicitly making this an async function
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }
    
    // Safely extract the ID from params after authentication check
    const { id } = params;
    
    // Enhanced validation for order ID
    if (!id || id === 'undefined' || id.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Invalid or missing order ID'
      }, { status: 400 });
    }
    
    try {
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
    } catch (orderError) {
      console.error('Error fetching order:', orderError);
      
      // Send appropriate status codes based on error type
      if (orderError instanceof Error && 
          orderError.message.includes('permission')) {
        return NextResponse.json({
          success: false,
          error: orderError.message
        }, { status: 403 });  // Forbidden - proper status code for permission issues
      }
      
      return NextResponse.json({
        success: false,
        error: 'Failed to retrieve order details'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error in order API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
