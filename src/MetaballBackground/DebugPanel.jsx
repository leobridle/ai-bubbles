import { useState } from 'react';

const DebugPanel = ({
  color1,
  color2,
  speed,
  metaballCount,
  minSize,
  maxSize,
  threshold,
  onChange
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleChange = (key, value) => {
    onChange({
      color1,
      color2,
      speed,
      metaballCount,
      minSize,
      maxSize,
      threshold,
      [key]: value
    });
  };

  const copyConfig = () => {
    const config = {
      color1,
      color2,
      speed,
      metaballCount,
      minSize,
      maxSize,
      threshold
    };
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    alert('Config copied to clipboard!');
  };

  const panelStyle = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '300px',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    color: '#fff',
    padding: isCollapsed ? '10px' : '20px',
    borderRadius: '8px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    zIndex: 1000,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.3s ease'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isCollapsed ? '0' : '15px',
    cursor: 'pointer'
  };

  const buttonStyle = {
    padding: '6px 12px',
    backgroundColor: '#4a5568',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    marginRight: '8px'
  };

  const inputGroupStyle = {
    marginBottom: '15px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontSize: '12px',
    color: '#a0aec0'
  };

  const inputStyle = {
    width: '100%',
    padding: '6px',
    borderRadius: '4px',
    border: '1px solid #4a5568',
    backgroundColor: '#2d3748',
    color: '#fff',
    fontSize: '12px'
  };

  const sliderStyle = {
    width: '100%',
    marginTop: '5px'
  };

  const colorInputStyle = {
    width: '100%',
    height: '30px',
    borderRadius: '4px',
    border: '1px solid #4a5568',
    cursor: 'pointer'
  };

  if (isCollapsed) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle} onClick={() => setIsCollapsed(false)}>
          <span>⚙️ Debug Panel</span>
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontWeight: 'bold' }}>⚙️ Debug Panel</span>
        <button
          style={{ ...buttonStyle, marginRight: 0 }}
          onClick={() => setIsCollapsed(true)}
        >
          −
        </button>
      </div>

      <div style={inputGroupStyle}>
        <label style={labelStyle}>Color 1 (Background Top / Metaball Bottom)</label>
        <input
          type="color"
          value={color1}
          onChange={(e) => handleChange('color1', e.target.value)}
          style={colorInputStyle}
        />
      </div>

      <div style={inputGroupStyle}>
        <label style={labelStyle}>Color 2 (Background Bottom / Metaball Top)</label>
        <input
          type="color"
          value={color2}
          onChange={(e) => handleChange('color2', e.target.value)}
          style={colorInputStyle}
        />
      </div>

      <div style={inputGroupStyle}>
        <label style={labelStyle}>Speed: {speed.toFixed(2)}</label>
        <input
          type="range"
          min="0.0"
          max="10.0"
          step="0.1"
          value={speed}
          onChange={(e) => handleChange('speed', parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </div>

      <div style={inputGroupStyle}>
        <label style={labelStyle}>Metaball Count: {metaballCount}</label>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={metaballCount}
          onChange={(e) => handleChange('metaballCount', parseInt(e.target.value))}
          style={sliderStyle}
        />
      </div>

      <div style={inputGroupStyle}>
        <label style={labelStyle}>Min Size: {minSize}px</label>
        <input
          type="range"
          min="20"
          max="500"
          step="5"
          value={minSize}
          onChange={(e) => handleChange('minSize', parseInt(e.target.value))}
          style={sliderStyle}
        />
      </div>

      <div style={inputGroupStyle}>
        <label style={labelStyle}>Max Size: {maxSize}px</label>
        <input
          type="range"
          min="50"
          max="800"
          step="5"
          value={maxSize}
          onChange={(e) => handleChange('maxSize', parseInt(e.target.value))}
          style={sliderStyle}
        />
      </div>

      <div style={inputGroupStyle}>
        <label style={labelStyle}>
          Merge Amount: {threshold.toFixed(2)}
          <span style={{ fontSize: '10px', display: 'block', color: '#718096', marginTop: '2px' }}>
            Higher = more merging/bigger metaballs
          </span>
        </label>
        <input
          type="range"
          min="0.5"
          max="3.0"
          step="0.01"
          value={threshold}
          onChange={(e) => handleChange('threshold', parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </div>

      <div style={{ marginTop: '15px', display: 'flex', gap: '8px' }}>
        <button style={buttonStyle} onClick={copyConfig}>
          Copy Config
        </button>
      </div>
    </div>
  );
};

export default DebugPanel;

