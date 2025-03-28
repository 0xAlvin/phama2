import { db } from "@/lib/db";
import { patientProfiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

export class PatientProfileRepoError extends Error {
  code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = "PatientProfileRepoError";
    this.code = code;
  }
}

export class PatientProfileRepo {
  static async findByUserId(userId: string) {
    try {
      const profile = await db.query.patientProfiles.findFirst({
        where: eq(patientProfiles.id, userId)
      });
      
      return profile;
    } catch (error) {
      console.error("Error finding patient profile by userId:", error);
      throw new PatientProfileRepoError(
        `Failed to find patient profile: ${(error as Error).message}`,
        "patient_profile_not_found"
      );
    }
  }

  static async create(profileData: { userId: string; photoUrl?: string | null; dateOfBirth?: Date | null; phoneNumber?: string | null; address?: string | null; }) {
    try {
      const result = await db.insert(patientProfiles).values({
        patientId: profileData.userId,
        allergies: null,
        medicalConditions: null,
        medications: null
      }).returning();
      
      return result[0];
    } catch (error) {
      console.error("Error creating patient profile:", error);
      throw new PatientProfileRepoError(
        `Failed to create patient profile: ${(error as Error).message}`,
        "patient_profile_creation_failed"
      );
    }
  }

  static async update(userId: string, profileData: { photoUrl?: string | null; dateOfBirth?: Date | null; phoneNumber?: string | null; address?: string | null; }) {
    try {
      const result = await db.update(patientProfiles)
        .set({
          ...profileData,
          updatedAt: new Date()
        })
        .where(eq(patientProfiles.id, userId))
        .returning();
      
      if (!result.length) {
        throw new PatientProfileRepoError("Patient profile not found", "patient_profile_not_found");
      }
      
      return result[0];
    } catch (error) {
      console.error("Error updating patient profile:", error);
      throw new PatientProfileRepoError(
        `Failed to update patient profile: ${(error as Error).message}`,
        "patient_profile_update_failed"
      );
    }
  }
}
