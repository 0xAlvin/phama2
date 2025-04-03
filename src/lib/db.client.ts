/**
 * This is a client-side placeholder for the server-side DB module.
 * It exists to prevent 'net' module errors in the browser.
 */

import { createClient } from '@supabase/supabase-js';

// If needed, create a supabase client for browser-side data access
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Export a dummy db object
export const db = {
  query: {
    prescriptions: {
      findMany: async () => {
        throw new Error('Direct DB queries are not supported in the browser');
      },
      findFirst: async () => {
        throw new Error('Direct DB queries are not supported in the browser');
      }
    }
  }
};
