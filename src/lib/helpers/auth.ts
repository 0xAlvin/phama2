'use server';
import { auth, signIn as authSignIn, signOut } from "@/lib/auth";
import { RegisterUserData } from "@/types/authTypes";
import { AuthError } from "next-auth";

export async function signInHandler(email: string, password: string, remember: boolean = false, callbackUrl?: string) {
  try {
    // Validate input
    if (!email || !email.includes('@')) {
      return { 
        success: false, 
        error: "Please enter a valid email address" 
      };
    }

    if (!password || password.length < 6) {
      return { 
        success: false, 
        error: "Password must be at least 6 characters" 
      };
    }
    
    // Attempt sign in
    const result = await authSignIn('credentials', { 
      email, 
      password,
      remember: remember.toString(), // Convert to string as credentials expect string values
      redirect: false, // Prevent automatic redirect
      callbackUrl // Pass the callbackUrl if provided
    });
    
    if (result?.error) {
      return { 
        success: false, 
        error: result.error 
      };
    }
    
    return { 
      success: true,
      url: callbackUrl || '/dashboard' // Return the callback URL for redirection
    };
  } catch (error) {
    if (error instanceof AuthError) {
      // Specific NextAuth error handling
      switch(error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Invalid credentials. Please check your email and password." };
        case "AccessDenied":
          return { success: false, error: "Access denied. You don't have permission to sign in." };
        case "OAuthAccountNotLinked":
          return { success: false, error: "Email already in use with another provider." };
        default:
          return { success: false, error: "Authentication failed. Please try again." };
      }
    }
    
    // Log unexpected errors server-side
    console.error("Sign-in error:", error);
    return { 
      success: false, 
      error: "An unexpected error occurred. Please try again later." 
    };
  }
}

export async function signOutHelper() {
  try {
    // Pass redirect:true and redirectTo to navigate after logout
    await signOut({ redirect: true, redirectTo: "/signin" });
    return { success: true };
  } catch (error) {
    console.error("Sign-out error:", error);
    return { success: false };
  }
}


export async function getServerSideProps() {
  return {
    props: {
      session: await auth(),
    },
  };
}

export async function signUpHelper(userData: RegisterUserData) {
  try {
    // Validate input
    if (!userData.email || !userData.email.includes('@')) {
      return {
        success: false,
        error: "Please enter a valid email address",
        code: 'validation_error'
      };
    }

    if (!userData.password || userData.password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters",
        code: 'validation_error'
      };
    }

    // Use a configurable API base URL
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        
        // Map specific error codes from UserRepo and UserService
        const errorCodeMappings: Record<string, {message: string, code: string}> = {
          'user_exists': {
            message: "A user with this email already exists. Please use a different email or sign in.",
            code: 'user_exists'
          },
          'pharmacy_exists': {
            message: "A pharmacy with this email already exists. Please use a different email or sign in.",
            code: 'user_exists'
          },
          'db_error': {
            message: "We're experiencing database issues. Please try again later.",
            code: 'service_error'
          },
          'user_creation_failed': {
            message: "Could not create your account. This email may already be in use.",
            code: 'user_exists'
          },
          'pharmacy_creation_failed': {
            message: "Could not create the pharmacy account. Please check your information.",
            code: 'registration_error'
          },
          'pharmacy_profile_creation_failed': {
            message: "Your account was created but there was an issue with your pharmacy profile. Please contact support.",
            code: 'partial_success'
          },
          'pharmacy_registration_failed': {
            message: "There was a problem registering your pharmacy. Please try again.",
            code: 'pharmacy_registration_error'
          },
          'invalid_role': {
            message: "Invalid account type selected. Please select Patient or Pharmacy.",
            code: 'validation_error'
          },
          'invalid_input': {
            message: "Please check your information and try again.",
            code: 'validation_error'
          },
          'verification_error': {
            message: "Could not verify account information. Please try again later.",
            code: 'service_error'
          }
        };
        
        // If we have a specific error code mapping, use it
        if (errorData.code && errorCodeMappings[errorData.code]) {
          const mappedError = errorCodeMappings[errorData.code];
          return {
            success: false,
            error: mappedError.message,
            code: mappedError.code
          };
        }
        
        // Generic error handling for remaining cases
        if (errorData.error && errorData.error.toLowerCase().includes('exists')) {
          return {
            success: false,
            error: "This email is already registered. Please use a different email or sign in.",
            code: 'user_exists'
          };
        }
      } catch {
        errorData = { error: "An unexpected error occurred." };
      }
      
      // Handle specific HTTP status codes
      if (response.status === 409) {
        return {
          success: false,
          error: "A user with this email already exists.",
          code: 'user_exists'
        };
      }
      
      // Handle service unavailable errors
      if (response.status === 503 || response.status === 500) {
        return {
          success: false,
          error: "The registration service is temporarily unavailable. Please try again later.",
          code: 'service_unavailable'
        };
      }
      
      return {
        success: false,
        error: errorData.error || "An error occurred during registration. Please try again later.",
        code: errorData.code || 'unknown_error'
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Sign-up error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again later",
      code: 'unexpected_error'
    };
  }
}
