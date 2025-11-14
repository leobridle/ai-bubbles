import { useRef, useEffect, useImperativeHandle, forwardRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { hexToRgb } from './utils';
import {
  metaballVertexShader,
  metaballFragmentShader,
  gradientMapFragmentShader,
  backgroundVertexShader,
  backgroundFragmentShader
} from './shaders';
import DebugPanel from './DebugPanel';

// Background gradient mesh
const BackgroundMesh = ({ color1, color2 }) => {
  const { viewport } = useThree();
  const uniforms = useMemo(() => {
    const bgColor1 = hexToRgb(color1);
    const bgColor2 = hexToRgb(color2);
    return {
      u_color1: { value: bgColor1 ? new THREE.Vector3(bgColor1.r, bgColor1.g, bgColor1.b) : new THREE.Vector3(0, 0.75, 1) },
      u_color2: { value: bgColor2 ? new THREE.Vector3(bgColor2.r, bgColor2.g, bgColor2.b) : new THREE.Vector3(0.66, 0.33, 1) }
    };
  }, [color1, color2]);

  useEffect(() => {
    const bgColor1 = hexToRgb(color1);
    const bgColor2 = hexToRgb(color2);
    if (bgColor1 && bgColor2) {
      uniforms.u_color1.value.set(bgColor1.r, bgColor1.g, bgColor1.b);
      uniforms.u_color2.value.set(bgColor2.r, bgColor2.g, bgColor2.b);
    }
  }, [color1, color2, uniforms]);

  return (
    <mesh position={[0, 0, 0]} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={backgroundVertexShader}
        fragmentShader={backgroundFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
};

// Metaball pass - renders to texture using a separate scene
const MetaballPass = ({ metaballsRef, resolution, threshold, metaballCount, renderTarget }) => {
  const { gl, size } = useThree();
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef(new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1));
  const meshRef = useRef();
  
  const uniformsRef = useRef({
    u_resolution: { value: new THREE.Vector2() },
    u_metaballs: { value: new Float32Array(30) },
    u_metaballCount: { value: 0 },
    u_threshold: { value: 1.0 }
  });

  // Create the metaball mesh once
  useEffect(() => {
    const material = new THREE.ShaderMaterial({
      vertexShader: metaballVertexShader,
      fragmentShader: metaballFragmentShader,
      uniforms: uniformsRef.current
    });
    
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    meshRef.current = mesh;
    sceneRef.current.add(mesh);
    
    return () => {
      geometry.dispose();
      material.dispose();
      sceneRef.current.remove(mesh);
    };
  }, []);

  // Render to texture each frame
  useFrame(() => {
    if (!meshRef.current || !renderTarget || !resolution) return;

    // Update uniforms
    uniformsRef.current.u_resolution.value.copy(resolution);
    uniformsRef.current.u_metaballCount.value = metaballCount;
    uniformsRef.current.u_threshold.value = threshold;

    // Prepare metaball data
    const metaballs = metaballsRef.current;
    const metaballData = new Float32Array(30);
    if (metaballs && metaballs.length > 0) {
      metaballs.forEach((ball, i) => {
        if (i < 10 && ball) {
          metaballData[i * 3] = ball.x * resolution.x;
          metaballData[i * 3 + 1] = ball.y * resolution.y;
          metaballData[i * 3 + 2] = ball.radius;
        }
      });
    }
    uniformsRef.current.u_metaballs.value = metaballData;

    // Render to render target
    const currentRT = gl.getRenderTarget();
    gl.setRenderTarget(renderTarget);
    gl.clear(true, true, true);
    gl.render(sceneRef.current, cameraRef.current);
    gl.setRenderTarget(currentRT);
  });

  return null;
};

// Gradient map overlay mesh
const GradientMapMesh = ({ color1, color2, renderTarget }) => {
  const uniformsRef = useRef({
    u_texture: { value: renderTarget?.texture || null },
    u_color1: { value: new THREE.Vector3(0.66, 0.33, 1) },
    u_color2: { value: new THREE.Vector3(0, 0.75, 1) }
  });

  useEffect(() => {
    if (renderTarget && renderTarget.texture) {
      uniformsRef.current.u_texture.value = renderTarget.texture;
    }
  }, [renderTarget]);

  // Update texture every frame to ensure it's always current
  useFrame(() => {
    if (renderTarget && renderTarget.texture && uniformsRef.current.u_texture.value !== renderTarget.texture) {
      uniformsRef.current.u_texture.value = renderTarget.texture;
    }
  });

  useEffect(() => {
    const mbColor1 = hexToRgb(color2);
    const mbColor2 = hexToRgb(color1);
    if (mbColor1 && mbColor2) {
      uniformsRef.current.u_color1.value.set(mbColor1.r, mbColor1.g, mbColor1.b);
      uniformsRef.current.u_color2.value.set(mbColor2.r, mbColor2.g, mbColor2.b);
    }
  }, [color1, color2]);

  const { viewport } = useThree();
  
  return (
    <mesh position={[0, 0, 0.1]} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={metaballVertexShader}
        fragmentShader={gradientMapFragmentShader}
        uniforms={uniformsRef.current}
        transparent={true}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
};

// Component that manages the metaball scene
const MetaballScene = ({
  color1,
  color2,
  speed,
  metaballCount,
  minSize,
  maxSize,
  threshold,
  isPaused
}) => {
  const { size } = useThree();
  const metaballsRef = useRef([]);
  const currentSpeedRef = useRef(speed);
  const lastTimeRef = useRef(0);
  const timeRef = useRef(0);

  // Create render target for metaball pass
  const renderTarget = useMemo(() => {
    const rt = new THREE.WebGLRenderTarget(size.width, size.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType
    });
    return rt;
  }, [size.width, size.height]);

  // Cleanup render target when it changes or component unmounts
  useEffect(() => {
    return () => {
      if (renderTarget) {
        renderTarget.dispose();
      }
    };
  }, [renderTarget]);

  // Initialize metaballs
  useEffect(() => {
    if (metaballsRef.current.length === 0) {
      const metaballs = [];
      for (let i = 0; i < metaballCount; i++) {
        metaballs.push({
          x: Math.random(),
          y: Math.random() * 0.5 - 0.1,
          vx: (Math.random() - 0.5) * 0.0002,
          vy: Math.random() * 0.0003 + 0.0001,
          radius: Math.random() * (maxSize - minSize) + minSize,
          phase: Math.random() * Math.PI * 2
        });
      }
      metaballsRef.current = metaballs;
    }
  }, [metaballCount, minSize, maxSize]);

  // Handle metaball count changes
  useEffect(() => {
    const currentCount = metaballsRef.current.length;
    const targetCount = metaballCount;

    if (currentCount < targetCount) {
      for (let i = currentCount; i < targetCount; i++) {
        metaballsRef.current.push({
          x: Math.random(),
          y: -0.2 + Math.random() * 0.1,
          vx: (Math.random() - 0.5) * 0.0002,
          vy: Math.random() * 0.0003 + 0.0001,
          radius: Math.random() * (maxSize - minSize) + minSize,
          phase: Math.random() * Math.PI * 2
        });
      }
    } else if (currentCount > targetCount) {
      const maxRadiusNormalized = (maxSize / size.height);
      const bufferZone = maxRadiusNormalized * 3;
      const visible = metaballsRef.current.filter(ball => ball.y >= -bufferZone && ball.y <= 1.0 + bufferZone);
      const offScreen = metaballsRef.current.filter(ball => ball.y < -bufferZone || ball.y > 1.0 + bufferZone);
      
      const toKeep = Math.min(targetCount, visible.length);
      const remaining = targetCount - toKeep;
      
      metaballsRef.current = [
        ...visible.slice(0, toKeep),
        ...offScreen.slice(0, remaining)
      ];
      
      if (metaballsRef.current.length > targetCount) {
        metaballsRef.current = metaballsRef.current.slice(0, targetCount);
      }
    }
  }, [metaballCount, maxSize, minSize, size.height]);

  // Update speed ref
  useEffect(() => {
    currentSpeedRef.current = speed;
  }, [speed]);

  // Update metaball sizes
  useEffect(() => {
    metaballsRef.current.forEach((ball) => {
      if (ball.radius < minSize) {
        ball.radius = minSize;
      } else if (ball.radius > maxSize) {
        ball.radius = maxSize;
      }
    });
  }, [minSize, maxSize]);

  // Animation loop
  useFrame((state) => {
    if (isPaused) return;

    const currentTime = state.clock.elapsedTime;
    lastTimeRef.current = currentTime;
    timeRef.current = currentTime * currentSpeedRef.current;

    const metaballs = metaballsRef.current;
    const maxRadiusNormalized = (maxSize / size.height);
    const bufferZone = maxRadiusNormalized * 2;
    const wrapTop = 1.0 + bufferZone;
    const wrapBottom = -bufferZone;

    // Update metaball positions
    metaballs.forEach((ball) => {
      ball.x += Math.sin(timeRef.current * 0.5 + ball.phase) * 0.0001 * currentSpeedRef.current;
      ball.y += ball.vy * currentSpeedRef.current;
      
      if (ball.x < -0.1) {
        ball.x = 1.1;
      } else if (ball.x > 1.1) {
        ball.x = -0.1;
      }
      
      if (ball.y > wrapTop) {
        ball.y = wrapBottom;
        if (ball.x < -0.2 || ball.x > 1.2) {
          ball.x = Math.random();
        }
      }
    });
  });

  const resolution = useMemo(() => new THREE.Vector2(size.width, size.height), [size.width, size.height]);

  return (
    <>
      <BackgroundMesh color1={color1} color2={color2} />
      <MetaballPass
        metaballsRef={metaballsRef}
        resolution={resolution}
        threshold={threshold}
        metaballCount={metaballCount}
        renderTarget={renderTarget}
      />
      <GradientMapMesh color1={color1} color2={color2} renderTarget={renderTarget} />
    </>
  );
};

// Main component
const MetaballBackground = forwardRef(({
  color1 = '#00bfff',
  color2 = '#a855f7',
  speed = 3.5,
  metaballCount = 4,
  minSize = 80,
  maxSize = 250,
  threshold = 2.2,
  showDebugPanel = false,
  width,
  height
}, ref) => {
  const [debugProps, setDebugProps] = useState({
    color1,
    color2,
    speed,
    metaballCount,
    minSize,
    maxSize,
    threshold
  });

  const [isPaused, setIsPaused] = useState(false);

  // Update debug props when props change
  useEffect(() => {
    setDebugProps({
      color1,
      color2,
      speed,
      metaballCount,
      minSize,
      maxSize,
      threshold
    });
  }, [color1, color2, speed, metaballCount, minSize, maxSize, threshold]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    setSpeed: (newSpeed) => {
      setDebugProps(prev => ({ ...prev, speed: newSpeed }));
    },
    pause: () => {
      setIsPaused(true);
    },
    resume: () => {
      setIsPaused(false);
    },
    updateColors: (c1, c2) => {
      setDebugProps(prev => ({
        ...prev,
        color1: c1,
        color2: c2
      }));
    }
  }));

  const handleDebugChange = (newProps) => {
    setDebugProps(newProps);
  };

  return (
    <div style={{ position: 'relative', width: width || '100%', height: height || '100%' }}>
      <Canvas
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', display: 'block' }}
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1, near: 0.1, far: 1000 }}
        dpr={window.devicePixelRatio || 1}
      >
        <MetaballScene
          color1={debugProps.color1}
          color2={debugProps.color2}
          speed={debugProps.speed}
          metaballCount={debugProps.metaballCount}
          minSize={debugProps.minSize}
          maxSize={debugProps.maxSize}
          threshold={debugProps.threshold}
          isPaused={isPaused}
        />
      </Canvas>
      {showDebugPanel && (
        <DebugPanel
          {...debugProps}
          onChange={handleDebugChange}
        />
      )}
    </div>
  );
});

MetaballBackground.displayName = 'MetaballBackground';

export default MetaballBackground;
