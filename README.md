# Metaball Background - WebGL Lava Lamp Effect

A React component that renders an animated metaball "lava lamp" effect using WebGL and GLSL shaders.

## Features

- 🎨 Beautiful animated metaball effects with smooth blending
- 🌈 Customizable gradient backgrounds and metaball colors
- ⚡ High-performance WebGL rendering at 60fps
- 🎛️ Interactive debug panel for real-time parameter tweaking
- 📱 Responsive design (target: 1080x1920 portrait)

## Installation

```bash
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

## Usage

```jsx
import { useRef } from 'react';
import MetaballBackground from './MetaballBackground';

function App() {
  const bgRef = useRef();
  
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
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `backgroundColor1` | string | `'#00bfff'` | Top background gradient color |
| `backgroundColor2` | string | `'#a855f7'` | Bottom background gradient color |
| `metaballColor1` | string | `'#a855f7'` | Top metaball gradient color |
| `metaballColor2` | string | `'#00bfff'` | Bottom metaball gradient color |
| `speed` | number | `1.0` | Animation speed multiplier |
| `metaballCount` | number | `3` | Number of metaballs (2-4) |
| `minSize` | number | `150` | Minimum metaball radius in pixels |
| `maxSize` | number | `300` | Maximum metaball radius in pixels |
| `threshold` | number | `0.5` | Metaball merge threshold (0-1) |
| `showDebugPanel` | boolean | `false` | Show/hide debug UI |

## Ref Methods

The component exposes methods via ref:

```jsx
const bgRef = useRef();

// Control speed
bgRef.current?.setSpeed(0.5); // Slow down
bgRef.current?.setSpeed(2.0); // Speed up

// Pause/resume animation
bgRef.current?.pause();
bgRef.current?.resume();

// Update colors
bgRef.current?.updateColors('#ff0000', '#0000ff', '#00ff00', '#ffff00');
```

## Debug Panel

When `showDebugPanel={true}`, a floating panel appears in the top-right corner with:

- Color pickers for all 4 colors
- Sliders for speed, count, sizes, and threshold
- Copy Config button to export settings as JSON

## Technical Details

- **Rendering**: Two-pass WebGL rendering
  - Pass 1: Render metaballs to grayscale texture
  - Pass 2: Apply gradient map and composite with background
- **Metaball Formula**: `sum += r²/d²` where r is radius, d is distance
- **Animation**: Organic motion using sine/cosine waves with upward drift
- **Performance**: Optimized for 60fps with minimal garbage collection

## Build

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## Browser Support

Requires WebGL support. Modern browsers (Chrome, Firefox, Safari, Edge) are supported.

