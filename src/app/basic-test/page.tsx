export default function BasicTestPage() {
  return (
    <div style={{
      padding: '20px',
      margin: '20px',
      border: '2px solid green',
      borderRadius: '8px',
      fontFamily: 'sans-serif'
    }}>
      <h1>Basic Test Page</h1>
      <p>This is a minimal test page with no dependencies</p>
      <div style={{ 
        marginTop: '20px',
        padding: '10px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '4px' 
      }}>
        Current time: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
