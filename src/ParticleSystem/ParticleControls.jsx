import { useState } from 'react';
import './ParticleControls.css';

const ParticleControls = ({ config, onChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleChange = (key, value) => {
    onChange({ ...config, [key]: value });
  };

  const copyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    alert('Particle config copied to clipboard!');
  };

  return (
    <div className="particle-controls">
      <div className="particle-controls-header">
        <h3>Particle Controls</h3>
        <button 
          className="collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>
      
      <div className="particle-controls-subtitle">
        Click anywhere to launch small bubbles
      </div>
      
      {!isCollapsed && (
        <div className="particle-controls-content">
          <div className="control-group">
            <label>
              Particle Count: <span className="value">{config.particleCount}</span>
            </label>
            <input
              type="range"
              min="5"
              max="100"
              step="1"
              value={config.particleCount}
              onChange={(e) => handleChange('particleCount', parseInt(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label>
              Min Size: <span className="value">{config.minSize}px</span>
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={config.minSize}
              onChange={(e) => handleChange('minSize', parseInt(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label>
              Max Size: <span className="value">{config.maxSize}px</span>
            </label>
            <input
              type="range"
              min="10"
              max="80"
              step="1"
              value={config.maxSize}
              onChange={(e) => handleChange('maxSize', parseInt(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label>
              Rise Speed: <span className="value">{config.riseSpeed.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="8"
              step="0.1"
              value={config.riseSpeed}
              onChange={(e) => handleChange('riseSpeed', parseFloat(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label>
              Turbulence: <span className="value">{config.turbulence.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.05"
              value={config.turbulence}
              onChange={(e) => handleChange('turbulence', parseFloat(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label>
              Burst Duration: <span className="value">{config.burstDuration.toFixed(1)}s</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={config.burstDuration}
              onChange={(e) => handleChange('burstDuration', parseFloat(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label>
              Spawn Width: <span className="value">{config.spawnWidth}px</span>
            </label>
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={config.spawnWidth}
              onChange={(e) => handleChange('spawnWidth', parseInt(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label>
              Fade Out: <span className="value">{config.fadeOutDuration.toFixed(1)}s</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={config.fadeOutDuration}
              onChange={(e) => handleChange('fadeOutDuration', parseFloat(e.target.value))}
            />
          </div>

          <div className="copy-config-section">
            <button className="copy-config-btn" onClick={copyConfig}>
              Copy Config
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticleControls;

