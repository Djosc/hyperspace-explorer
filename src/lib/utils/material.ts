import * as THREE from 'three';
import type { ColorMode } from '../types';

// Define material uniforms type
interface MaterialUniforms {
  color?: { value: THREE.Color };
  opacity?: { value: number };
  shininess?: { value: number };
  time?: { value: number };
  fuzziness?: { value: number };
  [key: string]: { value: any } | undefined;
}

// Create spectral shift material
export function createSpectralShiftMaterial(): THREE.ShaderMaterial & { uniforms: MaterialUniforms } {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      colorA: { value: new THREE.Color(0xff0000) },
      colorB: { value: new THREE.Color(0x00ff00) },
      colorC: { value: new THREE.Color(0x0000ff) },
      pulseSpeed: { value: 1.0 },
      glowIntensity: { value: 0.5 }
    },
    vertexShader: `
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 colorA;
      uniform vec3 colorB;
      uniform vec3 colorC;
      uniform float pulseSpeed;
      uniform float glowIntensity;
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;

      void main() {
        float t = time * pulseSpeed;
        
        // Create a more complex color pattern
        vec3 color = colorA * sin(vPosition.x * 2.0 + t) +
                    colorB * sin(vPosition.y * 2.0 + t + 2.094) +
                    colorC * sin(vPosition.z * 2.0 + t + 4.189);
        
        // Add pulsing glow effect
        float glow = sin(t * 0.5) * 0.5 + 0.5;
        color += vec3(glow) * glowIntensity;
        
        // Add fresnel-like edge glow
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
        color += vec3(fresnel) * glowIntensity;
        
        // Normalize and output
        gl_FragColor = vec4(color * 0.5 + 0.5, 1.0);
      }
    `
  }) as THREE.ShaderMaterial & { uniforms: MaterialUniforms };
}

// Create kaleidoscope material
export function createKaleidoscopeMaterial(): THREE.ShaderMaterial & { uniforms: MaterialUniforms } {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      baseColor: { value: new THREE.Color(0xffffff) },
      patternDensity: { value: 8.0 },
      rotationSpeed: { value: 1.0 },
      glowIntensity: { value: 0.7 }
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
      uniform vec3 baseColor;
      uniform float patternDensity;
      uniform float rotationSpeed;
      uniform float glowIntensity;
      varying vec2 vUv;
      varying vec3 vPosition;

      void main() {
        vec2 center = vec2(0.5, 0.5);
        vec2 pos = vUv - center;
        float angle = atan(pos.y, pos.x);
        float radius = length(pos);
        
        // Create more complex pattern
        float pattern = sin(angle * patternDensity + time * rotationSpeed) * 
                       cos(radius * 20.0 - time * rotationSpeed);
        
        // Add kaleidoscope effect
        float kaleidoscope = sin(angle * 8.0 + time) * cos(radius * 10.0 - time);
        
        // Combine patterns
        vec3 color = baseColor * (pattern * 0.5 + kaleidoscope * 0.5);
        
        // Add glow effect
        float glow = sin(time * 0.5) * 0.5 + 0.5;
        color += vec3(glow) * glowIntensity;
        
        // Output final color
        gl_FragColor = vec4(color, 1.0);
      }
    `
  }) as THREE.ShaderMaterial & { uniforms: MaterialUniforms };
}

// Create combined material
export function createCombinedMaterial(): THREE.ShaderMaterial & { uniforms: MaterialUniforms } {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      colorA: { value: new THREE.Color(0xff0000) },
      colorB: { value: new THREE.Color(0x00ff00) },
      colorC: { value: new THREE.Color(0x0000ff) },
      baseColor: { value: new THREE.Color(0xffffff) },
      pulseSpeed: { value: 1.0 },
      patternDensity: { value: 8.0 },
      rotationSpeed: { value: 1.0 },
      glowIntensity: { value: 0.7 }
    },
    vertexShader: `
      varying vec3 vPosition;
      varying vec2 vUv;
      varying vec3 vNormal;
      
      void main() {
        vPosition = position;
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 colorA;
      uniform vec3 colorB;
      uniform vec3 colorC;
      uniform vec3 baseColor;
      uniform float pulseSpeed;
      uniform float patternDensity;
      uniform float rotationSpeed;
      uniform float glowIntensity;
      varying vec3 vPosition;
      varying vec2 vUv;
      varying vec3 vNormal;

      void main() {
        float t = time * pulseSpeed;
        
        // Spectral shift component
        vec3 spectralColor = colorA * sin(vPosition.x * 2.0 + t) +
                            colorB * sin(vPosition.y * 2.0 + t + 2.094) +
                            colorC * sin(vPosition.z * 2.0 + t + 4.189);
        
        // Kaleidoscope component
        vec2 center = vec2(0.5, 0.5);
        vec2 pos = vUv - center;
        float angle = atan(pos.y, pos.x);
        float radius = length(pos);
        
        float pattern = sin(angle * patternDensity + time * rotationSpeed) * 
                       cos(radius * 20.0 - time * rotationSpeed) +
                       sin(radius * 10.0 + time * rotationSpeed * 0.5) * 
                       cos(angle * patternDensity * 0.5 - time * rotationSpeed * 0.7);
        
        vec3 kaleidoscopeColor = baseColor * (pattern * 0.5 + 0.5);
        
        // Combine with weighted blend
        float blend = sin(t * 0.2) * 0.5 + 0.5;
        vec3 finalColor = spectralColor * blend + kaleidoscopeColor * (1.0 - blend);
        
        // Add fresnel edge glow
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
        finalColor += vec3(fresnel) * glowIntensity;
        
        // Add pulsing glow
        float pulse = sin(t * 0.5) * 0.5 + 0.5;
        finalColor += vec3(pulse) * glowIntensity * 0.5;
        
        // Normalize and output
        gl_FragColor = vec4(finalColor * 0.5 + 0.5, 1.0);
      }
    `
  }) as THREE.ShaderMaterial & { uniforms: MaterialUniforms };
}

// Create hyperspace material with dimension-based colors
export function createHyperspaceMaterial(): THREE.ShaderMaterial & { uniforms: MaterialUniforms } {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      dimension: { value: 0.5 },
      quantumField: { value: 0.3 },
      waveFunction: { value: 0.2 },
      colorX: { value: new THREE.Color(1.0, 0.0, 0.0) },
      colorY: { value: new THREE.Color(0.0, 1.0, 0.0) },
      colorZ: { value: new THREE.Color(0.0, 0.0, 1.0) },
      colorW: { value: new THREE.Color(1.0, 1.0, 0.0) },
      colorV: { value: new THREE.Color(1.0, 0.0, 1.0) },
      colorU: { value: new THREE.Color(0.0, 1.0, 1.0) },
      colorT: { value: new THREE.Color(0.5, 0.5, 1.0) },
      colorS: { value: new THREE.Color(1.0, 0.5, 0.5) },
      colorR: { value: new THREE.Color(0.5, 1.0, 0.5) },
      colorQ: { value: new THREE.Color(0.8, 0.2, 0.8) },
      dimensionProjection: { value: 0.5 },
      saturation: { value: 1.5 },
      brightness: { value: 1.2 },
      contrast: { value: 1.3 }
    },
    vertexShader: `
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      void main() {
        vPosition = position;
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float dimension;
      uniform float quantumField;
      uniform float waveFunction;
      uniform vec3 colorX;
      uniform vec3 colorY;
      uniform vec3 colorZ;
      uniform vec3 colorW;
      uniform vec3 colorV;
      uniform vec3 colorU;
      uniform vec3 colorT;
      uniform vec3 colorS;
      uniform vec3 colorR;
      uniform vec3 colorQ;
      uniform float dimensionProjection;
      uniform float saturation;
      uniform float brightness;
      uniform float contrast;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      // Quantum noise function
      float quantumNoise(vec3 pos, float t) {
        return fract(sin(dot(pos, vec3(12.9898, 78.233, 45.164))) * 43758.5453 + t);
      }
      
      void main() {
        // Calculate dimension weights with stronger influence
        float w = abs(vPosition.x) * dimensionProjection * 2.0;
        float v = abs(vPosition.y) * dimensionProjection * 2.0;
        float x = abs(vPosition.z) * dimensionProjection * 2.0;
        float y = abs(vPosition.x * vPosition.y) * dimensionProjection * 2.0;
        float z = abs(vPosition.y * vPosition.z) * dimensionProjection * 2.0;
        float u = abs(vPosition.x * vPosition.z) * dimensionProjection * 2.0;
        
        // Simulate higher dimensions using combinations of existing coordinates
        float t = abs(vPosition.x * vPosition.y * vPosition.z) * dimensionProjection * 2.0;
        float s = abs(vPosition.x * vPosition.y * vPosition.z) * dimensionProjection * 2.0;
        float r = abs(vPosition.x * vPosition.y * vPosition.z) * dimensionProjection * 2.0;
        float q = abs(vPosition.x * vPosition.y * vPosition.z) * dimensionProjection * 2.0;
        
        // Base color with minimum values to prevent white
        vec3 baseColor = colorX * x + colorY * y + colorZ * z + 
                         colorW * w + colorV * v + colorU * u + 
                         colorT * t + colorS * s + colorR * r + 
                         colorQ * q;
        
        // Add quantum field effect
        float noise = quantumNoise(vPosition, time);
        vec3 quantumColor = vec3(noise) * quantumField;
        
        // Add wave function collapse effect
        float wave = sin(vPosition.x * 10.0 + time) * 
                    cos(vPosition.y * 10.0 + time * 0.7) * 
                    sin(vPosition.z * 10.0 + time * 1.3);
        vec3 waveColor = vec3(wave) * waveFunction;
        
        // Combine colors
        vec3 finalColor = baseColor + quantumColor + waveColor;
        
        // Apply saturation, brightness, and contrast
        float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
        finalColor = mix(vec3(luminance), finalColor, saturation);
        finalColor = (finalColor - 0.5) * contrast + 0.5;
        finalColor *= brightness;
        
        // Add fresnel edge glow
        float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 3.0);
        finalColor += vec3(fresnel) * 0.5;
        
        // Output final color
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
  }) as THREE.ShaderMaterial & { uniforms: MaterialUniforms };
}

// Create quantum material
export function createQuantumMaterial(): THREE.ShaderMaterial & { uniforms: MaterialUniforms } {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      colorA: { value: new THREE.Color(0x00ffff) },
      colorB: { value: new THREE.Color(0xff00ff) },
      colorC: { value: new THREE.Color(0xffff00) },
      speed: { value: 1.0 },
      uncertainty: { value: 0.5 },
      entanglement: { value: 0.7 },
      glowIntensity: { value: 0.8 }
    },
    vertexShader: `
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 colorA;
      uniform vec3 colorB;
      uniform vec3 colorC;
      uniform float speed;
      uniform float uncertainty;
      uniform float entanglement;
      uniform float glowIntensity;
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;

      // Quantum noise function
      float quantumNoise(vec3 p, float t) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453 + t);
      }

      // Heisenberg uncertainty visualization
      float uncertaintyField(vec3 p, float t) {
        float noise = quantumNoise(p, t);
        float uncertainty = sin(length(p) * 5.0 - t * 2.0) * 0.5 + 0.5;
        return noise * uncertainty;
      }

      // Quantum entanglement visualization
      float entanglementField(vec3 p, float t) {
        float dist = length(p);
        return sin(dist * 10.0 - t * 3.0) * cos(t * 2.0) * 0.5 + 0.5;
      }

      void main() {
        float t = time * speed;
        
        // Create quantum fields
        float uncertaintyValue = uncertaintyField(vPosition, t) * uncertainty;
        float entanglementValue = entanglementField(vPosition, t) * entanglement;
        
        // Create base color
        vec3 baseColor = colorA * sin(vPosition.x * 2.0 + t) +
                        colorB * sin(vPosition.y * 2.0 + t + 2.094) +
                        colorC * sin(vPosition.z * 2.0 + t + 4.189);
        
        // Add uncertainty effect
        baseColor += vec3(uncertaintyValue) * 0.5;
        
        // Add entanglement effect
        baseColor += vec3(entanglementValue) * 0.5;
        
        // Add fresnel edge glow
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
        baseColor += vec3(fresnel) * glowIntensity;
        
        // Add quantum fluctuations
        float fluctuation = quantumNoise(vPosition, t) * 0.2;
        baseColor += vec3(fluctuation) * glowIntensity;
        
        // Normalize and output
        gl_FragColor = vec4(baseColor * 0.5 + 0.5, 1.0);
      }
    `
  }) as THREE.ShaderMaterial & { uniforms: MaterialUniforms };
}

// Create sound resonance material
export function createSoundResonanceMaterial(): THREE.ShaderMaterial & { uniforms: MaterialUniforms } {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      frequency: { value: 440.0 },
      amplitude: { value: 0.5 },
      resonance: { value: 0.7 },
      colorA: { value: new THREE.Color(0x00ffff) },
      colorB: { value: new THREE.Color(0xff00ff) },
      colorC: { value: new THREE.Color(0xffff00) }
    },
    vertexShader: `
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float frequency;
      uniform float amplitude;
      uniform float resonance;
      uniform vec3 colorA;
      uniform vec3 colorB;
      uniform vec3 colorC;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      // Simulate sound wave
      float soundWave(float x, float freq, float amp, float t) {
        return amp * sin(x * freq * 0.01 + t);
      }
      
      void main() {
        // Create standing wave pattern
        float wave1 = soundWave(vPosition.x, frequency, amplitude, time);
        float wave2 = soundWave(vPosition.y, frequency * 1.5, amplitude * 0.8, time * 1.2);
        float wave3 = soundWave(vPosition.z, frequency * 0.7, amplitude * 0.6, time * 0.8);
        
        // Combine waves with resonance
        float combinedWave = (wave1 + wave2 + wave3) * resonance;
        
        // Create color based on wave amplitude
        vec3 waveColor = colorA * wave1 + colorB * wave2 + colorC * wave3;
        
        // Add fresnel edge glow
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
        waveColor += vec3(fresnel) * 0.5;
        
        // Add standing wave nodes (points of zero amplitude)
        float nodePattern = sin(vPosition.x * 10.0 + time) * 
                           sin(vPosition.y * 10.0 + time * 0.7) * 
                           sin(vPosition.z * 10.0 + time * 1.3);
        waveColor += vec3(nodePattern) * 0.2;
        
        // Output final color
        gl_FragColor = vec4(waveColor * 0.5 + 0.5, 1.0);
      }
    `
  }) as THREE.ShaderMaterial & { uniforms: MaterialUniforms };
}

// Create fractal material
export function createFractalMaterial(): THREE.ShaderMaterial & { uniforms: MaterialUniforms } {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      iteration: { value: 5.0 },
      colorA: { value: new THREE.Color(0x00ffff) },
      colorB: { value: new THREE.Color(0xff00ff) },
      colorC: { value: new THREE.Color(0xffff00) },
      glowIntensity: { value: 0.7 }
    },
    vertexShader: `
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      void main() {
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float iteration;
      uniform vec3 colorA;
      uniform vec3 colorB;
      uniform vec3 colorC;
      uniform float glowIntensity;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      // Mandelbrot-like coloring function
      vec3 mandelbrotColor(vec3 pos, float iter) {
        vec3 z = vec3(0.0);
        vec3 c = pos * 0.5;
        
        for (float i = 0.0; i < 100.0; i++) {
          if (i > iter) break;
          
          // 3D Mandelbrot-like formula
          z = vec3(
            z.x * z.x - z.y * z.y - z.z * z.z + c.x,
            2.0 * z.x * z.y + c.y,
            2.0 * z.x * z.z + c.z
          );
          
          if (length(z) > 2.0) {
            float t = i / iter;
            return mix(colorA, mix(colorB, colorC, t), t);
          }
        }
        
        return vec3(0.0);
      }
      
      void main() {
        // Create fractal coloring
        vec3 fractalColor = mandelbrotColor(vPosition, iteration);
        
        // Add time-based animation
        float t = time * 0.1;
        fractalColor = mix(
          fractalColor,
          mandelbrotColor(vPosition + vec3(sin(t), cos(t), sin(t * 0.7)), iteration),
          0.3
        );
        
        // Add fresnel edge glow
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
        fractalColor += vec3(fresnel) * glowIntensity;
        
        // Output final color
        gl_FragColor = vec4(fractalColor, 1.0);
      }
    `
  }) as THREE.ShaderMaterial & { uniforms: MaterialUniforms };
}

// Create quantum field material
export function createQuantumFieldMaterial(): THREE.ShaderMaterial & { uniforms: MaterialUniforms } {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      colorA: { value: new THREE.Color(0x00ffff) },
      colorB: { value: new THREE.Color(0xff00ff) },
      colorC: { value: new THREE.Color(0xffff00) },
      smoothness: { value: 0.8 },
      fieldStrength: { value: 1.2 },
      glowIntensity: { value: 0.7 },
      waveSpeed: { value: 1.0 },
      waveFrequency: { value: 2.0 },
      quantumState: { value: 0.0 },
      superposition: { value: 0.5 },
      entanglement: { value: 0.7 },
      uncertainty: { value: 0.5 },
      particleCount: { value: 100 },
      dimensionProjection: { value: 0.5 }
    },
    vertexShader: `
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vLayer;
      
      void main() {
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        
        // Calculate layer based on position
        vLayer = length(position) / 3.0;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 colorA;
      uniform vec3 colorB;
      uniform vec3 colorC;
      uniform float smoothness;
      uniform float fieldStrength;
      uniform float glowIntensity;
      uniform float waveSpeed;
      uniform float waveFrequency;
      uniform float quantumState;
      uniform float superposition;
      uniform float entanglement;
      uniform float uncertainty;
      uniform float particleCount;
      uniform float dimensionProjection;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vLayer;
      
      // Quantum noise function with improved randomness
      float quantumNoise(vec3 p, float t) {
        vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
        p3 += dot(p3, p3.yxz + 33.33);
        return fract((p3.x + p3.y) * p3.z + t);
      }
      
      // Enhanced wave function with interference
      float waveFunction(vec3 p, float t) {
        float k = waveFrequency;
        float omega = waveSpeed;
        
        // Multiple wave components
        float psi1 = sin(k * length(p) - omega * t);
        float psi2 = cos(k * length(p) - omega * t * 0.7);
        float psi3 = sin(k * length(p) * 0.5 - omega * t * 1.3);
        
        // Interference pattern
        float interference = sin(dot(p, vec3(1.0, 2.0, 3.0)) * k - t) * 0.5 + 0.5;
        
        // Combine wave functions with interference
        return (psi1 * psi1 + psi2 * psi2 + psi3 * psi3) * 0.33 * (1.0 + interference * 0.2);
      }
      
      // Enhanced quantum tunneling with multiple barriers
      float tunneling(vec3 p, float t) {
        float barriers[3] = float[3](1.0, 1.5, 2.0);
        float particleEnergy = 0.8;
        float totalTunneling = 0.0;
        
        for(int i = 0; i < 3; i++) {
          float distance = abs(length(p) - (3.0 * (1.0 + float(i) * 0.2)));
          totalTunneling += exp(-2.0 * sqrt(2.0 * (barriers[i] - particleEnergy)) * distance);
        }
        
        return totalTunneling / 3.0;
      }
      
      // Quantum superposition with multiple states
      vec3 superpositionState(vec3 p, float t) {
        // Multiple possible states
        vec3 state1 = vec3(sin(t), cos(t), sin(t * 0.5));
        vec3 state2 = vec3(cos(t), sin(t), cos(t * 0.5));
        vec3 state3 = vec3(sin(t * 1.5), cos(t * 1.5), sin(t));
        
        // Dynamic superposition coefficients
        float alpha = superposition * (0.5 + 0.5 * sin(t * 0.5));
        float beta = (1.0 - superposition) * (0.5 + 0.5 * cos(t * 0.7));
        
        return normalize(mix(mix(state1, state2, alpha), state3, beta));
      }
      
      // Enhanced entanglement effect
      float entanglementEffect(vec3 p, float t) {
        float dist = length(p);
        float phase = t * waveSpeed;
        
        // Multiple entangled wave functions
        float psi1 = sin(dist * waveFrequency - phase);
        float psi2 = sin(dist * waveFrequency + phase);
        float psi3 = cos(dist * waveFrequency * 0.5 - phase * 1.5);
        
        // Entanglement correlation
        float correlation = sin(dot(p, vec3(1.0, 2.0, 3.0)) * waveFrequency) * 0.5 + 0.5;
        
        return (psi1 * psi2 * psi3) * entanglement * (1.0 + correlation * 0.3);
      }
      
      // Uncertainty visualization
      float uncertaintyField(vec3 p, float t) {
        float noise = quantumNoise(p, t);
        float uncertainty = sin(length(p) * 5.0 - t * 2.0) * 0.5 + 0.5;
        return noise * uncertainty * (1.0 + sin(t * 3.0) * 0.2);
      }
      
      void main() {
        float t = time * 0.5;
        
        // Calculate quantum effects
        float probability = waveFunction(vPosition, t);
        float tunnel = tunneling(vPosition, t);
        vec3 superState = superpositionState(vPosition, t);
        float entangled = entanglementEffect(vPosition, t);
        float uncertain = uncertaintyField(vPosition, t);
        
        // Layer-specific effects
        float layerEffect = sin(vLayer * 3.14159 + t) * 0.5 + 0.5;
        
        // Combine quantum effects with layer influence
        float quantumEffect = mix(probability, tunnel, 0.5);
        quantumEffect = mix(quantumEffect, entangled, entanglement);
        quantumEffect = mix(quantumEffect, uncertain, uncertainty);
        quantumEffect *= (1.0 + layerEffect * 0.3);
        
        // Create color based on quantum state and layer
        vec3 baseColor = mix(colorA, colorB, quantumEffect);
        baseColor = mix(baseColor, colorC, dot(superState, vNormal) * 0.5 + 0.5);
        
        // Add quantum state influence
        baseColor = mix(baseColor, vec3(1.0), quantumState * 0.3);
        
        // Add fresnel edge glow with layer variation
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
        fresnel *= (1.0 + layerEffect * 0.5);
        baseColor += vec3(fresnel) * glowIntensity;
        
        // Add field strength effect
        baseColor *= fieldStrength;
        
        // Add particle count influence
        float particleEffect = sin(vPosition.x * particleCount * 0.1 + t) * 
                             cos(vPosition.y * particleCount * 0.1 + t) * 
                             sin(vPosition.z * particleCount * 0.1 + t);
        baseColor += vec3(particleEffect) * 0.2;
        
        // Add dimension projection effect
        float dimensionEffect = sin(dot(vPosition, vec3(1.0, 2.0, 3.0)) * dimensionProjection + t) * 0.5 + 0.5;
        baseColor = mix(baseColor, baseColor * 1.5, dimensionEffect * 0.3);
        
        // Output final color
        gl_FragColor = vec4(baseColor, 1.0);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  }) as THREE.ShaderMaterial & { uniforms: MaterialUniforms };
}

// Create mathematical material with special effects for mathematical forms
export function createMathematicalMaterial(): THREE.ShaderMaterial & { uniforms: MaterialUniforms } {
  const vertexShader = `
    varying vec3 vPosition;
    void main() {
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec3 vPosition;
    
    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
      // Calculate mathematical color based on position
      float x = vPosition.x;
      float y = vPosition.y;
      float z = vPosition.z;
      
      // Use mathematical functions to create interesting patterns
      float hue = abs(sin(x * 3.0) * cos(y * 3.0) * sin(z * 3.0));
      float saturation = 0.8;
      float value = 0.9;
      
      vec3 color = hsv2rgb(vec3(hue, saturation, value));
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide
  }) as THREE.ShaderMaterial & { uniforms: MaterialUniforms };
}

// Main material creation function
export function createMaterial(colorMode: ColorMode): THREE.ShaderMaterial & { uniforms: MaterialUniforms } {
  switch (colorMode) {
    case 'spectralShift':
      return createSpectralShiftMaterial();
    case 'kaleidoscope':
      return createKaleidoscopeMaterial();
    case 'both':
      return createCombinedMaterial();
    case 'hyperspace':
      return createHyperspaceMaterial();
    case 'mathematical':
      return createMathematicalMaterial();
    case 'soundResonance':
      return createSoundResonanceMaterial();
    case 'fractal':
      return createFractalMaterial();
    case 'quantumField':
      return createQuantumFieldMaterial();
    default:
      return createSpectralShiftMaterial();
  }
} 