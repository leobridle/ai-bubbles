# WebGL Metaball Lava Lamp Component - Implementation Guide

## Overview
Create a React component that renders an animated metaball "lava lamp" effect using WebGL and GLSL shaders. The component should have two layers: a background gradient and a metaball layer with its own gradient overlay applied via a gradient map shader.

## Technical Specifications

### Canvas Setup
- Target resolution: 1080x1920 (portrait orientation)
- Make responsive but maintain aspect ratio
- Use WebGL context for rendering
- Render at 60fps with requestAnimationFrame

### Component Structure
```
MetaballBackground/
├── MetaballBackground.jsx (main component)
├── shaders.js (GLSL shader code)
└── DebugPanel.jsx (optional debug UI)
```

## Implementation Details

### 1. React Component Setup (MetaballBackground.jsx)

**Component Props:**
```javascript
{
  // Color configuration
  backgroundColor1: '#00bfff', // top background color (cyan/blue)
  backgroundColor2: '#a855f7', // bottom background color (purple)
  metaballColor1: '#a855f7',   // top metaball gradient color (purple)
  metaballColor2: '#00bfff',   // bottom metaball gradient color (cyan/blue)
  
  // Animation parameters
  speed: 1.0,                  // speed multiplier (0.5 = half speed, 2.0 = double speed)
  metaballCount: 3,            // number of metaballs (3-4)
  minSize: 150,                // minimum metaball radius in pixels
  maxSize: 300,                // maximum metaball radius in pixels
  threshold: 0.5,              // metaball merge threshold (0-1)
  
  // Debug
  showDebugPanel: false        // show/hide debug UI
}
```

**Component State:**
- Canvas ref
- WebGL context
- Shader programs
- Animation frame ID
- Metaball array (positions, velocities, sizes)
- Current speed (for external control)

**Exposed Methods via useImperativeHandle:**
```javascript
{
  setSpeed: (newSpeed) => {},
  pause: () => {},
  resume: () => {},
  updateColors: (bg1, bg2, mb1, mb2) => {}
}
```

### 2. Metaball Physics

**Metaball Object Structure:**
```javascript
{
  x: number,        // x position (0-1 normalized)
  y: number,        // y position (0-1 normalized)
  vx: number,       // x velocity
  vy: number,       // y velocity
  radius: number,   // radius in pixels
  phase: number     // animation phase offset
}
```

**Animation Logic:**
- Each metaball moves in a smooth, organic path (use sine/cosine waves)
- Metaballs should drift slowly upward with slight horizontal drift
- Use Perlin-like motion: `x += sin(time * speed + phase) * 0.001`
- Wrap positions at edges (when y > 1.0, reset to y = -0.1)
- Randomize size within minSize-maxSize range on spawn
- Add slight acceleration/deceleration for organic feel

**Initialization:**
- Spawn metaballs at random positions across the canvas
- Give each a random size, velocity, and phase offset
- Ensure they start with upward velocity bias

### 3. WebGL Shader Implementation (shaders.js)

You need TWO rendering passes:

#### Pass 1: Render Metaballs to Grayscale Texture

**Vertex Shader (metaball.vert):**
```glsl
attribute vec2 a_position;
varying vec2 v_texCoord;

void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
```

**Fragment Shader (metaball.frag):**
```glsl
precision highp float;
varying vec2 v_texCoord;

uniform vec2 u_resolution;
uniform float u_metaballs[12]; // x, y, radius for up to 4 metaballs (3 floats each)
uniform int u_metaballCount;
uniform float u_threshold;

void main() {
  vec2 coord = v_texCoord * u_resolution;
  float sum = 0.0;
  
  // Metaball distance field calculation
  for (int i = 0; i < 4; i++) {
    if (i >= u_metaballCount) break;
    
    int idx = i * 3;
    vec2 center = vec2(u_metaballs[idx], u_metaballs[idx + 1]);
    float radius = u_metaballs[idx + 2];
    
    float dist = distance(coord, center);
    // Metaball formula: radius^2 / dist^2
    sum += (radius * radius) / (dist * dist);
  }
  
  // Apply threshold and smoothstep for nice falloff
  float value = smoothstep(u_threshold - 0.1, u_threshold + 0.1, sum);
  
  gl_FragColor = vec4(vec3(value), 1.0);
}
```

#### Pass 2: Apply Gradient Map

**Fragment Shader (gradientmap.frag):**
```glsl
precision highp float;
varying vec2 v_texCoord;

uniform sampler2D u_texture;
uniform vec3 u_color1; // top color (RGB 0-1)
uniform vec3 u_color2; // bottom color (RGB 0-1)

void main() {
  float grayscale = texture2D(u_texture, v_texCoord).r;
  
  // Apply gradient map based on Y position
  float gradientPos = v_texCoord.y;
  vec3 gradientColor = mix(u_color1, u_color2, gradientPos);
  
  // Apply the gradient color based on grayscale intensity
  vec3 finalColor = gradientColor * grayscale;
  
  gl_FragColor = vec4(finalColor, grayscale); // use grayscale as alpha
}
```

### 4. WebGL Rendering Pipeline

**Setup:**
1. Create WebGL context with alpha enabled
2. Create framebuffer and texture for first pass
3. Compile and link both shader programs
4. Create quad geometry (two triangles covering screen)
5. Set up vertex buffers

**Render Loop (each frame):**
```javascript
function render() {
  // Update metaball positions
  updateMetaballs(deltaTime);
  
  // PASS 1: Render metaballs to texture
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.useProgram(metaballProgram);
  gl.uniform2f(resolutionLoc, width, height);
  gl.uniform1fv(metaballsLoc, metaballData); // flat array of x,y,radius
  gl.uniform1i(countLoc, metaballCount);
  gl.uniform1f(thresholdLoc, threshold);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  
  // PASS 2: Render to screen with gradient map
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  
  // Draw background gradient first
  drawBackgroundGradient();
  
  // Draw metaballs with gradient overlay
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.useProgram(gradientMapProgram);
  gl.uniform3f(color1Loc, r1, g1, b1);
  gl.uniform3f(color2Loc, r2, g2, b2);
  gl.bindTexture(gl.TEXTURE_2D, metaballTexture);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  
  requestAnimationFrame(render);
}
```

**Background Gradient Drawing:**
```javascript
function drawBackgroundGradient() {
  // Draw a simple gradient using Canvas 2D on a background canvas,
  // OR create another WebGL shader for the background gradient
  // Gradient goes from backgroundColor1 (top) to backgroundColor2 (bottom)
}
```

### 5. Debug Panel (DebugPanel.jsx)

Create a floating panel with controls:
- Color pickers for all 4 colors
- Sliders for: speed (0.1-3.0), count (2-4), minSize (100-200), maxSize (200-400), threshold (0.3-0.8)
- Pause/Resume button
- "Copy Config" button to export current settings as JSON

**Styling:**
- Position: fixed, top-right corner
- Semi-transparent dark background
- Collapsible (show/hide button)
- Use native HTML inputs styled with Tailwind

### 6. Optimization Considerations

1. **Use Float32Array** for metaball data to reduce GC pressure
2. **Limit uniform updates** - only update when values change
3. **Use texture atlasing** if adding more visual elements later
4. **Power preference**: Request "high-performance" WebGL context
5. **Pixel ratio**: Handle devicePixelRatio for sharp rendering on retina displays

### 7. Color Conversion Utilities

```javascript
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : null;
}
```

## Example Usage

```jsx
import { useRef } from 'react';
import MetaballBackground from './MetaballBackground';

function App() {
  const bgRef = useRef();
  
  const handleTransition = () => {
    bgRef.current?.setSpeed(0.3); // slow down
    setTimeout(() => {
      bgRef.current?.setSpeed(1.0); // back to normal
    }, 2000);
  };
  
  return (
    <div style={{ width: '1080px', height: '1920px', position: 'relative' }}>
      <MetaballBackground
        ref={bgRef}
        backgroundColor1="#00bfff"
        backgroundColor2="#a855f7"
        metaballColor1="#a855f7"
        metaballColor2="#00bfff"
        speed={1.0}
        metaballCount={3}
        minSize={150}
        maxSize={300}
        threshold={0.5}
        showDebugPanel={true}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Your app content */}
      </div>
    </div>
  );
}
```

## Critical Implementation Notes

1. **Framebuffer texture must be power of 2** or use `TEXTURE_WRAP` with `CLAMP_TO_EDGE`
2. **Clear alpha channel** properly in first pass
3. **Blend mode is critical** - use `SRC_ALPHA, ONE_MINUS_SRC_ALPHA` for proper compositing
4. **Metaball formula** is `sum += r²/d²` where r is radius, d is distance
5. **Threshold tuning** - values between 0.4-0.6 work best for 3-4 metaballs
6. **Use smoothstep** on the threshold to avoid hard edges
7. **Normalize coordinates** - shader expects 0-1 space, convert pixel positions appropriately

## File Structure Checklist

- [ ] MetaballBackground.jsx - Main component with WebGL setup
- [ ] shaders.js - All GLSL shader code as strings
- [ ] DebugPanel.jsx - Debug UI component
- [ ] utils.js - Color conversion and helper functions
- [ ] README.md - Usage documentation

## Testing Checklist

- [ ] Renders at correct resolution
- [ ] Metaballs blend smoothly when overlapping
- [ ] Animation is smooth at 60fps
- [ ] Colors update correctly via props
- [ ] Speed control works via ref methods
- [ ] Background gradient displays correctly
- [ ] Metaball gradient displays correctly (inverse direction)
- [ ] Debug panel controls all work
- [ ] No memory leaks (check performance profiler)
- [ ] Cleanup on unmount (cancel animation frame, dispose WebGL resources)

## Common Pitfalls to Avoid

1. Not clearing the framebuffer between frames
2. Forgetting to bind the texture before drawing
3. Using incorrect uniform types (1f vs 1fv)
4. Not handling canvas resize
5. Forgetting to dispose WebGL resources on unmount
6. Not converting hex colors to 0-1 range for uniforms
7. Metaball positions not normalized to texture space

---

## Expected Visual Result

When complete, you should see:
- A smooth gradient background going from cyan/blue (top) to purple (bottom)
- 3-4 large metaballs floating upward slowly
- Metaballs have a purple (top) to cyan/blue (bottom) gradient
- When metaballs overlap, they merge smoothly creating organic blob shapes
- The overall effect should look like an ambient lava lamp
- Debug panel allows real-time tweaking of all parameters

Good luck! This is a beautiful effect when done right.
