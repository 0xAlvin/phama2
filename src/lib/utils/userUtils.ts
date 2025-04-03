import { db } from '@/lib/db';
import { patients, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/**
 * Verifies a user exists in the database
 */
export async function verifyUserExists(userId: string): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true }
    });
    
    return !!user;
  } catch (error) {
    console.error('Error verifying user existence:', error);
    return false;
  }
}

/**
 * Creates a basic patient profile from a user ID and email
 */
export async function createPatientProfileFromEmail(
  userId: string, 
  email: string,
  phoneNumber = '0000000000'
) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  // First verify the user exists in the database
  const userExists = await verifyUserExists(userId);
  if (!userExists) {
    console.error(`User ID ${userId} does not exist in the database. Cannot create patient profile.`);
    throw new Error(`User with ID ${userId} does not exist in the database. The session may be out of sync.`);
  }
  
  // Extract name from email if available
  const emailName = email?.split('@')?.[0] || 'user';
  const formattedName = emailName
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
  
  const nameParts = formattedName.split(' ');
  const firstName = nameParts[0] || 'New';
  const lastName = nameParts.length > 1 ? nameParts[1] : 'Patient';
  
  console.log(`Creating patient profile for ${userId} with name: ${firstName} ${lastName}`);
  
  try {
    // Let Drizzle handle the UUID generation - remove manual ID generation
    const [patient] = await db.insert(patients).values({
      userId,
      firstName,
      lastName,
      dateOfBirth: new Date('2000-01-01'),
      phone: phoneNumber,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    return patient;
  } catch (error) {
    console.error('Failed to create patient profile:', error);
    
    // Check for specific foreign key violation
    if ((error as any)?.code === '23503' && 
        (error as any)?.constraint_name === 'patients_user_id_users_id_fk') {
      throw new Error('Failed to create patient profile: User record not found. Please try logging out and back in.');
    }
    
    throw error;
  }
}

/**
 * Gets an existing patient profile or creates a new one
 */
export async function getOrCreatePatientProfile(userId: string, email: string, phoneNumber?: string) {
  try {
    // Try to find existing patient
    const existingPatient = await db.query.patients.findFirst({
      where: eq(patients.userId, userId)
    });
    
    if (existingPatient) {
      return existingPatient;
    }
    
    // Verify the user exists before attempting to create a patient
    const userExists = await verifyUserExists(userId);
    if (!userExists) {
      console.error(`User ID ${userId} not found in database but has active session. Potential sync issue.`);
      throw new Error('User record not found in database. Please try logging out and back in.');
    }
    
    // Create new patient if not found
    return await createPatientProfileFromEmail(userId, email, phoneNumber);
  } catch (error) {
    console.error('Error in getOrCreatePatientProfile:', error);
    throw error;
  }
}
