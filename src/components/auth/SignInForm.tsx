'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import styles from "@/styles/auth/auth.module.css";

type SignInFormProps = {
  onSignIn?: (email: string, password: string, remember: boolean) => Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }>;
};

export default function SignInForm({ onSignIn }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      if (onSignIn) {
        console.log('🔍 SignInForm - Using parent onSignIn function');
        const result = await onSignIn(email, password, remember);
        
        if (!result.success) {
          setError(result.error || 'An error occurred');
          setIsSubmitting(false);
        }
      } else {
        console.log('🔍 SignInForm - Using direct NextAuth signIn');
        
        // FOR DEBUGGING: Make a test call to the debug API to check session status before auth
        try {
          const debugResponse = await fetch('/api/debug/sessions');
          const debugData = await debugResponse.json();
          console.log('Pre-auth debug data:', debugData);
        } catch (e) {
          console.error('Error fetching debug data:', e);
        }
        
        // Use full page navigation to ensure cookies are properly set
        await signIn('credentials', {
          redirect: true,  // Force the native redirection
          callbackUrl: '/dashboard',
          email,
          password,
          remember: remember.toString(),
        });
        
        // This shouldn't execute due to page navigation
        console.log('This should not log - page should have redirected');
      }
    } catch (err) {
      console.error('🔍 SignInForm - Form submission error:', err);
      setError('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.auth_page}>
      <div className={styles.auth_card}>
        <div className={styles.auth_left}>
          <h1>Welcome back</h1>
          <p>Sign in to your account</p>
        </div>
        
        <div className={styles.auth_right}>
          {error && (
            <div className={styles.form_error}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className={styles.auth_form}>
            <div className={styles.form_group}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.form_control}
                disabled={isLoading || isSubmitting}
                required
              />
            </div>
            
            <div className={styles.form_group}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.form_control}
                disabled={isLoading || isSubmitting}
                required
              />
            </div>
            
            <div className={styles.form_options}>
              <label className={styles.checkbox_container}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  disabled={isLoading || isSubmitting}
                />
                Remember me
              </label>
              
              <a href="/forgot-password" className={styles.forgot_link}>
                Forgot password?
              </a>
            </div>
            
            <button 
              type="submit" 
              className={styles.btn_submit}
              disabled={isLoading || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner}></span>
                  Signing in...
                </>
              ) : 'Sign in'}
            </button>
            
            <div className={styles.auth_links}>
              Don't have an account?{' '}
              <a href="/signup">
                Sign up
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}