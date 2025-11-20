import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

const ParticleSystem = forwardRef(({ 
  particleCount = 50,
  minSize = 7,
  maxSize = 30,
  riseSpeed = 7.8,
  turbulence = 1.95,
  burstDuration = 5.0,
  spawnWidth = 230,
  fadeOutDuration = 1.5
}, ref) => {
  const canvasRef = useRef(null);
  const burstsRef = useRef([]);
  const animationFrameRef = useRef(null);
  const bubbleImageRef = useRef(null);
  const imageLoadedRef = useRef(false);

  // Load bubble image
  useEffect(() => {
    const img = new Image();
    img.src = '/src/Bubble.png';
    img.onload = () => {
      bubbleImageRef.current = img;
      imageLoadedRef.current = true;
    };
    img.onerror = () => {
      console.error('Failed to load Bubble.png');
    };
  }, []);

  // Expose triggerBurst method
  useImperativeHandle(ref, () => ({
    triggerBurst: (x, y) => {
      if (!imageLoadedRef.current) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = x - rect.left;
      
      // Create new burst - spawn in a semi-random tower just off screen
      const particles = [];
      const spawnTowerHeight = 200; // Height of the spawning tower below screen
      
      for (let i = 0; i < particleCount; i++) {
        const size = Math.random() * (maxSize - minSize) + minSize;
        const spawnX = canvasX + (Math.random() - 0.5) * spawnWidth;
        
        // Spawn particles at different heights below the screen
        // with some randomization to create staggered "release from bottle" effect
        const baseY = canvas.height + 20 + (i / particleCount) * spawnTowerHeight;
        const yJitter = (Math.random() - 0.5) * 40;
        
        particles.push({
          x: spawnX,
          y: baseY + yJitter,
          vx: (Math.random() - 0.5) * turbulence * 2,
          vy: -(Math.random() * riseSpeed + riseSpeed * 0.5), // Negative for upward movement
          size: size,
          rotation: Math.random() * Math.PI * 2,
          turbulencePhase: Math.random() * Math.PI * 2,
          age: 0,
          maxAge: burstDuration
        });
      }

      burstsRef.current.push({
        particles,
        startTime: Date.now(),
        duration: burstDuration * 1000
      });
    }
  }));

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let lastTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!imageLoadedRef.current || !bubbleImageRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Update and draw all active bursts
      burstsRef.current = burstsRef.current.filter(burst => {
        const elapsed = now - burst.startTime;
        if (elapsed > burst.duration) {
          return false; // Remove expired bursts
        }

        burst.particles.forEach(particle => {
          // Update position with turbulence
          particle.age += deltaTime;
          particle.x += particle.vx * deltaTime * 60;
          particle.y += particle.vy * deltaTime * 60;
          
          // Add sine wave turbulence
          particle.x += Math.sin(particle.age * 3 + particle.turbulencePhase) * turbulence * 0.5;

          // Draw particle if it's still on screen (or just below to create smooth entry)
          if (particle.y + particle.size > -particle.size && particle.y < canvas.height + particle.size) {
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation);
            
            // Set blend mode first
            ctx.globalCompositeOperation = 'overlay';
            
            // Calculate fade out based on age - keep fully opaque until fade time
            let alpha = 1.0;
            const fadeStartTime = particle.maxAge - fadeOutDuration;
            if (particle.age > fadeStartTime) {
              const fadeProgress = (particle.age - fadeStartTime) / fadeOutDuration;
              alpha = Math.max(0, 1.0 - fadeProgress);
            }
            
            // Only apply alpha for fade out, otherwise keep at 1.0 for strong overlay effect
            ctx.globalAlpha = alpha;
            
            ctx.drawImage(
              bubbleImageRef.current,
              -particle.size / 2,
              -particle.size / 2,
              particle.size,
              particle.size
            );
            ctx.restore();
          }
        });

        return true;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [particleCount, minSize, maxSize, riseSpeed, turbulence, burstDuration, spawnWidth, fadeOutDuration]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10
      }}
    />
  );
});

ParticleSystem.displayName = 'ParticleSystem';

export default ParticleSystem;

