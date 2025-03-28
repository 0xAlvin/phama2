import { RegisterUserData } from "@/types/authTypes";
import { db } from "../db";
import { User, UserRoles } from "../models/User";
import { addresses, patients, patientProfiles, pharmacies, pharmacyProfiles, pharmacyStaff, users } from "../schema";
import { saltAndHashPassword } from "../utils/password";
import { eq, sql } from "drizzle-orm";
import { PharmacyStaffRoles } from "../models/PharmacyStaff";

// Custom error class for UserRepo operations
export class UserRepoError extends Error {
    code: string;
    
    constructor(message: string, code: string) {
        super(message);
        this.code = code;
        this.name = 'UserRepoError';
    }
}

/**
 * Utility function to retry a database operation with exponential backoff
 * @param operation Function to retry
 * @param maxRetries Maximum number of retries
 * @param initialDelay Initial delay in ms
 */
async function retryOperation<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 3, 
    initialDelay: number = 300
): Promise<T> {
    let lastError: Error | null = null;
    let delay = initialDelay;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            console.log(`Operation failed, retrying (${attempt + 1}/${maxRetries})...`, error);
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Increase delay for next attempt (exponential backoff)
            delay *= 2;
        }
    }
    
    throw lastError || new Error('Operation failed after multiple retries');
}

export class UserRepo {
    // Add new method to check if a license number exists
    static async licenseNumberExists(licenseNumber: string): Promise<boolean> {
        try {
            console.log(`Checking if license number exists: ${licenseNumber}`);
            const result = await db.select({ count: sql<number>`count(*)` })
                .from(pharmacies)
                .where(eq(pharmacies.licenseNumber, licenseNumber.trim()));
            
            const exists = result[0].count > 0;
            console.log(`License check result: ${exists ? 'exists' : 'does not exist'}`);
            return exists;
        } catch (error) {
            console.error("Error checking license number:", error);
            // In case of error, assume it might exist to be safe
            return false;
        }
    }

    // Add method to list all license numbers for debugging
    static async listAllLicenseNumbers(): Promise<string[]> {
        try {
            const result = await db.select({ licenseNumber: pharmacies.licenseNumber }).from(pharmacies);
            return result.map(r => r.licenseNumber);
        } catch (error) {
            console.error("Error fetching license numbers:", error);
            return [];
        }
    }

    static async createUserByRole(data: RegisterUserData) {
        if (data.role !== UserRoles.PATIENT && data.role !== UserRoles.PHARMACY) {
            throw new UserRepoError('Invalid role', 'invalid_role');
        }

        // Skip pre-checking existence and handle it through SQL constraints
        // This avoids potential connection issues when doing multiple queries
        const hashedPassword = await saltAndHashPassword(data.password);

        if (data.role === UserRoles.PHARMACY) {
            try {
                // Validate pharmacy-specific fields
                if (!data.pharmacyName || data.pharmacyName.trim() === '') {
                    throw new UserRepoError("Pharmacy name is required", 'validation_error');
                }
                
                if (!data.licenseNumber || data.licenseNumber.trim() === '') {
                    throw new UserRepoError("License number is required", 'validation_error');
                }
                
                if (!data.phoneNumber || data.phoneNumber.trim() === '') {
                    throw new UserRepoError("Phone number is required", 'validation_error');
                }

                // Check if license already exists before attempting to create
                const licenseExists = await this.licenseNumberExists(data.licenseNumber);
                if (licenseExists) {
                    let licenseNum = data.licenseNumber || "unknown";
                    throw new UserRepoError(`License number ${licenseNum} is already registered. Please use a different license number.`, 'license_exists');
                }

                // List all existing license numbers for debugging
                const allLicenses = await this.listAllLicenseNumbers();
                console.log("All existing license numbers:", allLicenses);
                
                // Log the license number being used for registration
                console.log(`Attempting to register with license number: ${data.licenseNumber}`);
                
                // Create user with retry mechanism
                const newUser = await retryOperation(async () => {
                    const result = await db.insert(users).values({
                        email: data.email,
                        passwordHash: hashedPassword,
                        role: data.role
                    }).onConflictDoNothing().returning();
                    
                    if (!result.length || !result[0]) {
                        throw new UserRepoError("User creation failed. Email may already be in use.", 'user_exists');
                    }
                    
                    return result[0];
                });
                
                try {
                    // Ensure phone number is properly formatted (remove any non-digit characters if needed)
                    const formattedPhone = data.phoneNumber.replace(/\D/g, '');
                    
                    // Create pharmacy with retry mechanism
                    const pharmacyId = await retryOperation(async () => {
                        console.log(`Creating pharmacy with license: ${(data.licenseNumber || '').trim()}`);
                        const result = await db.insert(pharmacies).values({
                            userId: newUser.id!,
                            name: (data.pharmacyName || '').trim(),
                            licenseNumber: (data.licenseNumber || '').trim(),
                            phone: formattedPhone || "0000000000",
                            email: data.email,
                        }).returning({ id: pharmacies.id });
                        
                        if (!result.length || !result[0]) {
                            throw new UserRepoError("Failed to create pharmacy record", 'pharmacy_creation_failed');
                        }
                        
                        return result[0];
                    });
                    
                    try {
                        // 3. Create pharmacy profile
                        const profileResult = await db.insert(pharmacyProfiles).values({
                            pharmacyId: pharmacyId.id,
                        }).returning();
                        
                        if (!profileResult.length) {
                            // Rollback: delete both pharmacy and user
                            await db.delete(pharmacies).where(eq(pharmacies.id, pharmacyId.id));
                            await db.delete(users).where(eq(users.id, newUser.id!));
                            throw new UserRepoError("Failed to create pharmacy profile", 'pharmacy_profile_creation_failed');
                        }
                        
                        return newUser;
                    } catch (profileError) {
                        // Rollback: delete pharmacy but not user in case of profile creation error
                        await db.delete(pharmacies).where(eq(pharmacies.id, pharmacyId.id));
                        await db.delete(users).where(eq(users.id, newUser.id!));
                        throw profileError;
                    }
                } catch (pharmacyError) {
                    console.error("Pharmacy creation error details:", pharmacyError);
                    // Rollback: delete the user in case of pharmacy creation error
                    await db.delete(users).where(eq(users.id, newUser.id!));
                    if (pharmacyError instanceof UserRepoError) {
                        throw pharmacyError;
                    }
                    // Check for specific database constraint violations
                    const errorMsg = (pharmacyError as any).message || '';
                    const errorDetail = (pharmacyError as any).detail || '';
                    const errorConstraint = (pharmacyError as any).constraint || '';
                    
                    // Check for license number unique constraint violation
                    if (errorConstraint === 'pharmacies_license_number_unique' || 
                        (errorDetail && errorDetail.includes('license_number') && errorDetail.includes('already exists'))) {
                        throw new UserRepoError("This license number is already registered. Please use a different license number.", 'license_exists');
                    }
                    
                    if (errorMsg.includes('not-null constraint') || 
                        errorDetail.includes('null value') || 
                        errorMsg.includes('violates not-null constraint')) {
                        // Identify which field is causing the issue
                        let fieldName = "unknown";
                        if (errorMsg.includes('phone') || errorDetail.includes('phone')) {
                            fieldName = "phone number";
                        } else if (errorMsg.includes('name') || errorDetail.includes('name')) {
                            fieldName = "pharmacy name";
                        } else if (errorMsg.includes('license') || errorDetail.includes('license')) {
                            fieldName = "license number";
                        }
                        
                        throw new UserRepoError(`Please provide a valid ${fieldName}`, 'validation_error');
                    }
                    
                    // Check for duplicate key violations more generally
                    if (errorMsg.includes('duplicate key') || errorMsg.includes('unique constraint')) {
                        // Try to extract the specific field from the error
                        let field = "value";
                        if (errorDetail) {
                            if (errorDetail.includes('license_number')) {
                                field = "license number";
                            } else if (errorDetail.includes('email')) {
                                field = "email";
                            } else if (errorDetail.includes('phone')) {
                                field = "phone number";
                            }
                        }
                        
                        throw new UserRepoError(`This ${field} is already registered. Please use a different ${field}.`, 'duplicate_value');
                    }
                    
                    throw new UserRepoError("Failed to create pharmacy. Please check your information and try again.", 'pharmacy_creation_failed');
                }
            } catch (error) {
                console.error("Error creating pharmacy user:", error);
                if (error instanceof UserRepoError) {
                    throw error;
                }
                // Check for common database errors
                const errorMsg = (error as Error).message || '';
                const errorDetail = (error as any)?.detail || '';
                if (errorMsg.includes('duplicate key') || errorMsg.includes('unique constraint')) {
                    if (errorDetail && errorDetail.includes('license_number')) {
                        throw new UserRepoError("This license number is already registered", 'license_exists');
                    } else if (errorDetail && errorDetail.includes('email')) {
                        throw new UserRepoError("This email is already registered", 'user_exists');
                    } else {
                        throw new UserRepoError("This information is already registered", 'duplicate_value');
                    }
                }
                throw new UserRepoError("Failed to register pharmacy. Please try again.", 'pharmacy_registration_failed');
            }
        }
        // Validate patient-specific fields
        if (data.role === UserRoles.PATIENT) {
            try {
                // Validate patient-specific fields
                if (!data.firstName || data.firstName.trim() === '') {
                    throw new UserRepoError("First name is required", 'validation_error');
                }
                
                if (!data.lastName || data.lastName.trim() === '') {
                    throw new UserRepoError("Last name is required", 'validation_error');
                }
                
                // Date of birth is now optional
                // if (!data.dateOfBirth) {
                //     throw new UserRepoError("Date of birth is required", 'validation_error');
                // }
                
                if (!data.phoneNumber || data.phoneNumber.trim() === '') {
                    throw new UserRepoError("Phone number is required", 'validation_error');
                }
                
                // Create user with retry mechanism
                const user = await retryOperation(async () => {
                    const result = await db.insert(users).values({
                        email: data.email,
                        passwordHash: hashedPassword,
                        role: data.role
                    }).onConflictDoNothing().returning();
                    
                    if (!result.length || !result[0]) {
                        throw new UserRepoError("User creation failed. Email may already be in use.", 'user_exists');
                    }
                    
                    return result[0];
                });
                
                try {
                    // Format phone number
                    const formattedPhone = data.phoneNumber.replace(/\D/g, '');
                     
                    // Create a default date of birth if none provided (01/01/2000)
                    const dateOfBirth = data.dateOfBirth 
                        ? new Date(data.dateOfBirth).toISOString() 
                        : new Date(2000, 0, 1).toISOString(); // Default to Jan 1, 2000
                    
                    // Create patient with retry mechanism
                    const patientResult = await retryOperation(async () => {
                        const result = await db.insert(patients).values({
                            userId: user.id!,
                            firstName: data.firstName?.trim() || '',
                            lastName: data.lastName?.trim() || '',
                            dateOfBirth: dateOfBirth, // Use default date instead of null
                            phone: formattedPhone || "0000000000", // Fallback to a default if empty after formatting
                        }).returning({ id: patients.id });
                        
                        if (!result.length || !result[0]) {
                            throw new UserRepoError("Failed to create patient record", 'patient_creation_failed');
                        }
                        
                        return result[0];
                    });
                    
                    try {
                        // Create patient profile with retry
                        await retryOperation(async () => {
                            const result = await db.insert(patientProfiles).values({
                                patientId: patientResult.id,
                                allergies: data.allergies || null,
                                medicalConditions: data.medicalConditions || null,
                                medications: data.medications || null,
                            }).returning();
                            
                            if (!result.length) {
                                throw new UserRepoError("Failed to create patient profile", 'patient_profile_creation_failed');
                            }
                            
                            return result[0];
                        });
                        
                        // 4. Create default address (if provided)
                        if (data.address) {
                            try {
                                await retryOperation(async () => {
                                    return await db.insert(addresses).values({
                                        userId: user.id!,
                                        streetAddress: data.address?.streetAddress || "",
                                        city: data.address?.city || "",
                                        state: data.address?.state || "",
                                        zipCode: data.address?.zipCode || "",
                                        country: data.address?.country || "",
                                        isDefault: true,
                                    }).returning();
                                });
                            } catch (addressError) {
                                console.error("Address creation error:", addressError);
                                // We'll continue even if address creation fails
                                // The patient can add addresses later   
                            }
                        }
                        
                        return user;
                    } catch (profileError) {
                        console.error("Patient profile creation error:", profileError);
                        // Rollback: delete patient record and user in case of profile creation error
                        await db.delete(patients).where(eq(patients.id, patientResult.id));
                        await db.delete(users).where(eq(users.id, user.id!));
                        throw new UserRepoError("Failed to create patient profile", 'patient_profile_creation_failed');
                    }
                } catch (patientError) {
                    console.error("Patient creation error details:", patientError);
                    // Rollback: delete the user in case of patient creation error
                    await db.delete(users).where(eq(users.id, user.id!));
                    if (patientError instanceof UserRepoError) {
                        throw patientError;
                    }
                    
                    throw new UserRepoError("Failed to create patient. Please check your information and try again.", 'patient_creation_failed');
                }
            } catch (error) {
                console.error("Database insert error:", error);
                if (error instanceof UserRepoError) {
                    throw error;
                }
                // Check for common database errors
                const errorMsg = (error as Error).message || '';
                if (errorMsg.includes('duplicate key') || errorMsg.includes('unique constraint')) {
                    throw new UserRepoError("This email is already registered", 'user_exists');
                }
                throw new UserRepoError("Failed to create user. Please try again.", 'user_creation_failed');
            }
        }
        return null;
    }

    static async getPharmacyByEmail(email: string) {
        try {
            const result = await db.select().from(pharmacies).where(eq(pharmacies.email, email));
            return result[0] || null;
        } catch (error) {
            console.error("Error fetching pharmacy by email:", error);
            // Return null instead of throwing to make the function more resilient
            return null;
        }
    }

    static async getUserByEmail(email: string) {
        try {
            const result = await db.select().from(users).where(eq(users.email, email));
            return result[0] || null;
        } catch (error) {
            console.error("Error fetching user by email:", error);
            // Return null instead of throwing to make the function more resilient
            return null;
        }
    }
}
