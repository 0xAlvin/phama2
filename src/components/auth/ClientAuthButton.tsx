"use client";

import Button from '@/components/ui/button/Button';
import { signIn, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

interface ClientAuthButtonProps {
  isAuthenticated: boolean;
  onClick?: () => void;
  className?: string;
}

export default function ClientAuthButton({ 
  isAuthenticated, 
  onClick, 
  className 
}: ClientAuthButtonProps) {
  const pathname = usePathname();
  
  const handleSignIn = async () => {
    // Check if current path is an auth page to avoid redirection loops
    const isAuthPage = pathname.startsWith('/signin') || 
                      pathname.startsWith('/signup') || 
                      pathname.startsWith('/signout');
    
    // Use dashboard as default if on auth page, otherwise use current path
    const callbackUrl = isAuthPage ? '/dashboard' : pathname;
    
    try {
      await signIn(undefined, { callbackUrl });
      if (onClick) onClick();
    } catch (error) {
      console.error("Error during sign in:", error);
    }
  };
  
  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' });
      if (onClick) onClick();
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };
  
  return (
    <Button 
      onClick={isAuthenticated ? handleSignOut : handleSignIn} 
      className={className}
    >
      {isAuthenticated ? 'Sign Out' : 'Sign In'}
    </Button>
  );
}
