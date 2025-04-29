import * as THREE from 'three';

/**
 * KaleidoscopeShader - Custom shader for kaleidoscope effect
 */
export const KaleidoscopeShader = {
  uniforms: {
    tDiffuse: { value: null },
    sides: { value: 8.0 },
    time: { value: 0.0 }
  },

  vertexShader: `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float sides;
    uniform float time;
    
    varying vec2 vUv;
    
    void main() {
      vec2 p = vUv - 0.5;
      float r = length(p);
      
      // Calculate angle and apply rotation
      float theta = atan(p.y, p.x) + time;
      
      // Map to number of sides
      theta = mod(theta, 2.0 * 3.14159 / sides);
      if (theta > 3.14159 / sides) {
        theta = 2.0 * 3.14159 / sides - theta;
      }
      
      // Convert back to cartesian coordinates
      vec2 q = vec2(cos(theta), sin(theta)) * r;
      
      // Sample texture
      vec2 uv = q + 0.5;
      gl_FragColor = texture2D(tDiffuse, uv);
    }
  `
}; 