export function VideoScripts() {
  return (
    <div style={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#fff',
      zIndex: 1000,
      padding: '20px'
    }}>
      <h1>DIRECT TEST - NO PARENT CONTAINERS</h1>
      
      <button 
        onClick={() => {
          console.log('DIRECT BUTTON CLICKED!');
          alert('Direct button works!');
        }}
        style={{
          padding: '20px',
          fontSize: '18px',
          backgroundColor: '#ff0000',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          margin: '20px 0'
        }}
      >
        CLICK ME - DIRECT TEST
      </button>

      <div style={{
        height: '300px',
        overflow: 'auto',
        border: '2px solid #000',
        backgroundColor: '#f0f0f0',
        padding: '10px'
      }}>
        <h2>SCROLL TEST AREA</h2>
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} style={{ 
            padding: '10px', 
            backgroundColor: '#ddd', 
            margin: '5px 0',
            border: '1px solid #999'
          }}>
            Block {i + 1} - This is scroll test content
          </div>
        ))}
      </div>
    </div>
  );
}