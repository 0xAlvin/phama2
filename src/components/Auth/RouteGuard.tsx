'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import RenderDebug from '../debug/RenderDebug';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
  showDebug?: boolean;
}

export default function RouteGuard({
  children,
  requireAuth = true,
  allowedRoles = [],
  showDebug = process.env.NODE_ENV === 'development'
}: RouteGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check if the current path is an auth page
  const isAuthPage = 
    pathname === '/signin' || 
    pathname === '/signup' || 
    pathname === '/signout' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';

  // Add logging for component lifecycle
  useEffect(() => {
    console.log(`[RouteGuard] Component mounted - Path: ${pathname}`);
    return () => console.log(`[RouteGuard] Component unmounted - Path: ${pathname}`);
  }, [pathname]);

  useEffect(() => {
    // Debug for troubleshooting
    console.log("RouteGuard checking auth:", {
      status,
      path: pathname,
      isAuthPage,
      requireAuth,
      allowedRoles,
      userRole: session?.user?.role
    });

    // If we're still loading the session, wait
    if (status === 'loading') {
      console.log("[RouteGuard] Session loading, waiting...");
      return;
    }

    // Critical fix: If we're on an auth page, we should NOT require auth to view it!
    if (isAuthPage) {
      console.log("[RouteGuard] On auth page, allowing access without authentication");
      setIsAuthorized(true);
      setIsLoading(false);
      return;
    }

    // If we don't require auth
    if (!requireAuth) {
      console.log("[RouteGuard] Auth not required, allowing access");
      setIsAuthorized(true);
      setIsLoading(false);
      return;
    }

    // Check if authentication is required but user is not authenticated
    if (requireAuth && status !== 'authenticated') {
      console.log("[RouteGuard] Auth required but user not authenticated");
      
      // Redirect to signin
      console.log(`[RouteGuard] Redirecting to signin with callback: ${pathname}`);
      const encodedCallbackUrl = encodeURIComponent(pathname);
      router.push(`/signin?callbackUrl=${encodedCallbackUrl}`);
      
      setAuthError("Authentication required");
      setIsLoading(false);
      return;
    }

    // User is authenticated, now check roles if specified
    if (status === 'authenticated') {
      console.log("[RouteGuard] User is authenticated, checking roles");
      
      if (allowedRoles.length === 0) {
        // No role restrictions, user is authorized
        console.log("[RouteGuard] No roles required, user is authorized");
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }
      
      // Check if user has an allowed role
      const userRole = session?.user?.role as string;
      console.log(`[RouteGuard] Checking user role: ${userRole} against allowed roles:`, allowedRoles);
      
      if (userRole && allowedRoles.includes(userRole)) {
        console.log("[RouteGuard] User role is allowed, authorizing");
        setIsAuthorized(true);
        setIsLoading(false);
      } else {
        console.log("[RouteGuard] User role not allowed");
        setAuthError("You don't have permission to access this resource");
        setIsLoading(false);
        // Optional: redirect to unauthorized page
        // router.push('/unauthorized');
      }
    }
  }, [status, pathname, isAuthPage, requireAuth, allowedRoles, session, router]);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <Loader2 size={40} className="animate-spin" />
        <p>Verifying authentication...</p>
        {showDebug && <RenderDebug id="route-guard-loading" />}
      </div>
    );
  }

  if (!isAuthorized && requireAuth) {
    return (
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '20px' }}>
          <h2>Access Denied</h2>
          <p>{authError || "You don't have permission to view this page"}</p>
          {showDebug && <RenderDebug id="route-guard-unauthorized" />}
        </div>
      </div>
    );
  }

  return (
    <>
      {showDebug && <RenderDebug id="route-guard-authorized" showDetails={false} />}
      {children}
    </>
  );
}
