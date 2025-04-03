'use client';

import { useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SignInForm from '@/components/auth/SignInForm';

export default function SignInPage() {
  const { status } = useSession();
  const router = useRouter();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      console.log('SignInPage - User is authenticated, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [status, router]);

  const handleSignIn = async (email: string, password: string, remember: boolean) => {
    try {
      console.log('SignInPage - Signing in with:', { email, remember });
      
      // Use built-in NextAuth redirection
      await signIn('credentials', {
        redirect: true,
        email,
        password,
        remember: remember.toString(),
        callbackUrl: '/dashboard'
      });
      
      // This won't execute because of redirect:true
      return { success: true };
    } catch (error) {
      console.error('SignInPage - Error during sign-in:', error);
      return { success: false, error: 'An error occurred during sign-in' };
    }
  };

  return (
    <div className="signin-page">
      <SignInForm onSignIn={handleSignIn} />
    </div>
  );
}