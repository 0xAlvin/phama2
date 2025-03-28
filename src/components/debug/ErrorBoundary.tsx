'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div style={{ 
          padding: '20px', 
          margin: '20px',
          backgroundColor: '#fff0f0',
          border: '1px solid #ffcccc',
          borderRadius: '5px'
        }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap', margin: '10px 0' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Show error details
            </summary>
            <p style={{ 
              padding: '10px', 
              backgroundColor: '#f8f8f8', 
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}>
              {this.state.error?.toString()}
            </p>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
