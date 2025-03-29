import { saltAndHashPassword, verifyPassword } from './password';

/**
 * Checks if a password matches a known hash and also compares with
 * a newly generated hash to verify consistency
 */
export async function checkPasswordHash(password: string, knownHash: string): Promise<{
  matches: boolean;
  newHashMatches: boolean;
  newHash: string;
}> {
  try {
    // Check if the known hash verifies with our password
    const isValid = await verifyPassword(password, knownHash);
    
    // Generate a new hash with our password hashing function
    const newHash = await saltAndHashPassword(password);
    
    // Compare the two hashes
    const newHashMatches = newHash === knownHash;
    
    return {
      matches: isValid,
      newHashMatches,
      newHash
    };
  } catch (error) {
    console.error("Error checking hash:", error);
    throw error;
  }
}
