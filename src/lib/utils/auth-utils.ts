/**
 * Authentication utilities to ensure consistent auth behavior across the application
 */

/**
 * Clear all authentication cookies - useful for troubleshooting
 */
export function clearAuthCookies() {
  if (typeof window === 'undefined') return;
  
  // List of possible auth-related cookies to clear
  const cookiesToClear = [
    'next-auth.session-token',
    'next-auth.csrf-token',
    'next-auth.callback-url',
    'authjs.session-token',
    'authjs.csrf-token',
    'authjs.callback-url'
  ];
  
  cookiesToClear.forEach(cookieName => {
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=${window.location.hostname}`;
    // Also try with secure and httpOnly flags
    document.cookie = `${cookieName}=; path=/; secure; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=${window.location.hostname}`;
    // Try with no domain
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  });
  
  console.log('All authentication cookies cleared');
}

/**
 * Check if the user appears to be authenticated client-side
 */
export function hasAuthCookies(): boolean {
  if (typeof window === 'undefined') return false;
  
  const cookies = document.cookie.split(';').map(c => c.trim());
  return cookies.some(cookie => 
    cookie.startsWith('next-auth.session-token=') || 
    cookie.startsWith('authjs.session-token=')
  );
}

/**
 * Debugging function to log all cookies
 */
export function logAllCookies() {
  if (typeof window === 'undefined') return [];
  
  const cookies = document.cookie.split(';').map(c => c.trim());
  console.log('Current cookies:', cookies);
  return cookies;
}

/**
 * Forces a restart of the authentication session
 * This is useful when the cookies are present but not working
 */
export async function resetAuthSession() {
  if (typeof window === 'undefined') return false;
  
  try {
    // Clear existing cookies
    clearAuthCookies();
    
    // Call the auth-fix endpoint to synchronize cookies
    const response = await fetch('/api/debug/auth-fix');
    const result = await response.json();
    
    // Reload the page to apply the changes
    window.location.reload();
    
    return true;
  } catch (error) {
    console.error('Error resetting auth session:', error);
    return false;
  }
}

/**
 * Safe parse JWT without verification - for debugging only
 */
export function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}
