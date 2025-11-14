// Vertex shader for metaball rendering (Three.js compatible)
export const metaballVertexShader = `
varying vec2 v_texCoord;

void main() {
  v_texCoord = (position.xy + 1.0) * 0.5;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Fragment shader for metaball rendering (Pass 1: renders metaballs to grayscale texture)
export const metaballFragmentShader = `
precision highp float;
varying vec2 v_texCoord;

uniform vec2 u_resolution;
uniform float u_metaballs[72]; // x, y, radius for up to 24 metaballs (3 floats each)
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
  
  // Metaball 4
  if (u_metaballCount > 4) {
    vec2 center4 = vec2(u_metaballs[12], u_metaballs[13]);
    float radius4 = u_metaballs[14];
    float dist4 = distance(coord, center4);
    sum += (radius4 * radius4) / (dist4 * dist4 + 0.0001);
  }
  
  // Metaball 5
  if (u_metaballCount > 5) {
    vec2 center5 = vec2(u_metaballs[15], u_metaballs[16]);
    float radius5 = u_metaballs[17];
    float dist5 = distance(coord, center5);
    sum += (radius5 * radius5) / (dist5 * dist5 + 0.0001);
  }
  
  // Metaball 6
  if (u_metaballCount > 6) {
    vec2 center6 = vec2(u_metaballs[18], u_metaballs[19]);
    float radius6 = u_metaballs[20];
    float dist6 = distance(coord, center6);
    sum += (radius6 * radius6) / (dist6 * dist6 + 0.0001);
  }
  
  // Metaball 7
  if (u_metaballCount > 7) {
    vec2 center7 = vec2(u_metaballs[21], u_metaballs[22]);
    float radius7 = u_metaballs[23];
    float dist7 = distance(coord, center7);
    sum += (radius7 * radius7) / (dist7 * dist7 + 0.0001);
  }
  
  // Metaball 8
  if (u_metaballCount > 8) {
    vec2 center8 = vec2(u_metaballs[24], u_metaballs[25]);
    float radius8 = u_metaballs[26];
    float dist8 = distance(coord, center8);
    sum += (radius8 * radius8) / (dist8 * dist8 + 0.0001);
  }
  
  // Metaball 9
  if (u_metaballCount > 9) {
    vec2 center9 = vec2(u_metaballs[27], u_metaballs[28]);
    float radius9 = u_metaballs[29];
    float dist9 = distance(coord, center9);
    sum += (radius9 * radius9) / (dist9 * dist9 + 0.0001);
  }
  
  // Metaball 10
  if (u_metaballCount > 10) {
    vec2 center10 = vec2(u_metaballs[30], u_metaballs[31]);
    float radius10 = u_metaballs[32];
    float dist10 = distance(coord, center10);
    sum += (radius10 * radius10) / (dist10 * dist10 + 0.0001);
  }
  
  // Metaball 11
  if (u_metaballCount > 11) {
    vec2 center11 = vec2(u_metaballs[33], u_metaballs[34]);
    float radius11 = u_metaballs[35];
    float dist11 = distance(coord, center11);
    sum += (radius11 * radius11) / (dist11 * dist11 + 0.0001);
  }
  
  // Metaball 12
  if (u_metaballCount > 12) {
    vec2 center12 = vec2(u_metaballs[36], u_metaballs[37]);
    float radius12 = u_metaballs[38];
    float dist12 = distance(coord, center12);
    sum += (radius12 * radius12) / (dist12 * dist12 + 0.0001);
  }
  
  // Metaball 13
  if (u_metaballCount > 13) {
    vec2 center13 = vec2(u_metaballs[39], u_metaballs[40]);
    float radius13 = u_metaballs[41];
    float dist13 = distance(coord, center13);
    sum += (radius13 * radius13) / (dist13 * dist13 + 0.0001);
  }
  
  // Metaball 14
  if (u_metaballCount > 14) {
    vec2 center14 = vec2(u_metaballs[42], u_metaballs[43]);
    float radius14 = u_metaballs[44];
    float dist14 = distance(coord, center14);
    sum += (radius14 * radius14) / (dist14 * dist14 + 0.0001);
  }
  
  // Metaball 15
  if (u_metaballCount > 15) {
    vec2 center15 = vec2(u_metaballs[45], u_metaballs[46]);
    float radius15 = u_metaballs[47];
    float dist15 = distance(coord, center15);
    sum += (radius15 * radius15) / (dist15 * dist15 + 0.0001);
  }
  
  // Metaball 16
  if (u_metaballCount > 16) {
    vec2 center16 = vec2(u_metaballs[48], u_metaballs[49]);
    float radius16 = u_metaballs[50];
    float dist16 = distance(coord, center16);
    sum += (radius16 * radius16) / (dist16 * dist16 + 0.0001);
  }
  
  // Metaball 17
  if (u_metaballCount > 17) {
    vec2 center17 = vec2(u_metaballs[51], u_metaballs[52]);
    float radius17 = u_metaballs[53];
    float dist17 = distance(coord, center17);
    sum += (radius17 * radius17) / (dist17 * dist17 + 0.0001);
  }
  
  // Metaball 18
  if (u_metaballCount > 18) {
    vec2 center18 = vec2(u_metaballs[54], u_metaballs[55]);
    float radius18 = u_metaballs[56];
    float dist18 = distance(coord, center18);
    sum += (radius18 * radius18) / (dist18 * dist18 + 0.0001);
  }
  
  // Metaball 19
  if (u_metaballCount > 19) {
    vec2 center19 = vec2(u_metaballs[57], u_metaballs[58]);
    float radius19 = u_metaballs[59];
    float dist19 = distance(coord, center19);
    sum += (radius19 * radius19) / (dist19 * dist19 + 0.0001);
  }
  
  // Metaball 20
  if (u_metaballCount > 20) {
    vec2 center20 = vec2(u_metaballs[60], u_metaballs[61]);
    float radius20 = u_metaballs[62];
    float dist20 = distance(coord, center20);
    sum += (radius20 * radius20) / (dist20 * dist20 + 0.0001);
  }
  
  // Metaball 21
  if (u_metaballCount > 21) {
    vec2 center21 = vec2(u_metaballs[63], u_metaballs[64]);
    float radius21 = u_metaballs[65];
    float dist21 = distance(coord, center21);
    sum += (radius21 * radius21) / (dist21 * dist21 + 0.0001);
  }
  
  // Metaball 22
  if (u_metaballCount > 22) {
    vec2 center22 = vec2(u_metaballs[66], u_metaballs[67]);
    float radius22 = u_metaballs[68];
    float dist22 = distance(coord, center22);
    sum += (radius22 * radius22) / (dist22 * dist22 + 0.0001);
  }
  
  // Metaball 23
  if (u_metaballCount > 23) {
    vec2 center23 = vec2(u_metaballs[69], u_metaballs[70]);
    float radius23 = u_metaballs[71];
    float dist23 = distance(coord, center23);
    sum += (radius23 * radius23) / (dist23 * dist23 + 0.0001);
  }
  
  // Apply threshold with completely hard edge (no glow/halo at all)
  // Invert threshold so higher value = more merging/bigger metaballs
  float invertedThreshold = 4.0 - u_threshold;
  float value = step(invertedThreshold, sum);
  
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
  float mask = texture2D(u_texture, v_texCoord).r;
  
  // Apply gradient map based on Y position
  float gradientPos = v_texCoord.y;
  vec3 gradientColor = mix(u_color1, u_color2, gradientPos);
  
  // Use mask as pure alpha - no color multiplication for crisp edges
  gl_FragColor = vec4(gradientColor, mask);
}
`;

// Vertex shader for background gradient
export const backgroundVertexShader = `
varying vec2 v_texCoord;

void main() {
  v_texCoord = (position.xy + 1.0) * 0.5;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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
