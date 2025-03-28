import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Temporarily disable all middleware logic to test component rendering
export function middleware(request: NextRequest) {
  // Just pass through all requests without any logic
  console.log(`[Middleware DISABLED] Request to: ${request.nextUrl.pathname}`);
  return NextResponse.next();
}

// Only include essential routes
export const config = {
  matcher: ['/dashboard/:path*']
};

/* TEMPORARILY DISABLED MIDDLEWARE CODE:
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
  
  // More comprehensive exclusion list
  if (
    pathname.startsWith('/api/') || 
    pathname.includes('/_next') || 
    pathname.includes('/static') || 
    pathname.includes('/fonts') || 
    pathname.includes('/images') ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|json|woff|woff2|ttf)$/)
  ) {
    // Skip middleware for static resources
    return NextResponse.next();
  }

  debugMiddleware(`Processing request for: ${pathname}`);
  
  // Attempt to get the session token with error handling
  try {
    const session = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // Only check specific paths exactly - don't use startsWith for auth pages
    // This avoids accidentally matching paths like /signin-custom
    const isAuthPage = 
      pathname === '/signin' || 
      pathname === '/signup' || 
      pathname === '/forgot-password' || 
      pathname === '/reset-password';

    debugMiddleware(`Auth status: ${session ? 'Authenticated' : 'Not authenticated'}, Page: ${pathname}, isAuthPage: ${isAuthPage}`);

    // For authenticated users accessing auth pages or home
    if (session && (isAuthPage || pathname === '/')) {
      debugMiddleware(`Redirecting authenticated user from ${pathname} to /dashboard`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Only for dashboard paths specifically
    if (!session && pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
      debugMiddleware(`Redirecting unauthenticated user from ${pathname} to /signin`);
      const callbackUrl = encodeURIComponent(pathname);
      return NextResponse.redirect(new URL(`/signin?callbackUrl=${callbackUrl}`, request.url));
    }
    
    // For all other paths, allow access regardless of auth status
    debugMiddleware(`Allowing access to ${pathname}`);
    return NextResponse.next();
  } catch (error) {
    console.error('[Middleware Error]', error);
    // In case of error, let the request through to avoid breaking the app
    return NextResponse.next();
  }
}

// Make matcher more specific to avoid capturing CSS/JS files
export const config = {
  matcher: [
    // Only match specific paths we want to protect or handle
    '/',
    '/dashboard',
    '/dashboard/:path*',
    '/signin',
    '/signup',
    '/forgot-password',
    '/reset-password'
  ],
};
*/
