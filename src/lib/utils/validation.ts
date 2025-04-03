import { db } from '@/lib/db';
import { medications } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/**
 * Validates that medication IDs exist in the database
 * @param medicationIds Array of medication IDs to validate
 * @returns Object with validation result
 */
export async function validateMedicationIds(medicationIds: string[]): Promise<{
  valid: boolean;
  invalidIds: string[];
}> {
  try {
    const results = await Promise.all(
      medicationIds.map(async (id) => {
        const medication = await db.query.medications.findFirst({
          where: eq(medications.id, id),
          columns: { id: true }
        });
        return { id, exists: !!medication };
      })
    );

    const invalidIds = results.filter(r => !r.exists).map(r => r.id);
    return {
      valid: invalidIds.length === 0,
      invalidIds
    };
  } catch (error) {
    console.error("Error validating medication IDs:", error);
    throw new Error(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
