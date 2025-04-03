import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Helper function to debug middleware execution with timestamp
const debugMiddleware = (message: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[Middleware Debug ${timestamp}] ${message}`, details || '');
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for API routes and static files
  if (
    pathname.startsWith('/api/') || 
    pathname.includes('/_next') || 
    pathname.includes('/static') || 
    pathname.includes('/fonts') || 
    pathname.includes('/images') ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|json|woff|woff2|ttf)$/)
  ) {
    return NextResponse.next();
  }

  // Skip auth-test to avoid interference
  if (pathname === '/auth-test') {
    return NextResponse.next();
  }

  debugMiddleware(`Processing request for: ${pathname}`);
  
  try {
    // Only check dashboard protection
    if (pathname.startsWith('/dashboard')) {
      // Get all cookies for debugging
      const cookies = request.cookies.getAll();
      debugMiddleware(`Cookies found:`, cookies.map(c => `${c.name}=${c.value.substring(0, 8)}...`));
      
      // Get the AUTH_SECRET from environment variables
      const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
      
      if (!secret) {
        debugMiddleware("WARNING: No NEXTAUTH_SECRET found in environment!");
        return NextResponse.redirect(new URL('/signin', request.url));
      }
      
      // Get token with all critical settings explicitly set
      // Try authjs.session-token format first
      let session = await getToken({
        req: request,
        secret,
        secureCookie: process.env.NODE_ENV === "production", 
        cookieName: "authjs.session-token",
        raw: true // Important for capturing the raw JWT
      }).catch(err => {
        debugMiddleware(`Error getting token from authjs.session-token: ${err.message}`);
        return null;
      });
      
      // If no session with authjs format, try next-auth format
      if (!session) {
        session = await getToken({
          req: request,
          secret,
          secureCookie: process.env.NODE_ENV === "production",
          cookieName: "next-auth.session-token",
          raw: true // Important for capturing the raw JWT
        }).catch(err => {
          debugMiddleware(`Error getting token from next-auth.session-token: ${err.message}`);
          return null;
        });
        
        if (session) {
          debugMiddleware("Found valid session with next-auth.session-token");
        }
      } else {
        debugMiddleware("Found valid session with authjs.session-token");
      }
      
      debugMiddleware(`Session authentication result: ${!!session}`);
      
      // If we still don't have a valid token, try manually decoding to see what's wrong
      if (!session) {
        const authJsToken = request.cookies.get('authjs.session-token')?.value;
        const nextAuthToken = request.cookies.get('next-auth.session-token')?.value;
        
        debugMiddleware('Raw token values available:', {
          'authjs.session-token': authJsToken ? 'present' : 'absent',
          'next-auth.session-token': nextAuthToken ? 'present' : 'absent',
        });
        
        try {
          // Load a JWT debugging utility
          const { decode } = require('next-auth/jwt');
          
          // Try to decode without verification just to see if the token structure is valid
          if (authJsToken) {
            const decoded = decode({ 
              token: authJsToken, 
              secret,
            });
            debugMiddleware('Raw authjs token decode attempt:', { success: !!decoded });
          }
          
          if (nextAuthToken) {
            const decoded = decode({ 
              token: nextAuthToken, 
              secret,
            });
            debugMiddleware('Raw next-auth token decode attempt:', { success: !!decoded });
          }
        } catch (decodeErr) {
          debugMiddleware(`Error during manual token decode: ${decodeErr.message}`);
        }
        
        debugMiddleware("No valid session found, redirecting to signin");
        return NextResponse.redirect(new URL('/signin', request.url));
      }
      
      debugMiddleware("Valid session found, allowing access to dashboard");
    }
    
    // For all other routes, allow the request
    return NextResponse.next();
  } catch (error) {
    console.error('[Middleware Error]', error);
    // In case of error, redirect to signin
    if (pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
    return NextResponse.next();
  }
}

// Very focused matcher to only protect dashboard
export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/auth-test']
};

