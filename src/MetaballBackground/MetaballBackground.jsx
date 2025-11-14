import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import { hexToRgb } from './utils';
import {
  metaballVertexShader,
  metaballFragmentShader,
  gradientMapFragmentShader,
  backgroundVertexShader,
  backgroundFragmentShader
} from './shaders';
import DebugPanel from './DebugPanel';

const MetaballBackground = forwardRef(({
  color1 = '#00bfff',
  color2 = '#a855f7',
  speed = 3.5,
  metaballCount = 4,
  minSize = 50,
  maxSize = 290,
  threshold = 1.32,
  showDebugPanel = false
}, ref) => {
  const canvasRef = useRef(null);
  
  const [debugProps, setDebugProps] = useState({
    color1,
    color2,
    speed,
    metaballCount,
    minSize,
    maxSize,
    threshold
  });

  const glRef = useRef(null);
  const animationFrameRef = useRef(null);
  const metaballsRef = useRef([]);
  const currentSpeedRef = useRef(debugProps.speed);
  const isPausedRef = useRef(false);
  const lastTimeRef = useRef(0);
  const renderPropsRef = useRef(debugProps);

  // WebGL resources
  const programsRef = useRef({});
  const framebufferRef = useRef(null);
  const textureRef = useRef(null);
  const positionBufferRef = useRef(null);

  // Update render props ref when debug props change
  useEffect(() => {
    // Derive layer colors from debug props
    renderPropsRef.current = {
      backgroundColor1: debugProps.color1,
      backgroundColor2: debugProps.color2,
      metaballColor1: debugProps.color2, // Inverse
      metaballColor2: debugProps.color1, // Inverse
      speed: debugProps.speed,
      metaballCount: debugProps.metaballCount,
      minSize: debugProps.minSize,
      maxSize: debugProps.maxSize,
      threshold: debugProps.threshold
    };
  }, [debugProps]);

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get WebGL context with high-performance preference
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });

    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    glRef.current = gl;

    // Set canvas size
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      const dpr = window.devicePixelRatio || 1;
      const width = 1080;
      const height = 1920;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Helper function to create shader
    const createShader = (gl, type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    // Helper function to create program
    const createProgram = (gl, vertexShader, fragmentShader) => {
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
      }
      return program;
    };

    // Create shader programs
    const metaballVert = createShader(gl, gl.VERTEX_SHADER, metaballVertexShader);
    const metaballFrag = createShader(gl, gl.FRAGMENT_SHADER, metaballFragmentShader);
    const metaballProgram = createProgram(gl, metaballVert, metaballFrag);

    const gradientMapVert = createShader(gl, gl.VERTEX_SHADER, metaballVertexShader);
    const gradientMapFrag = createShader(gl, gl.FRAGMENT_SHADER, gradientMapFragmentShader);
    const gradientMapProgram = createProgram(gl, gradientMapVert, gradientMapFrag);

    const backgroundVert = createShader(gl, gl.VERTEX_SHADER, backgroundVertexShader);
    const backgroundFrag = createShader(gl, gl.FRAGMENT_SHADER, backgroundFragmentShader);
    const backgroundProgram = createProgram(gl, backgroundVert, backgroundFrag);

    if (!metaballProgram || !gradientMapProgram || !backgroundProgram) {
      return;
    }

    programsRef.current = {
      metaball: metaballProgram,
      gradientMap: gradientMapProgram,
      background: backgroundProgram
    };

    // Create quad geometry (full screen)
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    positionBufferRef.current = positionBuffer;

    // Create framebuffer and texture for metaball pass
    const framebuffer = gl.createFramebuffer();
    const texture = gl.createTexture();
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    framebufferRef.current = framebuffer;
    textureRef.current = texture;

    // Initialize metaballs only if empty
    if (metaballsRef.current.length === 0) {
      const props = renderPropsRef.current;
      const metaballs = [];
      for (let i = 0; i < props.metaballCount; i++) {
        metaballs.push({
          x: Math.random(),
          y: Math.random() * 0.5 - 0.1, // Start lower on screen
          vx: (Math.random() - 0.5) * 0.0002,
          vy: Math.random() * 0.0003 + 0.0001, // Upward bias
          radius: Math.random() * (props.maxSize - props.minSize) + props.minSize,
          phase: Math.random() * Math.PI * 2
        });
      }
      metaballsRef.current = metaballs;
    }

    // Update metaball positions
    const updateMetaballs = (deltaTime) => {
      const metaballs = metaballsRef.current;
      const speed = currentSpeedRef.current;
      const time = performance.now() * 0.001 * speed;

      metaballs.forEach((ball) => {
        // Organic motion using sine/cosine
        ball.x += Math.sin(time * 0.5 + ball.phase) * 0.0001 * speed;
        ball.y += ball.vy * speed;
        
        // Wrap around edges smoothly
        if (ball.x < -0.1) {
          ball.x = 1.1;
        } else if (ball.x > 1.1) {
          ball.x = -0.1;
        }
        
        // Smooth wrap at bottom - keep x position and radius to avoid jumps
        if (ball.y > 1.1) {
          ball.y = -0.1;
          // Keep the same x position to maintain continuity
          // Only randomize if it's way off screen
          if (ball.x < -0.2 || ball.x > 1.2) {
            ball.x = Math.random();
          }
          // Keep the same radius to avoid size jumps
          // The radius will naturally vary as balls move and merge
        }
      });
    };

      // Render function
      const render = (currentTime) => {
        if (isPausedRef.current) {
          animationFrameRef.current = requestAnimationFrame(render);
          return;
        }

        const deltaTime = currentTime - lastTimeRef.current;
        lastTimeRef.current = currentTime;

        updateMetaballs(deltaTime);

        const metaballs = metaballsRef.current;
        const width = canvas.width;
        const height = canvas.height;
        const props = renderPropsRef.current;

        // Prepare metaball data array
        const metaballData = new Float32Array(12);
        metaballs.forEach((ball, i) => {
          if (i < 4) {
            metaballData[i * 3] = ball.x * width;
            metaballData[i * 3 + 1] = ball.y * height;
            metaballData[i * 3 + 2] = ball.radius;
          }
        });

        // PASS 1: Render metaballs to texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.viewport(0, 0, width, height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const metaballProgram = programsRef.current.metaball;
        gl.useProgram(metaballProgram);

        // Set up attributes
        const positionLoc = gl.getAttribLocation(metaballProgram, 'a_position');
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

        // Set uniforms
        gl.uniform2f(gl.getUniformLocation(metaballProgram, 'u_resolution'), width, height);
        gl.uniform1fv(gl.getUniformLocation(metaballProgram, 'u_metaballs'), metaballData);
        gl.uniform1i(gl.getUniformLocation(metaballProgram, 'u_metaballCount'), Math.min(props.metaballCount, 4));
        gl.uniform1f(gl.getUniformLocation(metaballProgram, 'u_threshold'), props.threshold);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // PASS 2: Render to screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, width, height);

        // Draw background gradient
        const backgroundProgram = programsRef.current.background;
        gl.useProgram(backgroundProgram);

        const bgPositionLoc = gl.getAttribLocation(backgroundProgram, 'a_position');
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(bgPositionLoc);
        gl.vertexAttribPointer(bgPositionLoc, 2, gl.FLOAT, false, 0, 0);

        const bgColor1 = hexToRgb(props.backgroundColor1);
        const bgColor2 = hexToRgb(props.backgroundColor2);
        if (bgColor1 && bgColor2) {
          gl.uniform3f(gl.getUniformLocation(backgroundProgram, 'u_color1'), bgColor1.r, bgColor1.g, bgColor1.b);
          gl.uniform3f(gl.getUniformLocation(backgroundProgram, 'u_color2'), bgColor2.r, bgColor2.g, bgColor2.b);
        }

        gl.disable(gl.BLEND);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Draw metaballs with gradient overlay
        const gradientMapProgram = programsRef.current.gradientMap;
        gl.useProgram(gradientMapProgram);

        const gmPositionLoc = gl.getAttribLocation(gradientMapProgram, 'a_position');
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(gmPositionLoc);
        gl.vertexAttribPointer(gmPositionLoc, 2, gl.FLOAT, false, 0, 0);

        const mbColor1 = hexToRgb(props.metaballColor1);
        const mbColor2 = hexToRgb(props.metaballColor2);
        if (mbColor1 && mbColor2) {
          gl.uniform3f(gl.getUniformLocation(gradientMapProgram, 'u_color1'), mbColor1.r, mbColor1.g, mbColor1.b);
          gl.uniform3f(gl.getUniformLocation(gradientMapProgram, 'u_color2'), mbColor2.r, mbColor2.g, mbColor2.b);
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(gl.getUniformLocation(gradientMapProgram, 'u_texture'), 0);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        animationFrameRef.current = requestAnimationFrame(render);
      };

    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(render);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Clean up WebGL resources
      if (framebuffer) gl.deleteFramebuffer(framebuffer);
      if (texture) gl.deleteTexture(texture);
      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (metaballProgram) gl.deleteProgram(metaballProgram);
      if (gradientMapProgram) gl.deleteProgram(gradientMapProgram);
      if (backgroundProgram) gl.deleteProgram(backgroundProgram);
    };
  }, []); // Only run once for WebGL setup

  // Handle metaball count changes gracefully
  useEffect(() => {
    const currentCount = metaballsRef.current.length;
    const targetCount = debugProps.metaballCount;
    const props = renderPropsRef.current;

    if (currentCount < targetCount) {
      // Add new metaballs - spawn them off-screen at the bottom for smooth entry
      for (let i = currentCount; i < targetCount; i++) {
        metaballsRef.current.push({
          x: Math.random(),
          y: -0.2 + Math.random() * 0.1, // Start below screen for smooth entry
          vx: (Math.random() - 0.5) * 0.0002,
          vy: Math.random() * 0.0003 + 0.0001, // Upward bias
          radius: Math.random() * (props.maxSize - props.minSize) + props.minSize,
          phase: Math.random() * Math.PI * 2
        });
      }
    } else if (currentCount > targetCount) {
      // Remove excess metaballs - prefer removing ones that are off-screen
      const visible = metaballsRef.current.filter(ball => ball.y >= -0.1 && ball.y <= 1.1);
      const offScreen = metaballsRef.current.filter(ball => ball.y < -0.1 || ball.y > 1.1);
      
      // Keep visible ones, then add off-screen ones until we reach target
      const toKeep = Math.min(targetCount, visible.length);
      const remaining = targetCount - toKeep;
      
      metaballsRef.current = [
        ...visible.slice(0, toKeep),
        ...offScreen.slice(0, remaining)
      ];
      
      // If we still have too many, remove from end
      if (metaballsRef.current.length > targetCount) {
        metaballsRef.current = metaballsRef.current.slice(0, targetCount);
      }
    }
  }, [debugProps.metaballCount]);

  // Adjust metaball sizes smoothly when min/max size changes
  useEffect(() => {
    const props = renderPropsRef.current;
    metaballsRef.current.forEach((ball) => {
      // Clamp existing radius to new range
      if (ball.radius < props.minSize) {
        ball.radius = props.minSize;
      } else if (ball.radius > props.maxSize) {
        ball.radius = props.maxSize;
      }
      // Optionally: smoothly adjust radius towards new range
      // For now, just clamp to avoid sudden jumps
    });
  }, [debugProps.minSize, debugProps.maxSize]);

  // Update speed when prop changes
  useEffect(() => {
    currentSpeedRef.current = debugProps.speed;
  }, [debugProps.speed]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    setSpeed: (newSpeed) => {
      currentSpeedRef.current = newSpeed;
      setDebugProps(prev => ({ ...prev, speed: newSpeed }));
    },
    pause: () => {
      isPausedRef.current = true;
    },
    resume: () => {
      isPausedRef.current = false;
      lastTimeRef.current = performance.now();
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
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      />
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

