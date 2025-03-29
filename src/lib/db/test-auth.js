require('ts-node').register();
require('tsconfig-paths').register();

const { db } = require('@/lib/db');
const { users } = require('@/lib/schema');
const { eq } = require('drizzle-orm');
const { verifyPassword, saltAndHashPassword } = require('@/lib/utils/password');

// Check and print environment variables related to database connection
function checkEnvironment() {
  console.log("=== Environment Check ===");
  // Print database URL (with password masked)
  const dbUrl = process.env.DATABASE_URL || 'not set';
  const maskedUrl = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, '//[$1]:***@');
  console.log(`DATABASE_URL: ${maskedUrl}`);
  
  // Check for other relevant environment variables
  const nodeEnv = process.env.NODE_ENV || 'not set';
  console.log(`NODE_ENV: ${nodeEnv}`);
  
  // Check if running in development mode
  console.log(`Running in development mode: ${process.env.NODE_ENV === 'development'}`);
  console.log("========================");
}

async function testDatabaseConnection() {
  console.log("Testing database connection...");
  try {
    // Simple query to test connectivity
    const result = await db.select({ count: sql`count(*)` }).from(users);
    console.log(`Database connection successful! Found ${result[0]?.count || 0} users.`);
    return true;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    console.log("\nPossible reasons for connection failure:");
    console.log("1. Invalid database credentials or URL");
    console.log("2. Network connectivity issues or firewall blocking access");
    console.log("3. Database server is down or unreachable");
    console.log("4. Neon database requires SSL connection (check sslmode=require in connection URL)");
    return false;
  }
}

async function testAuthentication() {
  try {
    // Check if we can connect to the database first
    const connected = await testDatabaseConnection();
    if (!connected) {
      console.log("\nSkipping authentication tests due to database connection failure.");
      return;
    }
    
    console.log("\nTesting user authentication...");
    
    // Get a user from the database
    const testUser = await db.query.users.findFirst({
      where: eq(users.email, "patient1@example.com")
    });
    
    if (!testUser) {
      console.error("Test user not found. Has the database been seeded?");
      
      // Try to list some users to see what's available
      const someUsers = await db.select({ email: users.email }).from(users).limit(5);
      if (someUsers.length > 0) {
        console.log("\nAvailable users in database:");
        someUsers.forEach(user => console.log(`- ${user.email}`));
        
        // Test with the first available user instead
        if (someUsers[0]) {
          console.log(`\nTrying authentication with first available user: ${someUsers[0].email}`);
          await testUserAuth(someUsers[0].email);
        }
      } else {
        console.log("No users found in database. Database may be empty.");
      }
      return;
    }
    
    await testUserAuth("patient1@example.com");
    
  } catch (error) {
    console.error("Authentication testing error:", error);
  }
}

async function testUserAuth(email) {
  try {
    const testUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    });
    
    if (!testUser) {
      console.error(`User ${email} not found`);
      return;
    }
    
    console.log(`Testing auth for ${email}...`);
    console.log(`User record found: ${!!testUser}`);
    
    // Test with correct password
    const correctPassword = "Password123!";
    
    // Use the verifyPassword function from your authentication system
    const isValid = await verifyPassword(correctPassword, testUser.passwordHash);
    console.log(`Authentication with correct password: ${isValid ? 'SUCCESS' : 'FAILED'}`);
    
    // Test with incorrect password
    const incorrectPassword = "WrongPassword123!";
    const isInvalidPassword = await verifyPassword(incorrectPassword, testUser.passwordHash);
    console.log(`Authentication with incorrect password: ${isInvalidPassword ? 'INCORRECTLY SUCCEEDED' : 'CORRECTLY FAILED'}`);
    
    // Generate a new hash with the expected password to compare formats
    console.log("\nGenerating new hash with 'Password123!' for comparison:");
    const newHash = await saltAndHashPassword("Password123!");
    console.log(`New hash format: ${newHash.substring(0, 20)}...`);
    console.log(`DB hash format: ${testUser.passwordHash.substring(0, 20)}...`);
    
    // Check if the password field matches expected patterns
    if (!testUser.passwordHash || testUser.passwordHash.length < 10) {
      console.error("Warning: Password hash in database appears to be invalid or malformed.");
    }
  } catch (error) {
    console.error(`Error testing authentication for ${email}:`, error);
  }
}

// Run the test
checkEnvironment();
testAuthentication().then(() => {
  console.log("\nAuthentication test completed");
  process.exit(0);
}).catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
