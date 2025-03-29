import { saltAndHashPassword, verifyPassword } from './password';

/**
 * Utility to test the password hashing and verification
 */
async function testPasswordUtils() {
  try {
    console.log("Testing password utilities...");
    
    // Set a test salt if none exists
    if (!process.env.PASSWORD_SALT) {
      console.log("No PASSWORD_SALT in environment, using default development salt");
      process.env.PASSWORD_SALT = 'default-salt-for-development';
    }
    
    // Test with a sample password
    const password = "Password123!";
    console.log(`\nTesting with password: "${password}"`);
    
    // Generate a hash
    console.log("\nGenerating hash...");
    const hash = await saltAndHashPassword(password);
    console.log(`Hash result: ${hash}`);
    
    // Verify using the same password
    console.log("\nVerifying with correct password...");
    const correctResult = await verifyPassword(password, hash);
    console.log(`Verification result: ${correctResult ? "SUCCESS" : "FAILED"}`);
    
    // Verify using a wrong password
    const wrongPassword = "WrongPassword123!";
    console.log(`\nVerifying with wrong password: "${wrongPassword}"...`);
    const wrongResult = await verifyPassword(wrongPassword, hash);
    console.log(`Verification result: ${wrongResult ? "INCORRECTLY SUCCEEDED" : "CORRECTLY FAILED"}`);
    
    console.log("\nPassword utility tests completed.");
  } catch (error) {
    console.error("Error during password tests:", error);
  }
}

// Run the test
testPasswordUtils().then(() => {
  console.log("Test completed.");
  process.exit(0);
}).catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
