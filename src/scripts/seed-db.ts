import { seedDatabase } from "../lib/db/seed";
import { db } from "@/lib/db";

async function main() {
  try {
    console.log("Starting database seeding process...");
    
    // Check if database is accessible before running seed
    try {
      // Simple database connectivity check
      const testQuery = await db.execute(sql`SELECT 1`);
      console.log("Database connection successful");
    } catch (dbError) {
      console.error("Failed to connect to database:", dbError);
      console.error("Please check your database configuration before seeding");
      process.exit(1);
    }
    
    // Run the actual seeding operation
    await seedDatabase();
    
    console.log("Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during database seeding:", error);
    process.exit(1);
  }
}

// Import needed for the SQL template literal
import { sql } from "drizzle-orm";

main();
