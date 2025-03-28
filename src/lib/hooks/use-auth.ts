'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const logout = async () => {
    setIsLoading(true);
    try {
      // Use NextAuth's signOut function
      await signOut({ callbackUrl: '/' });
      
      // Note: NextAuth's signOut handles the redirect automatically
      // so we don't need to use router.push anymore
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
    }
  };

  return {
    logout,
    isLoading,
  };
}
