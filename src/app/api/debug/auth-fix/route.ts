import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get the auth token from the request (if present)
  const authToken = request.cookies.get('next-auth.session-token')?.value || 
                    request.cookies.get('authjs.session-token')?.value;
  
  // Create a response
  const response = NextResponse.json({
    status: 'success',
    message: 'Auth cookies synchronized',
    tokenFound: !!authToken
  });
  
  // If we found a token in either format, make sure it's set in both formats
  if (authToken) {
    // Set cookies using both naming conventions to ensure compatibility
    response.cookies.set('next-auth.session-token', authToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });
    
    response.cookies.set('authjs.session-token', authToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });
  }
  
  return response;
}
