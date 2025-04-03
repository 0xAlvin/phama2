import { useSession } from 'next-auth/react';
import { User, UserRole, UserRoles } from '../models/User';
import { useMemo } from 'react';

export interface UserRoleData {
  isPatient: boolean;
  isPharmacy: boolean;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  profileImage?: string | null;
  debug?: { 
    sessionUser: any;
    rawSession: any;
  };
}

export function useUserRole(): UserRoleData {
  const { data: session, status } = useSession();

  return useMemo(() => {
    const isLoading = status === 'loading';
    const isAuthenticated = status === 'authenticated';
    
    // Store the raw session user for debugging
    const sessionUser = session?.user;
    
    // Extract role and other user properties
    const role = (sessionUser as {
      id: string;
      rememberMe?: boolean;
      profileUrl?: string | null;
      image?: string | null;
      profileImage?: string | null;
      role?: string;
    } & User)?.role as UserRole || null;
    
    // Try to get profile image from various possible properties
    // Order of precedence: image, profileUrl, profileImage
    const profileImage = sessionUser?.image || 
                         sessionUser?.profileUrl || 
                         (sessionUser as any)?.profileImage ||
                         null;

    // Add console logging to debug user role detection
    console.log("User role from session:", role);
    
    const isPatient = role === UserRoles.PATIENT;
    const isPharmacy = role === UserRoles.PHARMACY;
    const isPharmacyStaff = role === UserRoles.PHARMACY_STAFF;
    const isAdmin = role === UserRoles.ADMIN;

    console.log("Role detection:", { isPatient, isPharmacy, isPharmacyStaff, isAdmin });
    
    return {
      isPatient,
      isPharmacy,
      role,
      isAuthenticated,
      isLoading,
      profileImage,
      debug: {
        sessionUser,
        rawSession: session
      }
    };
  }, [session, status]);
}
