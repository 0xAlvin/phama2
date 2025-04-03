import 'dotenv/config'

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/schema';

const connectionString = process.env.DATABASE_URL!;

// Add this conditional import check
if (typeof window !== 'undefined') {
  throw new Error('This module should only be imported on the server-side');
}

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, { schema, logger: true });
