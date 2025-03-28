'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from "@/styles/auth/auth.module.css";

type SignInResult = {
  success: boolean;
  url?: string;
  error?: string;
};

// Define SignInFormProps without the function prop
type SignInFormProps = {
  // You can keep serializable props here if needed
};

export default function SignInForm({}: SignInFormProps) {
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
      // Replace with direct API call instead of using the function prop
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, remember, callbackUrl }),
      });
      
      const result: SignInResult = await response.json();
      
      if (!result.success) {
        setError(result.error || 'An error occurred');
      } else if (result.url) {
        router.push(result.url);
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError('An unexpected error occurred');
    } finally {
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