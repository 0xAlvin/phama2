import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check both possible cookie names
    let token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: "authjs.session-token", // Try the authjs format first
    });
    
    // If not found, try the legacy format
    if (!token) {
      token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: "next-auth.session-token", // Then try the next-auth format
      });
    }
    
    // Get all cookies for debugging
    const cookies = request.cookies.getAll();
    
    // Get session using auth() function
    const session = await auth();
    
    // Return all the information
    return NextResponse.json({
      token: token ? {
        email: token.email,
        name: token.name,
        role: token.role,
        exp: token.exp ? new Date(token.exp * 1000).toISOString() : null,
      } : null,
      sessionCookieName: token ? (
        cookies.some(c => c.name === "authjs.session-token") ? "authjs.session-token" : "next-auth.session-token"
      ) : "Not found",
      session: session,
      cookies: cookies.map(c => ({ 
        name: c.name, 
        value: c.name.includes('csrf') || c.name.includes('session-token') 
          ? '[REDACTED]' 
          : c.value,
        path: c.path,
        expires: c.expires
      })),
      headers: Object.fromEntries(
        [...request.headers.entries()].filter(([key]) => 
          !key.includes('cookie') && !key.includes('authorization')
        )
      ),
    }, { status: 200 });
  } catch (error) {
    console.error('Session debug error:', error);
    return NextResponse.json({ 
      error: 'Error retrieving session information',
      message: (error as Error).message
    }, { status: 500 });
  }
}
