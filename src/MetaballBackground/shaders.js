// Vertex shader for metaball rendering
export const metaballVertexShader = `
attribute vec2 a_position;
varying vec2 v_texCoord;

void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Fragment shader for metaball rendering (Pass 1: renders metaballs to grayscale texture)
export const metaballFragmentShader = `
precision highp float;
varying vec2 v_texCoord;

uniform vec2 u_resolution;
uniform float u_metaballs[12]; // x, y, radius for up to 4 metaballs (3 floats each)
uniform int u_metaballCount;
uniform float u_threshold;

void main() {
  vec2 coord = v_texCoord * u_resolution;
  float sum = 0.0;
  
  // Metaball distance field calculation - unrolled loop (GLSL requires constant array indices)
  // Metaball 0
  if (u_metaballCount > 0) {
    vec2 center0 = vec2(u_metaballs[0], u_metaballs[1]);
    float radius0 = u_metaballs[2];
    float dist0 = distance(coord, center0);
    sum += (radius0 * radius0) / (dist0 * dist0 + 0.0001);
  }
  
  // Metaball 1
  if (u_metaballCount > 1) {
    vec2 center1 = vec2(u_metaballs[3], u_metaballs[4]);
    float radius1 = u_metaballs[5];
    float dist1 = distance(coord, center1);
    sum += (radius1 * radius1) / (dist1 * dist1 + 0.0001);
  }
  
  // Metaball 2
  if (u_metaballCount > 2) {
    vec2 center2 = vec2(u_metaballs[6], u_metaballs[7]);
    float radius2 = u_metaballs[8];
    float dist2 = distance(coord, center2);
    sum += (radius2 * radius2) / (dist2 * dist2 + 0.0001);
  }
  
  // Metaball 3
  if (u_metaballCount > 3) {
    vec2 center3 = vec2(u_metaballs[9], u_metaballs[10]);
    float radius3 = u_metaballs[11];
    float dist3 = distance(coord, center3);
    sum += (radius3 * radius3) / (dist3 * dist3 + 0.0001);
  }
  
  // Apply threshold with completely hard edge (no glow/halo at all)
  float value = step(u_threshold, sum);
  
  gl_FragColor = vec4(vec3(value), 1.0);
}
`;

// Fragment shader for gradient map (Pass 2: applies gradient to metaball texture)
export const gradientMapFragmentShader = `
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
`;

// Vertex shader for background gradient
export const backgroundVertexShader = `
attribute vec2 a_position;
varying vec2 v_texCoord;

void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Fragment shader for background gradient
export const backgroundFragmentShader = `
precision highp float;
varying vec2 v_texCoord;

uniform vec3 u_color1; // top color (RGB 0-1)
uniform vec3 u_color2; // bottom color (RGB 0-1)

void main() {
  float gradientPos = v_texCoord.y;
  vec3 color = mix(u_color1, u_color2, gradientPos);
  gl_FragColor = vec4(color, 1.0);
}
`;

