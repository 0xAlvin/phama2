export default function CssTestPage() {
  // Use inline styles instead of imported CSS
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f0f0',
      padding: '20px'
    }}>
      <h1 style={{
        color: '#333',
        marginBottom: '20px'
      }}>CSS Test Page</h1>
      
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px',
        border: '1px solid #ddd'
      }}>
        <h2 style={{ color: '#444', marginBottom: '10px' }}>Box 1</h2>
        <p style={{ color: '#666' }}>
          This box uses inline styles to ensure it displays properly
          regardless of external CSS issues.
        </p>
      </div>
      
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        border: '1px solid #ddd'
      }}>
        <h2 style={{ color: '#444', marginBottom: '10px' }}>Form Elements</h2>
        
        <input 
          type="text" 
          placeholder="Text input" 
          style={{
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '16px'
          }} 
        />
        
        <button style={{
          padding: '10px 15px',
          backgroundColor: 'blue',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: 'pointer'
        }}>
          Button
        </button>
      </div>
    </div>
  );
}
