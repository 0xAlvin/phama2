'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from "@/styles/auth/auth.module.css";

export default function SignInForm({ 
  onSignIn 
}: Readonly<{ 
  onSignIn: (
    email: string, 
    password: string, 
    remember: boolean,
    callbackUrl?: string
  ) => Promise<{
    success: boolean,
    url?: string,
    error?: string
  }> 
}>) {
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
      console.log(`Submitting signin form with callbackUrl: ${callbackUrl}`);
      const result = await onSignIn(email, password, remember, callbackUrl);
      
      if (!result.success) {
        setError(result.error || 'An error occurred');
      }
      // No need to redirect here as it's handled in the parent component
    } catch (err) {
      console.error('Form submission error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rest of the component...
  return (
    <div className={styles.auth_page}>
      <div className={styles.auth_card}>
        <div className={styles.auth_content}>
          <div className={styles.auth_header}>
            <h1 className={styles.heading_text}>Welcome back</h1>
            <p className={styles.subheading_text}>Sign in to your account</p>
          </div>
          
          {error && (
            <div className={styles.error_message}>
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
                <span className={styles.checkmark}></span>
                Remember me
              </label>
              
              <a href="/forgot-password" className={styles.forgot_link}>
                Forgot password?
              </a>
            </div>
            
            <button 
              type="submit" 
              className={styles.submit_button}
              disabled={isLoading || isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
            
            <div className={styles.auth_links}>
              Don't have an account?{' '}
              <a href="/signup" className={styles.auth_link}>
                Sign up
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}