import { saltAndHashPassword, verifyPassword } from '../lib/utils/password';

const knownHash = "aefc27ff3232cdfc3283d6f3e63bbaff8d7bc066b503a2daa4a733159b43df0d";
const password = "Password123!";

async function compareHashes() {
  console.log("=== Password Hash Comparison ===");
  console.log(`Testing password: "${password}"`);
  console.log(`Known hash: ${knownHash}`);
  
  try {
    // Check if the known hash verifies with our password
    console.log("\nTesting if known hash verifies with the password...");
    const isValid = await verifyPassword(password, knownHash);
    console.log(`Verification result: ${isValid ? "MATCH ✓" : "NO MATCH ✗"}`);
    
    // Generate a new hash with our password hashing function
    console.log("\nGenerating new hash with current password function...");
    if (!process.env.PASSWORD_SALT) {
      console.log("Warning: PASSWORD_SALT not set in environment");
      console.log("If the existing hash was created with a specific salt, verification may fail");
    }
    
    const newHash = await saltAndHashPassword(password);
    console.log(`New hash: ${newHash}`);
    
    // Compare the two hashes
    console.log("\nComparing hashes directly:");
    console.log(`Match: ${newHash === knownHash ? "YES ✓" : "NO ✗"}`);
    
    // If hashes don't match, try to determine why
    if (newHash !== knownHash) {
      console.log("\nPossible reasons for hash mismatch:");
      console.log("1. Different salt values used");
      console.log("2. Different hashing algorithms or parameters");
      console.log("3. Password has changed");
      
      // Show hash format differences
      console.log("\nHash format comparison:");
      console.log(`Known hash length: ${knownHash.length} characters`);
      console.log(`New hash length: ${newHash.length} characters`);
    }
    
    console.log("\nTrying a manual verification with our verification function...");
    const manualVerify = await verifyPassword(password, knownHash);
    console.log(`Manual verification result: ${manualVerify ? "SUCCESS ✓" : "FAILED ✗"}`);
    
  } catch (error) {
    console.error("Error during hash comparison:", error);
  }
}

compareHashes().then(() => {
  console.log("\nHash comparison completed.");
  process.exit(0);
}).catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
