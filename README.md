# HyperSpace Explorer

An interactive visualization tool for exploring higher-dimensional spaces and mathematical concepts using Three.js and Svelte.

![HyperSpace Explorer Screenshot](docs/media/screenshot.png)

## Features

- **Higher Dimensional Visualization**: Explore geometries from 3D up to 10D with intuitive projections
- **Dynamic Color Modes**:
  - Spectral Shift: Dynamic color transitions based on geometry position
  - Kaleidoscope: Symmetrical color patterns
  - Hyperspace: Dimension-based coloring
  - Mathematical: Clean, analytical visualization
  - Combined: Blend of multiple color effects
- **Interactive Controls**:
  - Adjustable complexity and symmetry
  - Speed control for animations
  - Dimension mode selection
  - Auto-rotation through dimensions
  - Advanced parameter controls for specific geometry types
- **Geometric Types**:
  - Hypercube/Tesseract
  - Mandala patterns
  - Vortex structures
  - Quantum field visualizations
  - Fractal patterns
  - Sound resonance visualizations
  - And many more...
- **Animation System**:
  - Smooth transitions between states
  - Multiple rotation patterns
  - Quaternion-based 4D rotations
  - Enhanced black hole effect for geometry transitions
  - Particle burst effects
  - Elastic bounce animations
- **Visual Effects**:
  - Dynamic particle systems
  - Dimension labels
  - Mathematical annotations
  - Edge glow effects
  - Advanced shader-based effects

## Demo

[![HyperSpace Explorer Demo](docs/media/demo-thumbnail.png)](docs/media/demo.mp4)

*Click the image above to watch a short demonstration of HyperSpace Explorer*

## Recent Updates

- Enhanced black hole effect for geometry transitions with particle bursts
- Improved animation system with elastic bounce effects
- Added new geometry types including fractal and sound resonance
- Implemented advanced parameter controls for specific geometry types
- Enhanced WebGL initialization with fallback support
- Improved performance monitoring and optimization
- Added keyboard shortcuts for dimension control
- Enhanced mouse interaction with improved rotation controls

## Technical Details

### Core Technologies
- **Svelte**: Modern UI framework for reactive components
- **Three.js**: Powerful 3D graphics library
- **TypeScript**: Type-safe development
- **Vite**: Fast development and building
- **GSAP**: Advanced animation system

### Key Features
- **WebGL Optimization**:
  - Automatic WebGL 2/1 detection
  - Performance-based quality adjustments
  - Fallback renderer for compatibility
  - Optimized shader compilation

- **Animation System**:
  - GSAP timeline-based transitions
  - Quaternion-based rotation
  - Particle system effects
  - Elastic easing functions

- **Dimension Handling**:
  - Support for 3D to 10D visualization
  - Dimension-specific shader parameters
  - Smooth dimension transitions
  - Higher-dimensional rotation patterns

- **Performance Features**:
  - Frame time monitoring
  - Automatic quality adjustment
  - Optimized geometry updates
  - Efficient particle system

### Keyboard Controls
- **W/S**: Cycle through dimensions
- **Arrow Keys**: Rotate in X/Y plane
- **Z/X**: Rotate in Z axis
- **Alt + Arrow Keys**: Rotate in W/V axes
- **PageUp/PageDown**: Adjust dimension projection
- **Ctrl + Mouse Wheel**: Zoom in/out

### Mouse Controls
- **Click + Drag**: Rotate geometry
- **Mouse Wheel**: Z-axis rotation
- **Alt + Mouse Wheel**: W-axis rotation
- **Ctrl + Mouse Wheel**: Zoom

## Setup

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd hyperspace-explorer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

Note: For optimal performance, use a browser with WebGL 2 support.

## Usage

- Use the control panel to adjust visualization parameters
- Select different geometry types to explore various higher-dimensional structures
- Experiment with color modes to highlight different aspects of the geometry
- Toggle annotations for mathematical insights
- Adjust complexity and symmetry to modify the geometric structures
- Use dimension mode to focus on specific dimensional aspects

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Inspired by mathematical concepts in higher-dimensional geometry
- Built with modern web technologies for optimal performance
- Special thanks to the Three.js community for their excellent documentation and examples
