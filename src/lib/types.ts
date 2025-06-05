import * as THREE from 'three';

/**
 * Color mode types for post-processing effects
 */
export type ColorMode = 'spectralShift' | 'kaleidoscope' | 'both' | 'hyperspace' | 'mathematical' | 'soundResonance' | 'fractal' | 'quantumField' | 'juliaSet';

/**
 * Effect types for post-processing
 */
export type EffectType = 'rgbShift' | 'kaleidoscope' | 'none';

/**
 * Geometry types
 */
export type GeometryType =
  | 'hyperCube'
  | 'mandala'
  | 'vortex'
  | 'neuronal'
  | 'tesseract'
  | 'hypersphere'
  | 'fractal'
  | 'quantumField'
  | 'hopfFibration'
  | 'hopfTubes'
  | 'hopfRibbons'
  | 'hopfEducational'
  | 'goldenSpiral'
  | 'piSpiral'
  | 'kleinBottle'
  | 'mobiusStrip'
  | 'torusKnot'
  | 'kochSnowflake'
  | 'juliaSet';

/**
 * Dimension exploration modes
 */
export type DimensionMode = '3D' | '4D' | '5D' | '6D' | '7D' | '8D' | '9D' | '10D' | 'all';

/**
 * Effect parameters interface
 */
export interface EffectParams {
  amount?: number;
  angle?: number;
  sides?: number;
}

/**
 * Geometry options interface
 */
export interface GeometryOptions {
  complexity: number;
  symmetry: number;
}

/**
 * Audio data interface
 */
export interface AudioData {
  frequency: number;
  // Add other audio data properties as needed
}

/**
 * Application state interface
 */
export interface AppState {
  geometryType: GeometryType;
  complexity: number;
  symmetry: number;
  colorMode: ColorMode;
  isPlaying: boolean;
  speed: number;
  dimensionMode: DimensionMode;
  showAnnotations: boolean;
  autoRotateDimensions: boolean;
}

export interface AppStore {
  subscribe: (callback: (state: AppState) => void) => () => void;
  setGeometryType: (type: GeometryType) => void;
  setColorMode: (mode: ColorMode) => void;
  setComplexity: (complexity: number) => void;
  setSymmetry: (symmetry: number) => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  setDimensionMode: (mode: DimensionMode) => void;
  toggleAnnotations: () => void;
  toggleDimensionRotation: () => void;
} 