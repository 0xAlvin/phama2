'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import SignInForm from '@/components/auth/SignInForm';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSignIn = async (email: string, password: string, remember: boolean) => {
    console.log(`Attempting signin for ${email} with callbackUrl: ${callbackUrl}`);
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl
      });

      console.log("SignIn result:", result);
      
      if (result?.error) {
        return { success: false, error: 'Invalid email or password' };
      }
      
      if (result?.url) {
        console.log(`Sign-in successful, redirecting to: ${result.url}`);
        router.push(result.url);
        return { success: true, url: result.url };
      }
      
      // Fallback if no URL is returned but sign-in was successful
      console.log('Sign-in successful, redirecting to dashboard');
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