import { useRef, useState } from 'react';
import MetaballBackground from './MetaballBackground/MetaballBackground';
import './App.css';

function App() {
  const bgRef = useRef();
  const [size, setSize] = useState({ width: '100%', height: '100%' });

  const handleTransition = () => {
    bgRef.current?.setSpeed(0.3); // slow down
    setTimeout(() => {
      bgRef.current?.setSpeed(1.0); // back to normal
    }, 2000);
  };

  // Example: Resize functionality
  const handleResize = () => {
    setSize(prev => ({
      width: prev.width === '100%' ? '800px' : '100%',
      height: prev.height === '100%' ? '600px' : '100%'
    }));
  };

  return (
    <div className="app-container">
      <MetaballBackground
        ref={bgRef}
        color1="#00bfff"
        color2="#a855f7"
        speed={3.5}
        metaballCount={4}
        minSize={80}
        maxSize={250}
        threshold={2.2}
        showDebugPanel={true}
        width={size.width}
        height={size.height}
      />
      {/* Example resize button - you can remove this */}
      <button 
        onClick={handleResize}
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          padding: '10px 20px',
          zIndex: 1000
        }}
      >
        Toggle Size
      </button>
    </div>
  );
}

export default App;

