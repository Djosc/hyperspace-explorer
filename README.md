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
- **Many More**

### 🌈 **Advanced Shader Materials**
- **Spectral Shift**: Dynamic rainbow color transitions
- **Hyperspace**: Multi-dimensional color projections
- **Kaleidoscope**: Symmetrical color patterns
- **Mathematical**: Position-based analytical coloring
- **Quantum Field**: Uncertainty effects
- **Many More**

### ⚡ **Interactive Controls**
- **Speed Control**: 0.1x to 3.0x animation speed
- **Complexity & Symmetry**: Adjustable geometry resolution
- **Dimension Modes**: 3D through 10D projections
- **Auto-Rotation**: Smooth multi-dimensional rotations

### 🎮 **Intuitive Navigation**
- **Mouse**: Click & drag to rotate when animation is paused
- **Keyboard**: Detailed controls (see below)

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
git clone https://github.com/Djosc/hyperspace-explorer.git
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
*Requires WebGL support. WebGL 2 recommended for optimal performance.*

## 📊 Performance Features

- **Automatic Quality Adjustment**: Adapts to device capabilities
- **WebGL 2/1 Fallback**: Ensures broad compatibility  
- **Frame Rate Monitoring**: Maintains smooth 60fps
- **Optimized Shaders**: Efficient GPU rendering

## 🎨 Geometry Types

### 🔘 **Topological Surfaces**
| Type | Mathematical Description | Key Features |
|------|-------------------------|--------------|
| **Klein Bottle** | Non-orientable surface with figure-8 immersion in ℝ³. Uses precise parametric equations with u < π conditional for proper self-intersection topology. | No distinct inside/outside, mathematically accurate curvature, 1,024+ vertices for smooth visualization |
| **Möbius Strip** | Single-sided surface with half-twist. Parametric: (R + v·cos(u/2))·cos(u), demonstrates fundamental topological concepts. | One-sided surface, continuous edge, proper twist mathematics |

### 📐 **Higher-Dimensional Projections**
| Type | Mathematical Description | Key Features |
|------|-------------------------|--------------|
| **Tesseract (4D Hypercube)** | 4-dimensional hypercube with perspective projection from 4D to 3D. All 16 vertices with correct edge connectivity and quaternion rotations. | 16 vertices, 32 edges, 8 cubic faces, smooth 4D rotation |
| **HyperCube (nD)** | Generalized n-dimensional cube with dynamic dimension projection (3D→10D). Uses bit manipulation for vertex generation. | Scalable dimensions, real-time projection, mathematical precision |
| **Hypersphere** | Higher-dimensional sphere projections with 4D component varying by position. Demonstrates sphere topology in multiple dimensions. | Smooth curved surfaces, dimension-based coloring, topological accuracy |

### 🌀 **Mathematical Fiber Bundles**
| Type | Mathematical Description | Key Features |
|------|-------------------------|--------------|
| **Hopf Fibration (Classic)** | S³→S² fiber bundle visualization. Each point on S² corresponds to a circle (fiber) in S³, creating beautiful interlocked circles. | Point-based fibers, mathematical accuracy, elegant structure |
| **Hopf Fibration (Tubes)** | Tube-based representation with radius 0.02 and 120 segments for smooth circular cross-sections. | Smooth 3D tubes, enhanced visibility, mathematical continuity |
| **Hopf Fibration (Ribbons)** | Ribbon-based visualization (width 0.08, thickness 0.015) showing the flow structure of the fibration. | Flowing ribbon geometry, dynamic materials, enhanced aesthetics |
| **Hopf Fibration (With Base Sphere)** | Educational version with visible base sphere showing the S² base space of the fibration. | Base sphere visible, clear mathematical structure, learning-focused |

### 🔢 **Fractal Geometries**
| Type | Mathematical Description | Key Features |
|------|-------------------------|--------------|
| **Julia Set (3D)** | 3D visualization of Julia set fractals using complex dynamics z²+c. Projects 3D positions to complex plane with dimension rotation. | Complex number iteration, escape-time coloring, higher-dimensional projection |
| **Fractal Patterns** | Self-similar recursive structures with configurable iteration depth. Uses tetrahedron subdivision for 3D fractal generation. | Recursive subdivision, infinite detail, mathematical self-similarity |
| **Koch Snowflake** | 3D interpretation of the Koch curve with triangular recursive patterns and random perturbations for organic appearance. | Recursive triangular patterns, organic randomization, fractal dimension |

### ⚛️ **Physics-Inspired Visualizations**
| Type | Mathematical Description | Key Features |
|------|-------------------------|--------------|
| **Quantum Field** | Particle-based field simulation with uncertainty principle and quantum entanglement effects. 3,000+ particles with physics-based motion. | Uncertainty visualization, entanglement effects, probabilistic motion |
| **Vortex** | Spiral structures with configurable complexity and symmetry. Mathematical spiral equations with upward flow. | Fluid-like motion, configurable parameters, smooth spiral mathematics |
| **Neuronal** | Network-based visualization with spherical node distribution and configurable connection density. | Graph theory structure, biological inspiration, network topology |

### 📏 **Mathematical Curves & Spirals**
| Type | Mathematical Description | Key Features |
|------|-------------------------|--------------|
| **Golden Spiral** | Logarithmic spiral based on the golden ratio φ (phi). Radius grows as φ^(t/2π) creating perfect mathematical proportions. | Golden ratio mathematics, natural proportions, infinite spiral |
| **Pi (π) Spiral** | Visualization based on digits of π. Direction changes based on even/odd digits, height varies by digit value. | π digit encoding, mathematical constant visualization, numerical art |
| **Torus Knot** | Parametric knot curves wound around a torus surface. Configurable p,q parameters determine knot type and complexity. | Knot theory mathematics, topological classification, smooth parametric curves |

### 🎭 **Aesthetic & Artistic Geometries**
| Type | Mathematical Description | Key Features |
|------|-------------------------|--------------|
| **Mandala** | Symmetrical patterns with configurable radial symmetry and complex layering. Mathematical polar coordinate transformations. | Radial symmetry, layered complexity, spiritual geometry |
| **Kaleidoscope** | Multi-symmetrical patterns with reflection and rotation groups. Creates complex geometric art from simple mathematical rules. | Reflection groups, rotational symmetry, mathematical art |

*Each geometry type includes real-time parameter adjustment, multiple rendering modes (solid/wireframe), and integration with the advanced shader material system.*

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
