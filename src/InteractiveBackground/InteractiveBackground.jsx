import { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import MetaballBackground from '../MetaballBackground/MetaballBackground';
import { ParticleSystem, ParticleControls } from '../ParticleSystem';
import './InteractiveBackground.css';

const InteractiveBackground = forwardRef(({
  // Metaball props
  color1 = '#00bfff',
  color2 = '#a855f7',
  speed = 3.5,
  metaballCount = 4,
  minSize = 80,
  maxSize = 250,
  threshold = 2.2,
  showDebugPanel = false,
  // Particle props
  showParticleControls = true,
  particleConfig: initialParticleConfig = {
    particleCount: 50,
    minSize: 7,
    maxSize: 30,
    riseSpeed: 7.8,
    turbulence: 1.95,
    burstDuration: 5.0,
    spawnWidth: 230,
    fadeOutDuration: 1.5
  },
  // Size props
  width,
  height
}, ref) => {
  const metaballRef = useRef();
  const particleSystemRef = useRef();
  const [particleConfig, setParticleConfig] = useState(initialParticleConfig);

  // Expose both metaball and particle methods
  useImperativeHandle(ref, () => ({
    // Metaball methods
    setSpeed: (newSpeed) => {
      metaballRef.current?.setSpeed(newSpeed);
    },
    pause: () => {
      metaballRef.current?.pause();
    },
    resume: () => {
      metaballRef.current?.resume();
    },
    updateColors: (c1, c2) => {
      metaballRef.current?.updateColors(c1, c2);
    },
    // Particle methods
    triggerBurst: (x, y) => {
      particleSystemRef.current?.triggerBurst(x, y);
    }
  }));

  const handleClick = (e) => {
    const x = e.clientX;
    const y = e.clientY;
    particleSystemRef.current?.triggerBurst(x, y);
  };

  return (
    <div 
      className="interactive-background-container"
      onClick={handleClick}
      style={{
        width: width || '100%',
        height: height || '100%',
        cursor: 'pointer'
      }}
    >
      <MetaballBackground
        ref={metaballRef}
        color1={color1}
        color2={color2}
        speed={speed}
        metaballCount={metaballCount}
        minSize={minSize}
        maxSize={maxSize}
        threshold={threshold}
        showDebugPanel={showDebugPanel}
        width="100%"
        height="100%"
      />
      <ParticleSystem
        ref={particleSystemRef}
        {...particleConfig}
      />
      {showParticleControls && (
        <ParticleControls
          config={particleConfig}
          onChange={setParticleConfig}
        />
      )}
    </div>
  );
});

InteractiveBackground.displayName = 'InteractiveBackground';

export default InteractiveBackground;

