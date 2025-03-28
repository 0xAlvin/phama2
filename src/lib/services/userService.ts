import { UserRepo, UserRepoError } from "@/lib/repo/UserRepo";
import { verifyPassword } from "@/lib/utils/password";
import { RegisterUserData } from "@/types/authTypes";
import { PatientProfileRepo } from "@/lib/repo/PatientProfileRepo";
import { PharmacyProfileRepo } from "@/lib/repo/PharmacyProfileRepo";

type User = 'PATIENT' | 'PHARMACY';

class UserServiceError extends Error {
  code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = "UserServiceError";
    this.code = code;
  }
}

class UserService {
  static async createUser(userData: RegisterUserData) {
    try {
      // Create user and handle any errors
      const user = await UserRepo.createUserByRole(userData);
      
      if (!user) {
        throw new UserRepoError("Failed to create user", 'user_creation_failed');
      }
      
      return user;
    } catch (error: unknown) {
      console.error("Raw error from repo:", error);
      
      // Just pass through the original error without modification
      throw error;
    }
  }

  static async verifyUser(email: string, password: string) {
    try {
      // Find user by email
      const user = await UserRepo.getUserByEmail(email);
      
      if (!user) {
        throw new UserServiceError("User not found", "user_not_found");
      }
      
      // Check password
      const passwordValid = await verifyPassword(password, user.passwordHash);
      
      if (!passwordValid) {
        throw new UserServiceError("Invalid password", "invalid_credentials");
      }
      
      // Get user profile if it exists (for profile image)
      let profileUrl = null;
      if (user.role === 'patient') {
        const patientProfile = await PatientProfileRepo.findByUserId(user.id);
        profileUrl = null; // PatientProfile doesn't have photoUrl property
      } else if (user.role === 'pharmacy') {
        const pharmacyProfile = await PharmacyProfileRepo.findByPharmacyId(user.id);
        profileUrl = pharmacyProfile?.description || null;
      }
      
      // Return user data without sensitive information
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        profileUrl: profileUrl,
        name: email.split('@')[0], // Use email prefix as name
      };
    } catch (error) {
      // Re-throw UserServiceErrors directly
      if (error instanceof UserServiceError) {
        throw error;
      }
      // Otherwise wrap in a generic error
      throw new UserServiceError(`Authentication failed: ${(error as Error).message}`, "auth_error");
    }
  }
}

export const createUser = UserService.createUser;
export const verifyUser = UserService.verifyUser;

