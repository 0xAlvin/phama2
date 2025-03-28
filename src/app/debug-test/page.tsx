import RenderDebug from '@/components/debug/RenderDebug';
import ClientTest from '../client-test';

export default function DebugTestPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Rendering Test Page</h1>
      <p>This page should be accessible without any authentication.</p>
      
      <RenderDebug id="test-page" />
      
      {/* Test client component */}
      <ClientTest />
      
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc' }}>
        <h2>Component Testing Area</h2>
        <p>This section verifies that basic components can render properly.</p>
        
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginTop: '20px'
        }}>
          <button style={{ padding: '10px' }}>Test Button</button>
          <input type="text" placeholder="Test input field" style={{ padding: '10px' }} />
          <select style={{ padding: '10px' }}>
            <option>Test Option 1</option>
            <option>Test Option 2</option>
          </select>
        </div>
      </div>
    </div>
  );
}
