# HyperSpace Explorer

An interactive 3D visualization tool for exploring higher-dimensional mathematical geometries using Three.js and Svelte.

![HyperSpace Explorer Screenshot](docs/media/screenshot.png)

## ✨ Features

### 🎨 **Beautiful Visualizations**
- **Klein Bottle**: Mathematically accurate figure-8 immersion 
- **Möbius Strip**: Non-orientable surface visualization
- **Tesseract/4D Hypercube**: Higher-dimensional cube projections
- **Hopf Fibration**: Elegant mathematical fiber bundles
- **Fractal Patterns**: Self-similar geometric structures
- **Quantum Field**: Particle-based field visualizations

### 🌈 **Advanced Shader Materials**
- **Spectral Shift**: Dynamic rainbow color transitions
- **Hyperspace**: Multi-dimensional color projections
- **Kaleidoscope**: Symmetrical color patterns
- **Mathematical**: Position-based analytical coloring
- **Quantum Field**: Uncertainty and entanglement effects

### ⚡ **Interactive Controls**
- **Speed Control**: 0.1x to 3.0x animation speed
- **Complexity & Symmetry**: Adjustable geometry resolution
- **Dimension Modes**: 3D through 10D projections
- **Auto-Rotation**: Smooth multi-dimensional rotations

### 🎮 **Intuitive Navigation**
- **Mouse**: Click & drag to rotate, wheel for zoom
- **Keyboard**: Arrow keys, dimension cycling (W/S)
- **Touch**: Mobile-friendly touch controls

## 📸 Screenshots

<div align="center">
  <img src="docs/screenshots/klein-bottle-view.png" alt="Klein Bottle Visualization" width="45%"/>
  <img src="docs/screenshots/hopf-fibration-view.png" alt="Hopf Fibration Visualization" width="45%"/>
</div>

<div align="center">
  <img src="docs/screenshots/tesseract-4d-view.png" alt="4D Tesseract Visualization" width="45%"/>
  <img src="docs/screenshots/quantum-field-view.png" alt="Quantum Field Visualization" width="45%"/>
</div>

## 🎥 Demo

[![HyperSpace Explorer Demo](docs/media/demo-thumbnail.png)](docs/media/demo.mp4)

*Click to watch a demonstration of HyperSpace Explorer's features*

## 🚀 Quick Start

```bash
# Clone the repository
git clone [repository-url]
cd hyperspace-explorer

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## 🎯 Controls

### Mouse Controls
- **Click + Drag**: Rotate geometry
- **Mouse Wheel**: Z-axis rotation  
- **Alt + Mouse Wheel**: Higher-dimensional rotation
- **Ctrl + Mouse Wheel**: Zoom in/out

### Keyboard Shortcuts
- **W/S**: Cycle through dimensions
- **Arrow Keys**: Rotate X/Y axes
- **Z/X**: Rotate Z-axis
- **Alt + Arrows**: Rotate W/V axes (4D+)
- **PageUp/PageDown**: Adjust dimension projection

## 🛠️ Tech Stack

- **Frontend**: Svelte + TypeScript
- **3D Graphics**: Three.js with custom shaders
- **Animation**: GSAP for smooth transitions
- **Build Tool**: Vite for fast development
- **Styling**: Modern CSS with backdrop filters

## 🌐 Browser Support

- ✅ **Chrome/Chromium** (recommended)
- ✅ **Firefox** 
- ✅ **Safari**
- ✅ **Edge**

*Requires WebGL support. WebGL 2 recommended for optimal performance.*

## 📊 Performance Features

- **Automatic Quality Adjustment**: Adapts to device capabilities
- **WebGL 2/1 Fallback**: Ensures broad compatibility  
- **Frame Rate Monitoring**: Maintains smooth 60fps
- **Optimized Shaders**: Efficient GPU rendering

## 🎨 Geometry Types

| Type | Description |
|------|-------------|
| **Klein Bottle** | Non-orientable surface with mathematically precise curves |
| **Möbius Strip** | Single-sided surface demonstrating topological concepts |
| **Tesseract** | 4D hypercube with perspective projection to 3D |
| **Hopf Fibration** | Beautiful mathematical fiber bundle visualization |
| **Quantum Field** | Particle-based field with uncertainty visualization |
| **Fractals** | Self-similar patterns with infinite detail |

## 🔧 Development

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Inspired by higher-dimensional mathematics and topology
- Built with modern web technologies for optimal performance  
- Special thanks to the Three.js and Svelte communities

---

*Explore the beauty of mathematics through interactive 3D visualization* ✨
