import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Update connection details as needed
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client);

const main = async () => {
  try {
    console.log('Starting migration: Making prescription dates optional');
    
    // Alter the prescriptions table to make issueDate and expiryDate nullable
    await db.execute(sql`
      ALTER TABLE "prescriptions" 
      ALTER COLUMN "issue_date" DROP NOT NULL,
      ALTER COLUMN "expiry_date" DROP NOT NULL;
    `);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
};

main();
