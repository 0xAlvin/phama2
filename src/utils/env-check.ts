/**
 * Utility functions to check environment configuration
 */

export function checkRequiredEnvVars() {
  const requiredVars = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    // Add other required env vars here
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    return {
      success: false,
      missing
    };
  }
  
  return {
    success: true
  };
}

export function logEnvInfo() {
  // Safe to log in development only
  if (process.env.NODE_ENV === 'development') {
    console.log('Environment:', process.env.NODE_ENV);
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
    // Don't log secrets, just check if they exist
    console.log('NEXTAUTH_SECRET defined:', !!process.env.NEXTAUTH_SECRET);
  }
}
