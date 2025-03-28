import { db } from "@/lib/db";
import { pharmacyProfiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

export class PharmacyProfileRepoError extends Error {
  code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = "PharmacyProfileRepoError";
    this.code = code;
  }
}

export class PharmacyProfileRepo {
  static async findByPharmacyId(pharmacyId: string) {
    try {
      const profile = await db.query.pharmacyProfiles.findFirst({
        where: eq(pharmacyProfiles.pharmacyId, pharmacyId)
      });
      
      return profile;
    } catch (error) {
      console.error("Error finding pharmacy profile by pharmacyId:", error);
      throw new PharmacyProfileRepoError(
        `Failed to find pharmacy profile: ${(error as Error).message}`,
        "pharmacy_profile_not_found"
      );
    }
  }

  static async create(profileData: { pharmacyId: string; description?: string | null; services?: unknown; }) {
    try {
      const result = await db.insert(pharmacyProfiles).values({
        pharmacyId: profileData.pharmacyId,
        description: profileData.description || null,
        services: profileData.services || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      return result[0];
    } catch (error) {
      console.error("Error creating pharmacy profile:", error);
      throw new PharmacyProfileRepoError(
        `Failed to create pharmacy profile: ${(error as Error).message}`,
        "pharmacy_profile_creation_failed"
      );
    }
  }
  static async update(pharmacyId: string, profileData: { logoUrl?: string | null; address?: string | null; phoneNumber?: string | null; operatingHours?: string | null; operationHours?: string | null; license?: string | null; description?: string | null; services?: unknown; }) {
    try {
      const result = await db.update(pharmacyProfiles)
        .set({
          ...profileData,
          updatedAt: new Date()
        })
        .where(eq(pharmacyProfiles.pharmacyId, pharmacyId))
        .returning();
      
      if (!result.length) {
        throw new PharmacyProfileRepoError("Pharmacy profile not found", "pharmacy_profile_not_found");
      }
      
      return result[0];
    } catch (error) {
      console.error("Error updating pharmacy profile:", error);
      throw new PharmacyProfileRepoError(
        `Failed to update pharmacy profile: ${(error as Error).message}`,
        "pharmacy_profile_update_failed"
      );
    }
  }
}
