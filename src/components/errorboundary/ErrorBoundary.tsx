// app/components/ErrorBoundary.tsx
'use client';

import { useEffect } from 'react';
import '@/styles/errorboundary/ErrorBoundary.css';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="error-container">
      <div className="error-card">
        <div className="error-animation">
          <svg viewBox="0 0 200 100" className="medicine-line">
            <path className="ecg-line" d="M0,50 L30,50 L40,40 L50,60 L60,40 L70,60 L80,50 L100,50 L110,20 L120,80 L130,50 L200,50" />
            <circle className="pulse-circle" cx="110" cy="20" r="3" />
          </svg>
        </div>
        <div className="error-content">
          <h2>We've encountered an issue</h2>
          <p>Our system experienced an unexpected error. We're working to fix it.</p>
          <p className="error-code">Error Code: {error?.digest || 'Unknown'}</p>
          <p className="error-message">{error?.message || 'An unknown error occurred'}</p>
          <button className="reset-button" onClick={reset}>
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
