# HyperSpace Explorer - Technical Documentation

## Project Overview

HyperSpace Explorer is an interactive 3D visualization application built with Svelte and Three.js. It allows users to explore various geometric forms with customizable visual effects and animations.

## Technical Stack

- **Frontend Framework**: Svelte
- **3D Rendering**: Three.js
- **State Management**: Svelte Stores
- **Build Tool**: Vite
- **Language**: TypeScript

## Architecture

The application follows a component-based architecture with the following structure:

1. **Core Components**:
   - `Scene.svelte`: Main container for Three.js scene, camera, and renderer
   - `Geometry.svelte`: Handles 3D geometry creation and manipulation
   - `PostProcessing.svelte`: Manages visual effects and post-processing
   - `Controls.svelte`: UI controls for user interaction

2. **State Management**:
   - `appStore.ts`: Central store for application state
   - Manages animation state, color modes, geometry types, and other parameters

3. **Shaders**:
   - `RGBShiftShader.ts`: Custom shader for RGB shift effect
   - `KaleidoscopeShader.ts`: Custom shader for kaleidoscope effect

4. **Types**:
   - `types.ts`: TypeScript type definitions for the application

## Component Details

### Scene.svelte

The Scene component is the main container for the Three.js scene. It:
- Initializes the Three.js scene, camera, and renderer
- Manages the animation loop
- Handles window resizing
- Coordinates between Geometry and PostProcessing components
- Provides cleanup on component destruction

### Geometry.svelte

The Geometry component:
- Creates and manages 3D geometries based on user selection
- Supports multiple geometry types (hyperCube, mandala, vortex, neuronal)
- Handles geometry updates and animations
- Provides methods for geometry manipulation

### PostProcessing.svelte

The PostProcessing component:
- Manages post-processing effects
- Implements custom shaders for visual effects
- Handles render targets for multi-pass rendering
- Provides methods for effect application and parameter updates

### Controls.svelte

The Controls component:
- Provides UI for user interaction
- Connects to the appStore for state management
- Offers controls for animation, color modes, geometry types, and parameters

## State Management

The application uses Svelte's built-in store for state management:

```typescript
// appStore.ts
import { writable } from 'svelte/store';
import type { AppState, ColorMode, GeometryType } from '../types';

const initialState: AppState = {
  isRunning: false,
  colorMode: 'spectralShift',
  geometryType: 'hyperCube',
  complexity: 3,
  symmetry: 8,
  rotationSpeed: 0.003,
  cameraAnimation: false,
  audioReactive: false
};

const createAppStore = () => {
  const { subscribe, set, update } = writable<AppState>(initialState);

  return {
    subscribe,
    toggleAnimation: () => update(state => ({ ...state, isRunning: !state.isRunning })),
    setColorMode: (mode: ColorMode) => update(state => ({ ...state, colorMode: mode })),
    setGeometryType: (type: GeometryType) => update(state => ({ ...state, geometryType: type })),
    setComplexity: (complexity: number) => update(state => ({ ...state, complexity })),
    setSymmetry: (symmetry: number) => update(state => ({ ...state, symmetry })),
    setRotationSpeed: (speed: number) => update(state => ({ ...state, rotationSpeed: speed })),
    toggleCameraAnimation: () => update(state => ({ ...state, cameraAnimation: !state.cameraAnimation })),
    toggleAudioReactivity: () => update(state => ({ ...state, audioReactive: !state.audioReactive })),
    reset: () => set(initialState)
  };
};

export const appStore = createAppStore();
```

## Custom Shaders

The application includes custom shaders for visual effects:

### RGBShiftShader

```glsl
// Fragment shader
uniform sampler2D tDiffuse;
uniform float amount;
uniform float angle;
varying vec2 vUv;

void main() {
  vec2 offset = amount * vec2(cos(angle), sin(angle));
  
  vec4 cr = texture2D(tDiffuse, vUv + offset);
  vec4 cg = texture2D(tDiffuse, vUv);
  vec4 cb = texture2D(tDiffuse, vUv - offset);
  
  gl_FragColor = vec4(cr.r, cg.g, cb.b, cg.a);
}
```

### KaleidoscopeShader

```glsl
// Fragment shader
uniform sampler2D tDiffuse;
uniform float sides;
varying vec2 vUv;

void main() {
  vec2 p = vUv - 0.5;
  float r = length(p);
  float theta = atan(p.y, p.x);
  float angle = 2.0 * 3.14159 / sides;
  theta = mod(theta, angle);
  if (theta > angle * 0.5) {
    theta = angle - theta;
  }
  vec2 q = vec2(cos(theta), sin(theta)) * r + 0.5;
  gl_FragColor = texture2D(tDiffuse, q);
}
```

## Development Progression

1. **Initial Setup**:
   - Created Svelte project with Vite
   - Set up TypeScript configuration
   - Installed Three.js dependencies

2. **Core Components**:
   - Implemented Scene component for Three.js integration
   - Created Geometry component for 3D object management
   - Developed PostProcessing component for visual effects
   - Built Controls component for user interaction

3. **State Management**:
   - Implemented Svelte store for application state
   - Created type definitions for state management
   - Connected components to the store

4. **Visual Effects**:
   - Implemented custom shaders for RGB shift and kaleidoscope effects
   - Created post-processing pipeline for effect application
   - Added support for multiple color modes

5. **Geometry Types**:
   - Implemented hyperCube geometry
   - Added mandala geometry
   - Created vortex geometry
   - Developed neuronal geometry

6. **UI and Controls**:
   - Designed control panel for user interaction
   - Implemented sliders and buttons for parameter adjustment
   - Added toggle controls for animation and effects

## Future Enhancements

1. **Audio Reactivity**:
   - Implement Web Audio API integration
   - Add frequency analysis for audio-reactive effects
   - Create audio-reactive geometry transformations

2. **Additional Effects**:
   - Add more post-processing effects
   - Implement particle systems
   - Create more complex shader combinations

3. **Performance Optimization**:
   - Implement WebGL2 features
   - Add level-of-detail for complex geometries
   - Optimize shader performance

4. **User Experience**:
   - Add preset system for saving and loading configurations
   - Implement touch controls for mobile devices
   - Add tutorial or help system

5. **Export and Sharing**:
   - Add screenshot and video capture functionality
   - Implement configuration export and import
   - Create sharing capabilities for configurations 