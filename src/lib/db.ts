// /home/oden/dev/phama2/lib/utils/db.ts

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@/lib/schema";

// Get database url from environment
console.log("Connecting to database:", process.env.DATABASE_URL!);
// Create drizzle instance with schema
export const db =  drizzle(neon(process.env.DATABASE_URL!||"postgres://neondb_owner:npg_CFDIU52QXKxh@ep-curly-hall-a5so94ep-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"), { schema });

