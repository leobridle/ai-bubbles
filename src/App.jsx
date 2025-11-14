import { useRef } from 'react';
import MetaballBackground from './MetaballBackground/MetaballBackground';
import './App.css';

function App() {
  const bgRef = useRef();

  const handleTransition = () => {
    bgRef.current?.setSpeed(0.3); // slow down
    setTimeout(() => {
      bgRef.current?.setSpeed(1.0); // back to normal
    }, 2000);
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
      />
    </div>
  );
}

export default App;

