import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // B2C sends queue timeout data in a specific format
    const timeoutData = await request.json();
    
    // Log the timeout for debugging
    console.log('B2C queue timeout received:', JSON.stringify(timeoutData, null, 2));
    
    // You might want to update your database with timeout information
    // For now, just acknowledge receipt
    
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Queue timeout notification received"
    });
  } catch (error) {
    console.error('B2C queue timeout error:', error);
    return NextResponse.json({ error: 'Failed to process B2C queue timeout' }, { status: 500 });
  }
}
