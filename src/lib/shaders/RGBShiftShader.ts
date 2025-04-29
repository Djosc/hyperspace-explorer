import * as THREE from 'three';

/**
 * RGBShiftShader - Custom shader for RGB shift effect
 */
export const RGBShiftShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0.002 },
    angle: { value: 0.0 },
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
    uniform float amount;
    uniform float angle;
    uniform float time;
    
    varying vec2 vUv;
    
    void main() {
      vec2 offset = amount * vec2(cos(angle + time), sin(angle + time));
      
      vec4 cr = texture2D(tDiffuse, vUv + offset);
      vec4 cg = texture2D(tDiffuse, vUv);
      vec4 cb = texture2D(tDiffuse, vUv - offset);
      
      gl_FragColor = vec4(cr.r, cg.g, cb.b, cg.a);
    }
  `
}; 