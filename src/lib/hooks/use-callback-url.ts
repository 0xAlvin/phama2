'use client';

import { useSearchParams } from 'next/navigation';

/**
 * Custom hook to handle callback URLs for authentication redirects
 * @param defaultPath Default path to redirect to if no callback URL is provided
 * @returns The callback URL to use for redirection
 */
export function useCallbackUrl(defaultPath: string = '/dashboard'): string {
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams?.get('callbackUrl');
  
  // Debug information
  if (typeof window !== 'undefined') {
    console.log("Raw callbackUrl:", rawCallbackUrl);
  }
  
  // Validate the callback URL to prevent open redirect vulnerabilities and loops
  if (rawCallbackUrl) {
    // Only allow relative URLs or URLs to the same origin
    if (rawCallbackUrl.startsWith('/') && !rawCallbackUrl.startsWith('//')) {
      // Prevent redirects to auth pages to avoid loops
      if (!isAuthPath(rawCallbackUrl)) {
        return rawCallbackUrl;
      } else {
        console.log("Prevented auth page redirect loop for:", rawCallbackUrl);
      }
    }
  }
  
  return defaultPath;
}

/**
 * Check if a path is an authentication-related page
 */
function isAuthPath(path: string): boolean {
  const authPaths = ['/signin', '/signup', '/signout', '/forgot-password', '/reset-password'];
  
  // Check if the path starts with any of the auth paths
  return authPaths.some(authPath => 
    path === authPath || path.startsWith(`${authPath}/`) || path.startsWith(`${authPath}?`)
  );
}
