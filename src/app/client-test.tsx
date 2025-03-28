'use client';

import { useEffect, useState } from 'react';

export default function ClientTest() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('Client component mounted');
  }, []);

  return (
    <div style={{ padding: '20px', border: '2px solid blue', margin: '20px', background: '#f0f8ff' }}>
      <h2>Client Component Test</h2>
      <p>Client-side rendering: {mounted ? 'Working ✅' : 'Not yet mounted'}</p>
    </div>
  );
}
