# HyperSpace Explorer

An interactive visualization tool for exploring higher-dimensional spaces and mathematical concepts using Three.js and Svelte.

![HyperSpace Explorer Screenshot](docs/media/screenshot.png)

## Features

- **Higher Dimensional Visualization**: Explore geometries from 3D up to 10D with intuitive projections
- **Dynamic Color Modes**:
  - Spectral Shift: Dynamic color transitions based on geometry position
  - Kaleidoscope: Symmetrical color patterns
  - Hyperspace: Dimension-based coloring
  - Combined: Blend of multiple color effects
- **Interactive Controls**:
  - Adjustable complexity and symmetry
  - Speed control for animations
  - Dimension mode selection
  - Auto-rotation through dimensions
- **Geometric Types**:
  - Hypercube/Tesseract
  - Mandala patterns
  - Vortex structures
  - Quantum field visualizations
  - And many more...
- **Animation System**:
  - Smooth transitions between states
  - Multiple rotation patterns
  - Quaternion-based 4D rotations
- **Visual Effects**:
  - Dynamic particle systems
  - Dimension labels
  - Mathematical annotations
  - Edge glow effects

## Demo

[![HyperSpace Explorer Demo](docs/media/demo-thumbnail.png)](docs/media/demo.mp4)

*Click the image above to watch a short demonstration of HyperSpace Explorer*

## Recent Updates

- Added quaternion-based animation system
- Implemented multiple rotation patterns (Spiral, Hypercube, Quantum, Kaleidoscope, Fractal)
- Enhanced shader materials with improved color handling
- Added dimension-specific visual parameters
- Improved performance with optimized animation loop
- Improved mouse rotation controls and fixed auto-rotation toggling

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

## Usage

- Use the control panel to adjust visualization parameters
- Select different geometry types to explore various higher-dimensional structures
- Experiment with color modes to highlight different aspects of the geometry
- Toggle annotations for mathematical insights
- Adjust complexity and symmetry to modify the geometric structures
- Use dimension mode to focus on specific dimensional aspects

## Technical Details

Built with:
- Svelte for UI components
- Three.js for 3D rendering
- Custom GLSL shaders for advanced visual effects
- TypeScript for type safety
- Vite for fast development and building

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Inspired by mathematical concepts in higher-dimensional geometry
- Built with modern web technologies for optimal performance
- Special thanks to the Three.js community for their excellent documentation and examples
