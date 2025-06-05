import * as THREE from 'three';

export const JuliaSetShader = {
  uniforms: {
    time: { value: 0 },
    resolution: { value: new THREE.Vector2() },
    c: { value: new THREE.Vector2(-0.4, 0.6) },
    maxIterations: { value: 50 },
    colorScale: { value: 1.0 },
    dimensionProjection: { value: 0.5 }
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float time;
    uniform vec2 resolution;
    uniform vec2 c;
    uniform int maxIterations;
    uniform float colorScale;
    uniform float dimensionProjection;
    
    varying vec2 vUv;
    varying vec3 vPosition;

    // Complex number operations
    vec2 complexSquare(vec2 z) {
      return vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y);
    }

    float complexMagnitude(vec2 z) {
      return sqrt(z.x * z.x + z.y * z.y);
    }

    // Higher dimensional projection
    vec2 projectToComplex(vec3 pos, float projection) {
      float angle = time * 0.5;
      float w = pos.z * projection;
      return vec2(
        pos.x * cos(angle) - w * sin(angle),
        pos.y * cos(angle) + w * sin(angle)
      );
    }

    // Color mapping function
    vec3 mapColor(float t) {
      vec3 c1 = vec3(0.0, 0.0, 0.0);
      vec3 c2 = vec3(0.5, 0.0, 0.5);
      vec3 c3 = vec3(1.0, 0.0, 0.0);
      vec3 c4 = vec3(1.0, 1.0, 0.0);
      vec3 c5 = vec3(1.0, 1.0, 1.0);
      
      float p1 = 0.2;
      float p2 = 0.4;
      float p3 = 0.6;
      float p4 = 0.8;
      
      if (t < p1) return mix(c1, c2, t / p1);
      if (t < p2) return mix(c2, c3, (t - p1) / (p2 - p1));
      if (t < p3) return mix(c3, c4, (t - p2) / (p3 - p2));
      if (t < p4) return mix(c4, c5, (t - p3) / (p4 - p3));
      return c5;
    }

    void main() {
      // Project 3D position to complex plane
      vec2 z = projectToComplex(vPosition, dimensionProjection);
      vec2 z0 = z;
      
      int i;
      for (i = 0; i < maxIterations; i++) {
        z = complexSquare(z) + c;
        if (complexMagnitude(z) > 2.0) break;
      }
      
      float t = float(i) / float(maxIterations);
      vec3 color = mapColor(t * colorScale);
      
      // Add some depth-based shading
      float depth = length(vPosition) * 0.5;
      color *= 1.0 - depth * 0.5;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
}; 