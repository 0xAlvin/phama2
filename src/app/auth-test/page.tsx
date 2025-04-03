'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '@/styles/auth/auth.module.css';

export default function AuthTestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password');
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    setLogs((prev) => [`${new Date().toISOString()} - ${message}`, ...prev]);
  };

  useEffect(() => {
    addLog(`Session status: ${status}`);
    addLog(`Session data: ${JSON.stringify(session)}`);
  }, [status, session]);

  const handleSignIn = async () => {
    try {
      addLog(`Attempting sign in with: ${email}`);
      const callbackUrl = '/dashboard';
      
      const result = await signIn('credentials', {
        redirect: false, // For testing, don't redirect immediately
        email,
        password,
        callbackUrl
      });
      
      addLog(`Sign in result: ${JSON.stringify(result)}`);
      
      if (result?.error) {
        addLog(`Error: ${result.error}`);
      } else if (result?.url) {
        addLog(`Success! Redirect URL: ${result.url}`);
        // Direct redirect to ensure it works
        window.location.href = result.url;
      } else {
        addLog("Success but no URL returned, manually redirecting to dashboard");
        window.location.href = "/dashboard";
      }
    } catch (error) {
      addLog(`Error: ${error}`);
    }
  };

  const handleSignOut = async () => {
    try {
      addLog('Signing out...');
      await signOut({ redirect: false });
      addLog('Signed out successfully');
    } catch (error) {
      addLog(`Error signing out: ${error}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Authentication Test</h1>
      <div style={{ marginBottom: '20px' }}>
        <p>Current Status: <strong>{status}</strong></p>
        {session?.user && (
          <div>
            <p>Logged in as: <strong>{session.user.email}</strong></p>
            <p>Role: <strong>{session.user.role || 'N/A'}</strong></p>
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {status === 'unauthenticated' ? (
          <>
            <input 
              type="text" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Email"
              className={styles.form_control}
              style={{ flex: 1 }}
            />
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Password"
              className={styles.form_control}
              style={{ flex: 1 }}
            />
            <button 
              onClick={handleSignIn} 
              className={styles.btn_submit}
            >
              Sign In
            </button>
          </>
        ) : (
          <button 
            onClick={handleSignOut}
            className={styles.btn_submit}
          >
            Sign Out
          </button>
        )}
      </div>
      
      <div>
        <h2>Debug Logs</h2>
        <pre style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '4px',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </pre>
      </div>
    </div>
  );
}
