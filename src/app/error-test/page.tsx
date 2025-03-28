'use client';

import { useState } from 'react';
import ErrorBoundary from '@/components/debug/ErrorBoundary';

function BrokenComponent() {
  // This will cause an error
  const [counter, setCounter] = useState(0);
  
  // Deliberately cause an error when clicked
  const causeError = () => {
    throw new Error("This is a deliberate error for testing");
  };

  return (
    <div style={{ padding: '15px', border: '1px dashed red', marginTop: '20px' }}>
      <h3>Potentially Broken Component</h3>
      <p>Counter: {counter}</p>
      <button onClick={() => setCounter(counter + 1)} style={{ marginRight: '10px' }}>
        Increment (Safe)
      </button>
      <button onClick={causeError} style={{ backgroundColor: 'red', color: 'white' }}>
        Break Component
      </button>
    </div>
  );
}

function WorkingComponent() {
  const [message, setMessage] = useState("I'm working fine");
  
  return (
    <div style={{ padding: '15px', border: '1px solid green', marginTop: '20px' }}>
      <h3>Working Component</h3>
      <p>{message}</p>
      <button onClick={() => setMessage("Still working fine - " + new Date().toLocaleTimeString())}>
        Update Message
      </button>
    </div>
  );
}

export default function ErrorTestPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Error Testing Page</h1>
      <p>This page tests error handling in components.</p>
      
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
      
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    </div>
  );
}
