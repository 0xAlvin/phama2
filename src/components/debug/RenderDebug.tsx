'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface RenderDebugProps {
  id?: string;
  showDetails?: boolean;
}

export default function RenderDebug({ id = 'default', showDetails = true }: RenderDebugProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [clientSide, setClientSide] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  
  useEffect(() => {
    setClientSide(true);
    setRenderCount(prev => prev + 1);
    
    console.log(`[RenderDebug:${id}] Component mounted on path: ${pathname}`);
    console.log(`[RenderDebug:${id}] Auth status: ${status}, Session:`, session);
    
    return () => {
      console.log(`[RenderDebug:${id}] Component unmounted`);
    };
  }, [id, pathname, session, status]);

  if (!showDetails) {
    return <div data-debug-id={id} style={{ display: 'none' }}></div>;
  }

  return (
    <div 
      data-debug-id={id}
      style={{
        margin: '10px',
        padding: '10px',
        border: '1px dashed red',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace',
        backgroundColor: 'rgba(255,200,200,0.2)'
      }}
    >
      <h4 style={{ margin: '0 0 8px 0' }}>Render Debug: {id}</h4>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        <li>Path: {pathname}</li>
        <li>Auth Status: {status}</li>
        <li>Client Hydrated: {clientSide ? 'Yes' : 'No'}</li>
        <li>Render Count: {renderCount}</li>
        <li>User: {session?.user?.email || 'Not logged in'}</li>
      </ul>
    </div>
  );
}
