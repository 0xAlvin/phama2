export default function LayoutTest() {
  return (
    <div style={{ 
      padding: '10px',
      margin: '10px',
      background: '#ffffe0',
      border: '1px solid #e0e000',
      borderRadius: '4px'
    }}>
      <h3>Layout Test Component</h3>
      <p>Testing if layout components render correctly</p>
      <pre style={{ background: '#f0f0f0', padding: '8px', fontSize: '12px' }}>
        {JSON.stringify({
          'next.js': process.env.NEXT_RUNTIME || 'client',
          'node_env': process.env.NODE_ENV
        }, null, 2)}
      </pre>
    </div>
  );
}
