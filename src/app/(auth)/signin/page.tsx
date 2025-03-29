'use client';

import { useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import SignInForm from '@/components/auth/SignInForm';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const { status } = useSession();

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push(callbackUrl || '/dashboard');
    }
  }, [status, router, callbackUrl]);

  // Error handling in the URL
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      console.error('Auth error from URL:', error);
    }
  }, [searchParams]);

  const handleSignIn = async (email: string, password: string, remember: boolean) => {
    try {
      // Use NextAuth's signIn method directly
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        remember: remember.toString(),
        callbackUrl
      });
      
      if (result?.error) {
        return { success: false, error: 'Invalid email or password' };
      }
      
      if (result?.url) {
        router.push(result.url);
        return { success: true, url: result.url };
      }
      
      router.push('/dashboard');
      return { success: true };
    } catch (error) {
      console.error('Sign-in error:', error);
      return { success: false, error: 'An error occurred during sign-in' };
    }
  };

  return (
    <div className="signin-page">
      <SignInForm onSignIn={handleSignIn} />
    </div>
  );
}