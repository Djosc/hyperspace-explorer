import { writable } from 'svelte/store';
import type { AppState, AppStore, GeometryType, ColorMode, DimensionMode } from '../types';

// Initial state
const initialState: AppState = {
  geometryType: 'hyperCube',
  colorMode: 'spectralShift',
  complexity: 5,
  symmetry: 8,
  isPlaying: true,
  speed: 1,
  dimensionMode: '3D',
  showAnnotations: true,
  autoRotateDimensions: false
};

// Create store
function createAppStore(): AppStore {
  const { subscribe, set, update } = writable<AppState>(initialState);
  
  return {
    subscribe,
    setGeometryType: (type: GeometryType) => {
      console.log('AppStore: Setting geometry type to', type);
      update(state => ({ ...state, geometryType: type }));
    },
    setColorMode: (mode: ColorMode) => {
      console.log('AppStore: Setting color mode to', mode);
      update(state => ({ ...state, colorMode: mode }));
    },
    setComplexity: (complexity: number) => {
      console.log('AppStore: Setting complexity to', complexity);
      update(state => ({ ...state, complexity }));
    },
    setSymmetry: (symmetry: number) => {
      console.log('AppStore: Setting symmetry to', symmetry);
      update(state => ({ ...state, symmetry }));
    },
    togglePlay: () => {
      update(state => {
        console.log('AppStore: Toggling play state to', !state.isPlaying);
        return { ...state, isPlaying: !state.isPlaying };
      });
    },
    setSpeed: (speed: number) => {
      console.log('AppStore: Setting speed to', speed, 'Type:', typeof speed);
      update(state => {
        console.log('Previous speed:', state.speed, 'New speed:', speed, 'State update:', { ...state, speed });
        return { ...state, speed };
      });
    },
    setDimensionMode: (mode: DimensionMode) => {
      console.log('AppStore: Setting dimension mode to', mode);
      update(state => ({ ...state, dimensionMode: mode }));
    },
    toggleAnnotations: () => {
      update(state => {
        console.log('AppStore: Toggling annotations to', !state.showAnnotations);
        return { ...state, showAnnotations: !state.showAnnotations };
      });
    },
    toggleDimensionRotation: () => {
      update(state => {
        console.log('AppStore: Toggling dimension rotation to', !state.autoRotateDimensions);
        return { ...state, autoRotateDimensions: !state.autoRotateDimensions };
      });
    }
  };
}

export const appStore = createAppStore(); 