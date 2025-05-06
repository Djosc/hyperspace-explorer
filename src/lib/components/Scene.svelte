<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
  import { gsap } from 'gsap';
  import { appStore } from '../stores/appStore';
  import type { GeometryType, ColorMode, DimensionMode } from '../types';
  import { createGeometry } from '../utils/geometry';
  import { createMaterial } from '../utils/material';
  import { QuaternionKeyframeTrack, VectorKeyframeTrack } from 'three';

  // Define material uniforms type
  interface MaterialUniforms {
    time?: { value: number };
    opacity?: { value: number };
    fuzziness?: { value: number };
    [key: string]: { value: any } | undefined;
  }

  type CustomShaderMaterial = THREE.ShaderMaterial & { uniforms: MaterialUniforms };

  // Props
  export let scene: THREE.Scene;
  export let camera: THREE.PerspectiveCamera;
  export let controls: OrbitControls;
  export let renderer: THREE.WebGLRenderer;

  // Reactive declarations for props
  $: cameraPosition = camera?.position;
  $: controlsEnabled = controls?.enabled;

  // State
  let geometryType: GeometryType = 'hyperCube';
  let previousGeometryType: GeometryType = 'hyperCube';
  let complexity: number = 5;
  let symmetry: number = 8;
  let colorMode: ColorMode = 'hyperspace';
  let isPlaying: boolean = true;
  let speed: number = 1.0;
  let dimensionMode: DimensionMode = 'all';
  let showAnnotations: boolean = true;
  let dimensionRotationTime: number = 0;
  let dimensionRotationSpeed: number = 0.05;

  // Three.js objects
  let geometry: THREE.BufferGeometry;
  let material: CustomShaderMaterial;
  let mesh: THREE.Mesh<THREE.BufferGeometry, CustomShaderMaterial>;
  let clock: THREE.Clock;
  let time: number = 0;
  let particles: THREE.Points;
  let particleGeometry: THREE.BufferGeometry;
  let particleMaterial: THREE.PointsMaterial | THREE.ShaderMaterial = new THREE.PointsMaterial();
  let dimensionLabels: THREE.Group;
  let animationMixer: THREE.AnimationMixer | null = null;
  let animations: gsap.core.Tween[] = [];
  let dimensionSprites: THREE.Sprite[] = [];
  let annotations: THREE.Group;
  let dimensionProjection: number = 0.5; // Controls how much of the higher dimension is projected
  let particleSystem: { update: (deltaTime: number) => void } | null = null;
  let keyHandler: ((event: KeyboardEvent) => void) | null = null;

  // New rotation patterns
  const ROTATION_PATTERNS = {
    SPIRAL: 'spiral',
    HYPERCUBE: 'hypercube',
    QUANTUM: 'quantum',
    KALEIDOSCOPE: 'kaleidoscope',
    FRACTAL: 'fractal'
  };

  let currentPattern = ROTATION_PATTERNS.SPIRAL;
  let rotationPhase = 0;
  let hyperRotationMatrix = new THREE.Matrix4();
  let quaternions = Array(4).fill(null).map(() => new THREE.Quaternion());

  // Add lerp function for smooth interpolation
  function lerp(start: number, end: number, t: number): number {
    return start * (1 - t) + end * t;
  }

  // Add rotation state tracking
  let targetRotationPhase = 0;
  let currentRotationPhase = 0;
  let rotationTransitionTime = 0;
  const ROTATION_TRANSITION_DURATION = 0.5; // seconds
  let isTransitioning = false;

  // Add debounce mechanism for auto-rotation toggle
  let lastToggleTime = 0;
  const TOGGLE_DEBOUNCE_TIME = 500; // Reduced to 500ms for more responsive toggling
  let autoRotationToggleTimeout: number | null = null; // Track timeout for auto-rotation toggle
  let lastInteractionTime = 0; // Track the last time user interacted with the scene
  const MIN_INTERACTION_INTERVAL = 200; // Reduced to 200ms for more responsive interactions

  // Add mouse interaction variables
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let rotationSpeed = 0.05; // Reduced for smoother rotation
  let dimensionChangeSpeed = 0.05; // Speed for changing dimension projection
  let wasAutoRotating = false; // Track if auto-rotation was enabled before manual control
  let manualRotationActive = false; // Track if manual rotation is currently active
  let lastMouseInteractionTime = 0; // Track the last time mouse interaction occurred
  const MOUSE_DEBOUNCE_TIME = 200; // Reduced to 200ms for more responsive mouse interactions
  
  // Add rotation interpolation variables
  let targetRotation = { x: 0, y: 0, z: 0, w: 0, v: 0 }; // Added w and v for higher dimensions
  let currentRotation = { x: 0, y: 0, z: 0, w: 0, v: 0 }; // Added w and v for higher dimensions
  const ROTATION_INTERPOLATION_SPEED = 0.1; // Speed of rotation interpolation
  let rotationDelta = { x: 0, y: 0, z: 0, w: 0, v: 0 }; // Track rotation changes for smooth interpolation
  
  // Add UI interaction tracking
  let isInteractingWithUI = false; // Track if user is interacting with UI elements
  let uiInteractionTimeout: number | null = null; // Timeout for UI interaction debounce
  const UI_DEBOUNCE_TIME = 300; // 300ms debounce for UI interactions
  
  // Add UI element tracking
  let uiElements: HTMLElement[] = []; // Track UI elements that should be excluded from rotation

  // Add zoom control variables
  let zoomSpeed = 0.1; // Speed for zooming
  let minFOV = 30; // Minimum field of view (zoomed in)
  let maxFOV = 90; // Maximum field of view (zoomed out)

  // Add a flag to control rotation updates
  let shouldUpdateRotation = true;

  // Function to safely toggle auto-rotation with debounce
  function safeToggleAutoRotation(enable: boolean) {
    const currentTime = Date.now();
    if (currentTime - lastToggleTime > TOGGLE_DEBOUNCE_TIME) {
      if ($appStore.autoRotateDimensions !== enable) {
        // Store current rotation state before toggling
        const currentRotationState = {
          x: mesh?.rotation.x || 0,
          y: mesh?.rotation.y || 0,
          z: mesh?.rotation.z || 0,
          w: currentRotation.w,
          v: currentRotation.v
        };
        
        // Toggle the auto-rotation state
        appStore.toggleDimensionRotation();
        lastToggleTime = currentTime;
        
        // If we're disabling auto-rotation, preserve the current rotation
        if (!enable && mesh) {
          // Set target rotation to current rotation to prevent reset
          targetRotation = { ...currentRotationState };
          currentRotation = { ...currentRotationState };
          rotationDelta = { x: 0, y: 0, z: 0, w: 0, v: 0 };
        }
      }
    }
  }

  // Function to pause auto-rotation
  function pauseAutoRotation() {
    // Don't pause auto-rotation if we're interacting with UI
    if (isInteractingWithUI) {
      console.log('Ignoring pause request - UI interaction active');
      return;
    }
    
    if ($appStore.autoRotateDimensions) {
      const currentTime = Date.now();
      if (currentTime - lastInteractionTime > MIN_INTERACTION_INTERVAL) {
        console.log('Pausing auto-rotation');
        // Store current rotation state before toggling
        const currentRotationState = {
          x: mesh?.rotation.x || 0,
          y: mesh?.rotation.y || 0,
          z: mesh?.rotation.z || 0,
          w: currentRotation.w,
          v: currentRotation.v
        };
        
        // Toggle auto-rotation off
        appStore.toggleDimensionRotation();
        lastInteractionTime = currentTime;
        
        // Preserve the current rotation
        targetRotation = { ...currentRotationState };
        currentRotation = { ...currentRotationState };
        rotationDelta = { x: 0, y: 0, z: 0, w: 0, v: 0 };
        wasAutoRotating = true;
      }
    }
  }

  // Function to resume auto-rotation
  function resumeAutoRotation() {
    // Don't resume auto-rotation if we're interacting with UI
    if (isInteractingWithUI) {
      console.log('Ignoring resume request - UI interaction active');
      return;
    }
    
    if (!$appStore.autoRotateDimensions && wasAutoRotating) {
      const currentTime = Date.now();
      if (currentTime - lastToggleTime > TOGGLE_DEBOUNCE_TIME) {
        console.log('Resuming auto-rotation');
        // Store current rotation state before toggling
        const currentRotationState = {
          x: mesh?.rotation.x || 0,
          y: mesh?.rotation.y || 0,
          z: mesh?.rotation.z || 0,
          w: currentRotation.w,
          v: currentRotation.v
        };
        
        // Toggle auto-rotation on
        appStore.toggleDimensionRotation();
        lastToggleTime = currentTime;
        
        // Preserve the current rotation
        targetRotation = { ...currentRotationState };
        currentRotation = { ...currentRotationState };
        rotationDelta = { x: 0, y: 0, z: 0, w: 0, v: 0 };
      }
      wasAutoRotating = false;
    }
  }

  // Subscribe to store
  $: {
    const newGeometryType = $appStore.geometryType;
    const newComplexity = $appStore.complexity;
    const newSymmetry = $appStore.symmetry;
    const newColorMode = $appStore.colorMode;
    const newDimensionMode = $appStore.dimensionMode;
    
    console.log('Store update detected:', {
      geometryType: newGeometryType,
      complexity: newComplexity,
      symmetry: newSymmetry,
      colorMode: newColorMode,
      dimensionMode: newDimensionMode
    });
    
    // Update local state
    geometryType = newGeometryType;
    complexity = newComplexity;
    symmetry = newSymmetry;
    colorMode = newColorMode;
    dimensionMode = newDimensionMode;
    isPlaying = $appStore.isPlaying;
    speed = $appStore.speed;
    showAnnotations = $appStore.showAnnotations;

    // Force geometry update when these values change
    if (newGeometryType || newComplexity || newSymmetry) {
      console.log('Triggering geometry update');
      updateGeometry();
    }
  }

  // Separate function for geometry updates
  function updateGeometry() {
    if (!scene || !camera || !renderer) return;

    const isGeometryTypeChange = geometryType !== $appStore.geometryType;
    geometryType = $appStore.geometryType;

    // Store original scale and position
    const originalScale = mesh ? mesh.scale.clone() : new THREE.Vector3(1, 1, 1);
    const originalPosition = mesh ? mesh.position.clone() : new THREE.Vector3(0, 0, 0);

    // Create a timeline for the transition
    const timeline = gsap.timeline({
      onComplete: () => {
        console.log('Geometry transition complete');
        createAnimations();
      }
    });

    if (isGeometryTypeChange && mesh) {
      console.log('Starting geometry type change animation');
      
      // First, ensure the mesh is at its original scale
      mesh.scale.set(1, 1, 1);
      mesh.position.set(0, 0, 0);
      mesh.rotation.set(0, 0, 0);

      // Black hole effect - more dramatic collapse
      timeline.to(mesh.scale, {
        x: 0.0001, // Much smaller scale for more dramatic effect
        y: 0.0001,
        z: 0.0001,
        duration: 2.0, // Shorter duration for more responsive feel
        ease: "power4.in", // More aggressive easing
        onUpdate: () => {
          if (mesh) {
            // More dramatic spiral rotation during collapse
            mesh.rotation.y += 0.3;
            mesh.rotation.z += 0.15;
            mesh.rotation.x = Math.sin(Date.now() * 0.03) * 0.8;
            
            // More dramatic position shift
            mesh.position.y = Math.sin(Date.now() * 0.04) * 0.3;
            mesh.position.x = Math.cos(Date.now() * 0.04) * 0.3;
            mesh.position.z = Math.sin(Date.now() * 0.03) * 0.2;

            // Add a more pronounced wobble effect
            const wobble = Math.sin(Date.now() * 0.08) * 0.15;
            mesh.scale.x += wobble;
            mesh.scale.y += wobble;
            mesh.scale.z += wobble;
          }
        }
      });

      // Add particle burst effect for black hole
      const particleCount = 3000; // More particles
      const particles = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 0.3; // Larger initial radius

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        // More vibrant colors
        colors[i * 3] = Math.random() * 0.8 + 0.2; // Brighter reds
        colors[i * 3 + 1] = Math.random() * 0.8 + 0.2; // Brighter greens
        colors[i * 3 + 2] = Math.random() * 0.8 + 0.2; // Brighter blues

        sizes[i] = Math.random() * 0.8; // Larger particles
      }

      particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      const particleSystem = new THREE.Points(particles, particleMaterial);
      particleSystem.position.copy(mesh.position);
      scene.add(particleSystem);

      // Animate particles - more dramatic burst
      timeline.to(particleSystem.scale, {
        x: 40, // Larger scale
        y: 40,
        z: 40,
        duration: 2.0, // Shorter duration
        ease: "power2.out",
        onUpdate: () => {
          const positions = particles.attributes.position.array;
          for (let i = 0; i < positions.length; i += 3) {
            positions[i] *= 1.12; // Faster expansion
            positions[i + 1] *= 1.12;
            positions[i + 2] *= 1.12;
          }
          particles.attributes.position.needsUpdate = true;
        },
        onComplete: () => {
          scene.remove(particleSystem);
          particles.dispose();
          particleMaterial.dispose();
        }
      }, "-=1.5"); // More overlap with collapse

      // Remove old mesh and create new geometry
      timeline.call(() => {
        if (mesh) {
          scene.remove(mesh);
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            mesh.material.dispose();
          }
        }

        geometry = createGeometry($appStore.geometryType, $appStore.complexity, $appStore.symmetry);
        material = createMaterial($appStore.colorMode);

        mesh = new THREE.Mesh(geometry, material);
        mesh.scale.set(0.0001, 0.0001, 0.0001); // Start from collapsed state
        mesh.visible = false; // Make new mesh invisible initially
        scene.add(mesh);
        animationMixer = new THREE.AnimationMixer(mesh);
      });

      // Make mesh visible and start expansion
      timeline.call(() => {
        if (mesh) {
          mesh.visible = true;
        }
      });

      // First expansion - white hole explosion
      timeline.to(mesh.scale, {
        x: originalScale.x * 4.0, // Larger explosion
        y: originalScale.y * 4.0,
        z: originalScale.z * 4.0,
        duration: 1.0, // Shorter duration
        ease: "power2.out",
        onUpdate: () => {
          if (mesh) {
            mesh.rotation.y -= 0.4; // Faster rotation
            mesh.rotation.z -= 0.2;
            mesh.rotation.x = Math.sin(Date.now() * 0.04) * 1.0; // More dramatic wobble
          }
        }
      });

      // Add glow effect for higher complexity
      if ($appStore.complexity > 0.5) {
        const glowMaterial = createMaterial($appStore.colorMode);
        if (glowMaterial.uniforms && glowMaterial.uniforms.opacity) {
          glowMaterial.uniforms.opacity.value = 0.8; // More visible glow
        }
        glowMaterial.side = THREE.BackSide;
        
        const glowMesh = new THREE.Mesh<THREE.BufferGeometry, CustomShaderMaterial>(geometry.clone(), glowMaterial);
        glowMesh.scale.multiplyScalar(1.8); // Larger glow
        glowMesh.visible = false; // Make glow mesh invisible initially
        scene.add(glowMesh);
        
        // Make glow mesh visible
        timeline.call(() => {
          if (glowMesh) {
            glowMesh.visible = true;
          }
        });
        
        timeline.to(glowMesh.scale, {
          x: glowMesh.scale.x * 5.0, // Larger expansion
          y: glowMesh.scale.y * 5.0,
          z: glowMesh.scale.z * 5.0,
          duration: 1.5, // Shorter duration
          ease: "power2.out",
          onComplete: () => {
            scene.remove(glowMesh);
            glowMesh.geometry.dispose();
            glowMesh.material.dispose();
          }
        }, "-=0.8");
      }

      // Second expansion - elastic bounce
      timeline.to(mesh.scale, {
        x: originalScale.x * 2.0, // Larger bounce
        y: originalScale.y * 2.0,
        z: originalScale.z * 2.0,
        duration: 0.8, // Shorter duration
        ease: "elastic.out(1, 0.3)", // More elastic
        onUpdate: () => {
          if (mesh) {
            mesh.rotation.y += 0.2;
            mesh.rotation.z += 0.1;
            mesh.rotation.x = Math.sin(Date.now() * 0.03) * 0.6;
          }
        }
      });

      // Final settling to original scale
      timeline.to(mesh.scale, {
        x: originalScale.x,
        y: originalScale.y,
        z: originalScale.z,
        duration: 1.5, // Shorter duration
        ease: "elastic.out(1, 0.2)", // More elastic
        onUpdate: () => {
          if (mesh) {
            mesh.rotation.y += 0.1;
            mesh.rotation.z += 0.05;
            mesh.rotation.x = Math.sin(Date.now() * 0.02) * 0.4;
          }
        }
      });

      // Add final flourish
      timeline.to(mesh.rotation, {
        y: mesh.rotation.y + Math.PI * 2,
        duration: 2.0, // Shorter duration
        ease: "power2.inOut",
        onUpdate: () => {
          if (mesh) {
            const pulse = Math.sin(Date.now() * 0.004) * 0.12; // Larger pulse
            mesh.scale.setScalar(1 + pulse);
          }
        }
      });
    } else {
      // For non-geometry type changes, still ensure proper scaling
      if (mesh) {
        mesh.visible = false; // Make mesh invisible initially
        mesh.scale.set(0.0001, 0.0001, 0.0001); // Start from collapsed state
      }

      // Remove old mesh and dispose of old geometry and material
      if (mesh) {
        scene.remove(mesh);
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          mesh.material.dispose();
        }
      }

      // Create new geometry
      geometry = createGeometry($appStore.geometryType, $appStore.complexity, $appStore.symmetry);
      material = createMaterial($appStore.colorMode);

      mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(0.0001, 0.0001, 0.0001); // Start from collapsed state
      scene.add(mesh);

      // Initialize animation mixer with the mesh
      animationMixer = new THREE.AnimationMixer(mesh);

      // Make mesh visible and scale up
      timeline.call(() => {
        if (mesh) {
          mesh.visible = true;
        }
      });

      // Scale up animation
      timeline.to(mesh.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1.0,
        ease: "elastic.out(1, 0.3)",
        onUpdate: () => {
          if (mesh) {
            mesh.rotation.y += 0.1;
            mesh.rotation.z += 0.05;
            mesh.rotation.x = Math.sin(Date.now() * 0.02) * 0.4;
          }
        }
      });

      // Subtle fuzzy effect for other parameter changes
      if (material.uniforms && material.uniforms.opacity) {
        timeline.to(material.uniforms.opacity, {
          value: 0.4,
          duration: 0.2,
          ease: "power2.inOut"
        });
      }

      if (material.uniforms && material.uniforms.fuzziness) {
        timeline.to(material.uniforms.fuzziness, {
          value: 0.3,
          duration: 0.2,
          ease: "power2.inOut"
        });
      }

      if (material.uniforms && material.uniforms.opacity) {
        timeline.to(material.uniforms.opacity, {
          value: 0.8,
          duration: 0.2,
          ease: "power2.inOut"
        });
      }

      if (material.uniforms && material.uniforms.fuzziness) {
        timeline.to(material.uniforms.fuzziness, {
          value: 0,
          duration: 0.2,
          ease: "power2.inOut"
        });
      }
    }

    // Update animations based on play state
    createAnimations();
  }

  // Update material when color mode changes
  $: if ($appStore.colorMode && material) {
    const newMaterial = createMaterial($appStore.colorMode);
    if (mesh) {
      mesh.material = newMaterial;
      if (material) material.dispose();
      material = newMaterial;
    }
  }

  // Update dimension mode only when it changes
  $: if (dimensionMode && material && 'uniforms' in material && material.uniforms) {
    updateDimensionProjection();
  }

  // Update annotations visibility only when it changes
  $: if (annotations && showAnnotations !== undefined) {
    annotations.visible = showAnnotations;
  }

  // Create enhanced particle system
  function createParticleSystem() {
    // Increase particle count for more density
    const particleCount = 2000;
    
    // Create arrays for particle attributes
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3);
    const phases = new Float32Array(particleCount);
    
    // Color palette based on current color mode
    const colorPalettes = {
      spectralShift: [
        new THREE.Color(0xff0000), // Red
        new THREE.Color(0xff7f00), // Orange
        new THREE.Color(0xffff00), // Yellow
        new THREE.Color(0x00ff00), // Green
        new THREE.Color(0x0000ff), // Blue
        new THREE.Color(0x4b0082), // Indigo
        new THREE.Color(0x9400d3)  // Violet
      ],
      kaleidoscope: [
        new THREE.Color(0xff00ff), // Magenta
        new THREE.Color(0x00ffff), // Cyan
        new THREE.Color(0xffff00), // Yellow
        new THREE.Color(0xff0000), // Red
        new THREE.Color(0x00ff00), // Green
        new THREE.Color(0x0000ff)  // Blue
      ],
      both: [
        new THREE.Color(0xff00ff), // Magenta
        new THREE.Color(0x00ffff), // Cyan
        new THREE.Color(0xffff00), // Yellow
        new THREE.Color(0xff0000), // Red
        new THREE.Color(0x00ff00), // Green
        new THREE.Color(0x0000ff)  // Blue
      ],
      hyperspace: [
        new THREE.Color(0x0000ff), // Blue
        new THREE.Color(0x00ffff), // Cyan
        new THREE.Color(0x00ff00), // Green
        new THREE.Color(0xffff00), // Yellow
        new THREE.Color(0xff0000)  // Red
      ],
      mathematical: [
        new THREE.Color(0xffffff), // White
        new THREE.Color(0x00ffff), // Cyan
        new THREE.Color(0x0000ff), // Blue
        new THREE.Color(0x000080)  // Navy
      ],
      soundResonance: [
        new THREE.Color(0xff0000), // Red
        new THREE.Color(0xff7f00), // Orange
        new THREE.Color(0xffff00), // Yellow
        new THREE.Color(0x00ff00), // Green
        new THREE.Color(0x0000ff)  // Blue
      ],
      fractal: [
        new THREE.Color(0x00ff00), // Green
        new THREE.Color(0x008000), // Dark Green
        new THREE.Color(0x0000ff), // Blue
        new THREE.Color(0x000080)  // Navy
      ],
      quantumField: [
        new THREE.Color(0x0000ff), // Blue
        new THREE.Color(0x00ffff), // Cyan
        new THREE.Color(0xffffff), // White
        new THREE.Color(0x000080)  // Navy
      ]
    };
    
    // Get current color palette or default to spectralShift
    const currentPalette = colorPalettes[colorMode] || colorPalettes.spectralShift;
    
    // Create different particle patterns based on geometry type
    for (let i = 0; i < particleCount; i++) {
      // Determine particle pattern based on geometry type
      let radius, theta, phi;
      
      switch(geometryType) {
        case 'hyperCube':
        case 'tesseract':
          // Cubic distribution for hypercube
          const cubeSize = 10;
          positions[i * 3] = (Math.random() - 0.5) * cubeSize;
          positions[i * 3 + 1] = (Math.random() - 0.5) * cubeSize;
          positions[i * 3 + 2] = (Math.random() - 0.5) * cubeSize;
          break;
          
        case 'mandala':
          // Spiral distribution for mandala
          const spiralRadius = 2 + Math.random() * 8;
          const spiralAngle = Math.random() * Math.PI * 20;
          positions[i * 3] = spiralRadius * Math.cos(spiralAngle);
          positions[i * 3 + 1] = spiralRadius * Math.sin(spiralAngle);
          positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
          break;
          
        case 'vortex':
          // Vortex distribution
          const vortexRadius = 1 + Math.random() * 9;
          const vortexAngle = Math.random() * Math.PI * 2;
          const vortexHeight = (Math.random() - 0.5) * 10;
          positions[i * 3] = vortexRadius * Math.cos(vortexAngle);
          positions[i * 3 + 1] = vortexRadius * Math.sin(vortexAngle);
          positions[i * 3 + 2] = vortexHeight;
          break;
          
        case 'fractal':
          // Fractal-like distribution
          const fractalScale = Math.pow(2, Math.floor(Math.random() * 4));
          const fractalRadius = 2 + Math.random() * 8;
          const fractalAngle = Math.random() * Math.PI * 2 * fractalScale;
          positions[i * 3] = fractalRadius * Math.cos(fractalAngle);
          positions[i * 3 + 1] = fractalRadius * Math.sin(fractalAngle);
          positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
          break;
          
        case 'quantumField':
          // Quantum field distribution with uncertainty
          const quantumRadius = 3 + Math.random() * 7;
          const quantumAngle = Math.random() * Math.PI * 2;
          const quantumHeight = (Math.random() - 0.5) * 8;
          positions[i * 3] = quantumRadius * Math.cos(quantumAngle) + (Math.random() - 0.5) * 2;
          positions[i * 3 + 1] = quantumRadius * Math.sin(quantumAngle) + (Math.random() - 0.5) * 2;
          positions[i * 3 + 2] = quantumHeight + (Math.random() - 0.5) * 2;
          break;
          
        default:
          // Default spherical distribution
          radius = 5 + Math.random() * 5;
          theta = Math.random() * Math.PI * 2;
          phi = Math.acos(2 * Math.random() - 1);
          
          positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
          positions[i * 3 + 2] = radius * Math.cos(phi);
      }
      
      // Assign colors from the current palette
      const colorIndex = Math.floor(Math.random() * currentPalette.length);
      const color = currentPalette[colorIndex];
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      // Vary particle sizes
      sizes[i] = 0.05 + Math.random() * 0.15;
      
      // Add random velocities for movement
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      
      // Add random phases for pulsing effect
      phases[i] = Math.random() * Math.PI * 2;
    }
    
    // Create geometry with all attributes
    particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Store velocities and phases for animation
    particleGeometry.userData.velocities = velocities;
    particleGeometry.userData.phases = phases;
    
    // Create custom shader material for more interesting particles
    const particleVertexShader = `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      uniform float time;
      
      void main() {
        vColor = color;
        
        // Calculate pulsing effect
        float pulse = sin(time * 0.5 + position.x * 0.1 + position.y * 0.1 + position.z * 0.1) * 0.5 + 0.5;
        float finalSize = size * (1.0 + pulse * 0.3);
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = finalSize * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    
    const particleFragmentShader = `
      varying vec3 vColor;
      uniform float time;
      
      void main() {
        // Create a circular particle with soft edges
        float r = 0.0;
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        r = dot(cxy, cxy);
        
        if (r > 1.0) {
          discard;
        }
        
        // Add a subtle glow effect
        float glow = 1.0 - r;
        glow = pow(glow, 2.0);
        
        // Add a subtle color shift based on time
        vec3 finalColor = vColor + vec3(sin(time * 0.2) * 0.05, cos(time * 0.3) * 0.05, sin(time * 0.4) * 0.05);
        
        gl_FragColor = vec4(finalColor, glow);
      }
    `;
    
    // Create shader material
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    // Create particle system
    particles = new THREE.Points(particleGeometry, shaderMaterial);
    scene.add(particles);
    
    // Store reference to update in animation loop
    particleSystem = {
      update: (deltaTime: number) => {
        // Update time uniform for shader
        if (shaderMaterial.uniforms && shaderMaterial.uniforms.time) {
          shaderMaterial.uniforms.time.value += deltaTime;
        }
        
        // Get position attribute
        const positions = particleGeometry.attributes.position.array;
        const velocities = particleGeometry.userData.velocities;
        
        // Update particle positions
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i] * deltaTime * 30;
          positions[i + 1] += velocities[i + 1] * deltaTime * 30;
          positions[i + 2] += velocities[i + 2] * deltaTime * 30;
          
          // Wrap particles around if they go too far
          const maxDistance = 15;
          if (Math.abs(positions[i]) > maxDistance) positions[i] = -Math.sign(positions[i]) * maxDistance;
          if (Math.abs(positions[i + 1]) > maxDistance) positions[i + 1] = -Math.sign(positions[i + 1]) * maxDistance;
          if (Math.abs(positions[i + 2]) > maxDistance) positions[i + 2] = -Math.sign(positions[i + 2]) * maxDistance;
        }
        
        // Mark position attribute as needing update
        particleGeometry.attributes.position.needsUpdate = true;
      }
    };
  }

  // Create dimension labels using sprites
  function createDimensionLabels() {
    dimensionLabels = new THREE.Group();
    
    // Create labels for each dimension
    const dimensions = ['X', 'Y', 'Z', 'W', 'V'];
    const positions = [
      new THREE.Vector3(5, 0, 0),
      new THREE.Vector3(0, 5, 0),
      new THREE.Vector3(0, 0, 5),
      new THREE.Vector3(3, 3, 3),
      new THREE.Vector3(-3, 3, -3)
    ];
    
    // Create canvas for text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 64;
    canvas.height = 64;
    
    dimensions.forEach((dim, i) => {
      if (i < positions.length && context) {
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw text
        context.fillStyle = 'white';
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(dim, canvas.width / 2, canvas.height / 2);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        
        // Create sprite material
        const spriteMaterial = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          depthWrite: false
        });
        
        // Create sprite
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.copy(positions[i]);
        sprite.scale.set(1, 1, 1);
        
        dimensionLabels.add(sprite);
        dimensionSprites.push(sprite);
      }
    });
    
    scene.add(dimensionLabels);
  }

  // Create mathematical annotations
  function createAnnotations() {
    annotations = new THREE.Group();
    
    // Create canvas for text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    
    // Create annotations for different geometry types
    const annotationTexts = {
      hyperCube: 'A 4D hypercube (tesseract) projected into 3D space. Each vertex connects to 4 others.',
      mandala: 'A mandala pattern inspired by sacred geometry and DMT visuals.',
      vortex: 'A spiral vortex representing the flow of consciousness through dimensions.',
      neuronal: 'A neural network visualization representing consciousness and perception.',
      tesseract: 'A tesseract (4D cube) with all 8 cubes visible in 3D projection.',
      hypersphere: 'A 4D hypersphere projected into 3D space, showing curved higher dimensions.',
      hyper5D: 'A 5D hypercube (penteract) projected into 3D space.',
      dmtTunnel: 'A DMT-inspired tunnel representing the journey through higher dimensions.',
      soundResonance: 'A visualization of sound waves resonating through higher dimensions.',
      fractal: 'A recursive fractal pattern exploring self-similarity across dimensions.',
      quantumField: 'A quantum probability field visualization with entangled particles.',
      hyper6D: 'A 6D hypercube projection showing complex dimensional relationships.',
      hyper7D: 'A 7D hypercube revealing intricate higher-dimensional symmetries.',
      hyper8D: 'An 8D hypercube demonstrating advanced dimensional interconnections.',
      hyper9D: 'A 9D hypercube exploring the limits of human spatial perception.',
      hyper10D: 'A 10D hypercube at the boundary of comprehensible dimensional space.',
      hopfFibration: 'A Hopf fibration visualization showing the mapping from 3-sphere to 2-sphere.',
      goldenSpiral: 'A golden spiral based on the golden ratio (φ) and Fibonacci sequence.',
      piSpiral: 'A spiral visualization based on the digits of π.',
      kleinBottle: 'A Klein bottle, a non-orientable surface with no inside or outside.',
      mobiusStrip: 'A Möbius strip, a one-sided surface with no boundary.',
      torusKnot: 'A torus knot, a closed curve on the surface of a torus.'
    };
    
    // Create annotation for current geometry type
    if (context && annotationTexts[geometryType]) {
      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      context.fillStyle = 'rgba(0, 0, 0, 0.7)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw text
      context.fillStyle = 'white';
      context.font = '16px Arial';
      context.textAlign = 'left';
      
      // Word wrap text
      const words = annotationTexts[geometryType].split(' ');
      let line = '';
      let y = 20;
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = context.measureText(testLine);
        
        if (metrics.width > canvas.width - 20) {
          context.fillText(line, 10, y);
          line = words[i] + ' ';
          y += 20;
        } else {
          line = testLine;
        }
      }
      context.fillText(line, 10, y);
      
      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      
      // Create sprite material
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false
      });
      
      // Create sprite
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(0, -4, 0);
      sprite.scale.set(5, 2.5, 1);
      
      annotations.add(sprite);
    }
    
    // Add mathematical formulas
    const formulas = [
      { text: '4D: x² + y² + z² + w² = r²', position: new THREE.Vector3(-4, 3, 0) },
      { text: '5D: x² + y² + z² + w² + v² = r²', position: new THREE.Vector3(4, 3, 0) }
    ];
    
    formulas.forEach(formula => {
      if (context) {
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw text
        context.fillStyle = '#00ffff';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.fillText(formula.text, canvas.width / 2, canvas.height / 2);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        
        // Create sprite material
        const spriteMaterial = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          depthWrite: false
        });
        
        // Create sprite
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.copy(formula.position);
        sprite.scale.set(3, 1.5, 1);
        
        annotations.add(sprite);
      }
    });
    
    scene.add(annotations);
  }

  // Create animations for the current geometry
  function createAnimations() {
    if (!mesh || !$appStore.isPlaying) return;
    
    // Clear any existing animations
    if (animations.length > 0) {
      animations.forEach(anim => anim.kill());
      animations = [];
    }

    // Only create rotation animation if auto-rotation is enabled
    if ($appStore.autoRotateDimensions) {
      const rotationAnimation = gsap.to(mesh.rotation, {
        y: mesh.rotation.y + Math.PI * 2,
        duration: 20,
        ease: "none",
        repeat: -1,
        onUpdate: () => {
          if (mesh) {
            mesh.rotation.x = Math.sin(Date.now() * 0.001) * 0.2;
          }
        }
      });
      animations.push(rotationAnimation);
    }
  }

  // Watch for play state changes
  $: if ($appStore.isPlaying !== undefined) {
    if ($appStore.isPlaying) {
      createAnimations();
    } else {
      // Stop all animations when paused
      animations.forEach(anim => anim.kill());
      animations = [];
    }
  }

  // Watch for auto-rotation changes
  $: if ($appStore.autoRotateDimensions !== undefined) {
    createAnimations();
  }

  // Update dimension projection
  function updateDimensionProjection() {
    if (material && 'uniforms' in material && material.uniforms) {
      if ('dimensionProjection' in material.uniforms && material.uniforms.dimensionProjection && material.uniforms.dimensionProjection.value !== undefined) {
        // If dimensionProjection was manually set (not through dimension mode), use that value
        if (dimensionProjection !== undefined && dimensionProjection !== null) {
          material.uniforms.dimensionProjection.value = dimensionProjection;
        } else {
          // Otherwise, set based on dimension mode
          switch (dimensionMode) {
            case '3D':
              material.uniforms.dimensionProjection.value = 0.2;
              break;
            case '4D':
              material.uniforms.dimensionProjection.value = 0.4;
              break;
            case '5D':
              material.uniforms.dimensionProjection.value = 0.6;
              break;
            case '6D':
              material.uniforms.dimensionProjection.value = 0.7;
              break;
            case '7D':
              material.uniforms.dimensionProjection.value = 0.8;
              break;
            case '8D':
              material.uniforms.dimensionProjection.value = 0.85;
              break;
            case '9D':
              material.uniforms.dimensionProjection.value = 0.9;
              break;
            case '10D':
              material.uniforms.dimensionProjection.value = 0.95;
              break;
            case 'all':
              material.uniforms.dimensionProjection.value = 1.0;
              break;
          }
        }
      }
    }
  }

  // Reactive statement to update dimension projection when it changes
  $: if (dimensionProjection !== undefined) {
    updateDimensionProjection();
  }

  // Update material based on geometry type
  function updateMaterialForGeometryType() {
    if (material && 'uniforms' in material && material.uniforms) {
      // Set specific parameters based on geometry type
      switch (geometryType) {
        case 'soundResonance':
          if ('frequency' in material.uniforms && material.uniforms.frequency && material.uniforms.frequency.value !== undefined) {
            material.uniforms.frequency.value = 440.0 * (complexity / 5);
          }
          if ('amplitude' in material.uniforms && material.uniforms.amplitude && material.uniforms.amplitude.value !== undefined) {
            material.uniforms.amplitude.value = 0.3 + (symmetry / 20);
          }
          if ('resonance' in material.uniforms && material.uniforms.resonance && material.uniforms.resonance.value !== undefined) {
            material.uniforms.resonance.value = 0.5 + (complexity / 10);
          }
          break;
        case 'fractal':
          if ('iteration' in material.uniforms && material.uniforms.iteration && material.uniforms.iteration.value !== undefined) {
            material.uniforms.iteration.value = complexity;
          }
          if ('glowIntensity' in material.uniforms && material.uniforms.glowIntensity && material.uniforms.glowIntensity.value !== undefined) {
            material.uniforms.glowIntensity.value = 0.5 + (symmetry / 20);
          }
          break;
        case 'quantumField':
          if ('particleCount' in material.uniforms && material.uniforms.particleCount && material.uniforms.particleCount.value !== undefined) {
            material.uniforms.particleCount.value = 50 + (complexity * 10);
          }
          if ('entanglement' in material.uniforms && material.uniforms.entanglement && material.uniforms.entanglement.value !== undefined) {
            material.uniforms.entanglement.value = 0.5 + (symmetry / 20);
          }
          if ('uncertainty' in material.uniforms && material.uniforms.uncertainty && material.uniforms.uncertainty.value !== undefined) {
            material.uniforms.uncertainty.value = 0.3 + (complexity / 20);
          }
          break;
        case 'hyper6D':
        case 'hyper7D':
        case 'hyper8D':
        case 'hyper9D':
        case 'hyper10D':
          // Higher dimensions already handled by dimensionProjection
          break;
      }
    }
  }

  // Animate transition
  function animateTransition() {
    if (mesh) {
      // Reset position and rotation
      mesh.position.set(0, 0, 0);
      mesh.rotation.set(0, 0, 0);
      mesh.scale.set(0.1, 0.1, 0.1);
      
      // Animate with GSAP
      gsap.to(mesh.position, {
        y: 0,
        duration: 1.5,
        ease: 'elastic.out(1, 0.5)'
      });
      
      gsap.to(mesh.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1.5,
        ease: 'elastic.out(1, 0.5)'
      });
      
      gsap.to(mesh.rotation, {
        y: Math.PI * 2,
        duration: 2,
        ease: 'power2.inOut'
      });
    }
  }

  // Higher dimensional rotation functions
  function applyHyperRotation(object: THREE.Object3D, deltaTime: number) {
    const speed = $appStore.speed * dimensionRotationSpeed;
    rotationPhase += deltaTime * speed;

    switch (currentPattern) {
      case ROTATION_PATTERNS.SPIRAL:
        // Spiral pattern - continuous rotation in multiple dimensions
        object.rotation.x = Math.sin(rotationPhase * 0.5) * Math.PI;
        object.rotation.y = rotationPhase;
        object.rotation.z = Math.cos(rotationPhase * 0.7) * Math.PI * 0.5;
        break;

      case ROTATION_PATTERNS.HYPERCUBE:
        // Hypercube pattern - quaternion-based 4D rotation
        quaternions[0].setFromAxisAngle(new THREE.Vector3(1, 0, 0), rotationPhase * 0.3);
        quaternions[1].setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationPhase * 0.5);
        quaternions[2].setFromAxisAngle(new THREE.Vector3(0, 0, 1), rotationPhase * 0.2);
        quaternions[3].setFromAxisAngle(new THREE.Vector3(1, 1, 1).normalize(), rotationPhase * 0.4);
        
        object.quaternion.multiplyQuaternions(quaternions[0], quaternions[1]);
        object.quaternion.multiplyQuaternions(object.quaternion, quaternions[2]);
        object.quaternion.multiplyQuaternions(object.quaternion, quaternions[3]);
        break;

      case ROTATION_PATTERNS.QUANTUM:
        // Quantum pattern - probabilistic rotation with uncertainty
        const uncertainty = Math.sin(rotationPhase * 2) * 0.5 + 0.5;
        object.rotation.x += (Math.random() - 0.5) * uncertainty * deltaTime;
        object.rotation.y += (Math.random() - 0.5) * uncertainty * deltaTime;
        object.rotation.z += (Math.random() - 0.5) * uncertainty * deltaTime;
        break;

      case ROTATION_PATTERNS.KALEIDOSCOPE:
        // Kaleidoscopic pattern - symmetrical rotations
        const angle = rotationPhase * 0.5;
        const symmetry = 5; // Number of symmetrical rotations
        for (let i = 0; i < symmetry; i++) {
          const phase = angle + (Math.PI * 2 * i) / symmetry;
          object.rotation.x = Math.sin(phase) * Math.PI;
          object.rotation.y = Math.cos(phase) * Math.PI;
          object.rotation.z = Math.sin(phase * 2) * Math.PI * 0.5;
        }
        break;

      case ROTATION_PATTERNS.FRACTAL:
        // Fractal pattern - self-similar rotation at different scales
        const scale = Math.pow(2, Math.floor(rotationPhase % 4));
        object.rotation.x = Math.sin(rotationPhase * scale) * Math.PI;
        object.rotation.y = Math.cos(rotationPhase * scale) * Math.PI * 0.5;
        object.rotation.z = Math.sin(rotationPhase * scale * 0.5) * Math.PI * 0.25;
        break;
    }

    // Apply dimension warping based on current dimension mode
    if ($appStore.dimensionMode !== '3D') {
      const dimensionFactor = parseInt($appStore.dimensionMode) || 3;
      const warpFactor = Math.sin(rotationPhase * 0.3) * 0.2 + 1;
      object.scale.setScalar(Math.pow(warpFactor, dimensionFactor / 3));
    }
  }

  // Update the update function to respect the shouldUpdateRotation flag
  function update(deltaTime: number) {
    const cappedDelta = Math.min(deltaTime, 0.1);
    time += cappedDelta;

    // Update controls
    if (controls) {
      controls.update();
    }
    
    // Apply smooth rotation interpolation
    if (mesh) {
      // Interpolate current rotation towards target rotation
      currentRotation.x += (targetRotation.x - currentRotation.x) * ROTATION_INTERPOLATION_SPEED;
      currentRotation.y += (targetRotation.y - currentRotation.y) * ROTATION_INTERPOLATION_SPEED;
      currentRotation.z += (targetRotation.z - currentRotation.z) * ROTATION_INTERPOLATION_SPEED;
      currentRotation.w += (targetRotation.w - currentRotation.w) * ROTATION_INTERPOLATION_SPEED;
      currentRotation.v += (targetRotation.v - currentRotation.v) * ROTATION_INTERPOLATION_SPEED;
      
      // Apply interpolated rotation to mesh
      mesh.rotation.x = currentRotation.x;
      mesh.rotation.y = currentRotation.y;
      mesh.rotation.z = currentRotation.z;
      
      // Apply higher dimension rotations through quaternions or matrix transformations
      if (currentRotation.w !== 0 || currentRotation.v !== 0) {
        // Create quaternions for W and V axis rotations
        const wQuaternion = new THREE.Quaternion();
        wQuaternion.setFromAxisAngle(new THREE.Vector3(1, 1, 1).normalize(), currentRotation.w);
        
        const vQuaternion = new THREE.Quaternion();
        vQuaternion.setFromAxisAngle(new THREE.Vector3(-1, 1, -1).normalize(), currentRotation.v);
        
        // Apply quaternions to mesh
        mesh.quaternion.multiplyQuaternions(wQuaternion, mesh.quaternion);
        mesh.quaternion.multiplyQuaternions(vQuaternion, mesh.quaternion);
      }
      
      // Update rotation phase for shader effects
      rotationPhase = currentRotation.y;
    }

    // Only apply auto-rotation if auto-rotation is enabled and manual rotation is not active
    if (mesh && $appStore.autoRotateDimensions && !manualRotationActive && $appStore.isPlaying) {
      applyHyperRotation(mesh, cappedDelta);
    }

    // Update particle system if it exists
    if (particleSystem) {
      particleSystem.update(cappedDelta);
    }

    // Update material uniforms
    if (material && 'uniforms' in material && material.uniforms) {
      if (material.uniforms.time) {
        material.uniforms.time.value = time;
      }
      material.uniforms.rotationPhase = { value: rotationPhase };
      material.uniforms.dimensionFactor = { 
        value: parseInt($appStore.dimensionMode) || 3 
      };
      
      // Add higher dimension rotation uniforms if they exist
      if ('wRotation' in material.uniforms) {
        material.uniforms.wRotation = { value: currentRotation.w };
      }
      if ('vRotation' in material.uniforms) {
        material.uniforms.vRotation = { value: currentRotation.v };
      }
    }
  }

  // Function to handle mouse down event
  function handleMouseDown(event: MouseEvent) {
    // Check if the click is on a UI element
    const target = event.target as HTMLElement;
    
    // Check if the click is on a UI element or its children
    const isUIElement = target.closest('.ui-element') || 
                        target.closest('button') || 
                        target.closest('a') ||
                        target.closest('.controls') ||
                        target.closest('.debug-info') ||
                        target.closest('input') ||
                        target.closest('select') ||
                        target.closest('label');
    
    if (isUIElement) {
      console.log('UI element clicked, ignoring for rotation');
      isInteractingWithUI = true;
      
      // Clear any existing timeout
      if (uiInteractionTimeout !== null) {
        clearTimeout(uiInteractionTimeout);
      }
      
      // Set a timeout to reset the UI interaction flag
      uiInteractionTimeout = window.setTimeout(() => {
        isInteractingWithUI = false;
      }, UI_DEBOUNCE_TIME);
      
      return; // Don't process rotation if interacting with UI
    }
    
    console.log('Scene element clicked, starting rotation');
    isDragging = true;
    previousMousePosition = {
      x: event.clientX,
      y: event.clientY
    };
    
    // Pause auto-rotation when manual control starts
    pauseAutoRotation();
  }

  // Function to handle mouse move event
  function handleMouseMove(event: MouseEvent) {
    // Skip if interacting with UI
    if (isInteractingWithUI) return;
    
    if (!isDragging) return;
    
    const deltaMove = {
      x: event.clientX - previousMousePosition.x,
      y: event.clientY - previousMousePosition.y
    };
    
    // Only process movement if we're actually dragging (not just hovering)
    if (Math.abs(deltaMove.x) > 2 || Math.abs(deltaMove.y) > 2) {
      console.log(`Mouse move: dx=${deltaMove.x.toFixed(2)}, dy=${deltaMove.y.toFixed(2)}`);
      
      // Update rotation deltas for smooth interpolation
      rotationDelta.y += deltaMove.x * 0.01;
      rotationDelta.x += deltaMove.y * 0.01;
      
      // Update target rotation
      targetRotation.y += deltaMove.x * 0.01;
      targetRotation.x += deltaMove.y * 0.01;
      
      // Update dimension projection based on vertical movement
      dimensionProjection = Math.max(0.1, Math.min(1.0, dimensionProjection + deltaMove.y * 0.005));
      updateDimensionProjection();
    }
    
    // Update previous mouse position
    previousMousePosition = {
      x: event.clientX,
      y: event.clientY
    };
  }

  // Function to handle mouse wheel event
  function handleMouseWheel(event: WheelEvent) {
    // Skip if interacting with UI
    if (isInteractingWithUI) return;
    
    // Prevent default scrolling behavior
    event.preventDefault();
    
    // Check if Ctrl key is pressed for zooming
    if (event.ctrlKey) {
      // Use wheel delta for zooming
      const zoomDelta = event.deltaY * 0.01;
      
      // Update camera FOV for zooming
      if (camera) {
        // Adjust FOV based on wheel direction
        const newFOV = camera.fov + zoomDelta * zoomSpeed * 10;
        
        // Clamp FOV between min and max values
        camera.fov = Math.max(minFOV, Math.min(maxFOV, newFOV));
        
        // Update camera projection matrix
        camera.updateProjectionMatrix();
        
        console.log(`Zooming: FOV = ${camera.fov.toFixed(2)}`);
      }
      
      return; // Exit early to prevent other wheel actions
    }
    
    // Use wheel delta for Z-axis rotation
    const wheelDelta = event.deltaY * 0.001;
    
    // Check if Alt key is pressed for W-axis rotation
    if (event.altKey) {
      // Update W-axis rotation when Alt is pressed
      rotationDelta.w += wheelDelta;
      targetRotation.w += wheelDelta;
    } else {
      // Normal Z-axis rotation when Alt is not pressed
      rotationDelta.z += wheelDelta;
      targetRotation.z += wheelDelta;
    }
  }

  // Function to handle mouse up event
  function handleMouseUp() {
    if (isDragging) {
      console.log('Mouse up event triggered');
      isDragging = false;
      
      // Resume auto-rotation after a delay if it was enabled before
      resumeAutoRotation();
    }
  }

  // Function to handle mouse leave event
  function handleMouseLeave() {
    if (isDragging) {
      console.log('Mouse leave event triggered');
      isDragging = false;
      
      // Resume auto-rotation after a delay if it was enabled before
      resumeAutoRotation();
    }
  }

  // Initialize on mount
  onMount(() => {
    clock = new THREE.Clock();
    
    // Set initial camera position
    if (camera) {
      camera.position.set(0, 0, 5);
      camera.lookAt(scene.position);
      
      // Set initial FOV
      camera.fov = 75;
      camera.updateProjectionMatrix();
    }
    
    // Configure OrbitControls for better interaction
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = true;
      controls.enablePan = true;
      controls.enableRotate = true;
      controls.rotateSpeed = 0.5;
      controls.zoomSpeed = 1.0;
      controls.panSpeed = 0.5;
      controls.minDistance = 2;
      controls.maxDistance = 20;
      controls.object.up.set(0, 1, 0);
      controls.update();
    }
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Add point lights
    const pointLight1 = new THREE.PointLight(0xff0000, 1, 10);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x00ff00, 1, 10);
    pointLight2.position.set(-5, -5, -5);
    scene.add(pointLight2);
    
    const pointLight3 = new THREE.PointLight(0x0000ff, 1, 10);
    pointLight3.position.set(0, 0, -5);
    scene.add(pointLight3);

    // Create background particles
    createParticleSystem();
    
    // Create dimension labels
    createDimensionLabels();
    
    // Create annotations
    createAnnotations();
    
    // Initialize rotation state
    currentRotationPhase = 0;
    targetRotationPhase = 0;
    rotationPhase = 0;
    isTransitioning = false;
    
    // Initialize rotation vectors
    currentRotation = { x: 0, y: 0, z: 0, w: 0, v: 0 };
    targetRotation = { x: 0, y: 0, z: 0, w: 0, v: 0 };
    rotationDelta = { x: 0, y: 0, z: 0, w: 0, v: 0 };
    
    // Enable auto-rotation through dimensions
    appStore.toggleDimensionRotation();
    lastToggleTime = Date.now();
    
    // Set up keyboard controls for dimension rotation
    keyHandler = (event: KeyboardEvent) => {
      // Only handle dimension rotation when not playing
      if (!isPlaying) {
        // Ignore key interactions during geometry transitions
        if (isTransitioning) return;
        
        // Check if this is a rotation key
        const isRotationKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'z', 'Z', 'x', 'X'].includes(event.key);
        
        // Pause auto-rotation when manual control starts
        if (isRotationKey && $appStore.autoRotateDimensions && !isInteractingWithUI) {
          pauseAutoRotation();
          
          // Resume auto-rotation after a delay
          resumeAutoRotation();
        }
        
        // Check if Alt key is pressed for higher dimension rotation
        const isAltPressed = event.altKey;
        
        switch(event.key) {
          case 'ArrowUp':
            if (isAltPressed) {
              // Rotate around W axis when Alt is pressed
              rotationDelta.w += rotationSpeed;
              targetRotation.w += rotationSpeed;
            } else {
              // Rotate around X axis (pitch)
              rotationDelta.x += rotationSpeed;
              targetRotation.x += rotationSpeed;
            }
            break;
          case 'ArrowDown':
            if (isAltPressed) {
              // Rotate around W axis when Alt is pressed
              rotationDelta.w -= rotationSpeed;
              targetRotation.w -= rotationSpeed;
            } else {
              // Rotate around X axis (pitch)
              rotationDelta.x -= rotationSpeed;
              targetRotation.x -= rotationSpeed;
            }
            break;
          case 'ArrowLeft':
            if (isAltPressed) {
              // Rotate around V axis when Alt is pressed
              rotationDelta.v += rotationSpeed;
              targetRotation.v += rotationSpeed;
            } else {
              // Rotate around Y axis (yaw)
              rotationDelta.y += rotationSpeed;
              targetRotation.y += rotationSpeed;
              rotationPhase += rotationSpeed;
            }
            break;
          case 'ArrowRight':
            if (isAltPressed) {
              // Rotate around V axis when Alt is pressed
              rotationDelta.v -= rotationSpeed;
              targetRotation.v -= rotationSpeed;
            } else {
              // Rotate around Y axis (yaw)
              rotationDelta.y -= rotationSpeed;
              targetRotation.y -= rotationSpeed;
              rotationPhase -= rotationSpeed;
            }
            break;
          case 'PageUp':
          case 'Home':
            // Increase dimension projection (move "up" in higher dimensions)
            dimensionProjection = Math.min(dimensionProjection + dimensionChangeSpeed, 1.0);
            updateDimensionProjection();
            break;
          case 'PageDown':
          case 'End':
            // Decrease dimension projection (move "down" in higher dimensions)
            dimensionProjection = Math.max(dimensionProjection - dimensionChangeSpeed, 0.1);
            updateDimensionProjection();
            break;
          case 'w':
          case 'W':
            // Rotate through W dimension (4D)
            if (dimensionMode !== 'all') {
              const dimensions = ['3D', '4D', '5D', '6D', '7D', '8D', '9D', '10D', 'all'];
              const currentIndex = dimensions.indexOf(dimensionMode);
              const nextIndex = (currentIndex + 1) % dimensions.length;
              appStore.setDimensionMode(dimensions[nextIndex] as DimensionMode);
            }
            break;
          case 's':
          case 'S':
            // Rotate through V dimension (5D)
            if (dimensionMode !== '3D') {
              const dimensions = ['3D', '4D', '5D', '6D', '7D', '8D', '9D', '10D', 'all'];
              const currentIndex = dimensions.indexOf(dimensionMode);
              const prevIndex = (currentIndex - 1 + dimensions.length) % dimensions.length;
              appStore.setDimensionMode(dimensions[prevIndex] as DimensionMode);
            }
            break;
          case 'z':
          case 'Z':
            // Rotate around Z axis (roll)
            rotationDelta.z += rotationSpeed;
            targetRotation.z += rotationSpeed;
            break;
          case 'x':
          case 'X':
            // Rotate around Z axis (roll)
            rotationDelta.z -= rotationSpeed;
            targetRotation.z -= rotationSpeed;
            break;
        }
      }
    };
    
    // Add event listener for key controls
    window.addEventListener('keydown', keyHandler);
    
    // Add event listeners for mouse interaction
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('wheel', handleMouseWheel, { passive: false });
    
    // Start animation loop
    animate();
  });

  // Update controls based on play state
  $: if (controls) {
    // When not playing, make manual rotation much easier
    if (!isPlaying) {
      // Disable camera rotation when not playing
      controls.enabled = false;
      
      // Keep the camera fixed
      if (camera) {
        camera.position.set(0, 0, 5);
        camera.lookAt(0, 0, 0);
        camera.up.set(0, 1, 0);
      }
    } else {
      // When playing, use default settings
      controls.enabled = true;
      controls.rotateSpeed = 0.5;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 2;
      controls.maxDistance = 20;
    }
    controls.update();
  }

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    
    // Update controls
    if (controls) {
      controls.update();
    }
    
    // Update animations
    if (animationMixer) {
      animationMixer.stopAllAction();
    }
    
    // Update scene
    update(deltaTime);
  }

  // Cleanup on destroy
  onDestroy(() => {
    // Clean up Three.js objects
    if (geometry) geometry.dispose();
    if (material) material.dispose();
    if (mesh) scene.remove(mesh);
    if (particles) scene.remove(particles);
    if (particleGeometry) particleGeometry.dispose();
    if (particleMaterial) particleMaterial.dispose();
    if (dimensionLabels) scene.remove(dimensionLabels);
    if (annotations) scene.remove(annotations);
    if (dimensionSprites.length > 0) {
      dimensionSprites.forEach(sprite => {
        if (sprite.material) sprite.material.dispose();
        scene.remove(sprite);
      });
    }
    if (animationMixer) {
      animationMixer.stopAllAction();
    }
    if (animations.length > 0) {
      animations = [];
    }
    
    // Clear any pending timeouts
    if (autoRotationToggleTimeout !== null) {
      clearTimeout(autoRotationToggleTimeout);
      autoRotationToggleTimeout = null;
    }
    
    // Clear UI interaction timeout
    if (uiInteractionTimeout !== null) {
      clearTimeout(uiInteractionTimeout);
      uiInteractionTimeout = null;
    }
    
    // Remove keyboard event listener
    if (keyHandler) {
      window.removeEventListener('keydown', keyHandler);
    }
    
    // Remove mouse event listeners
    window.removeEventListener('mousedown', handleMouseDown);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('mouseleave', handleMouseLeave);
    window.removeEventListener('wheel', handleMouseWheel);
  });

  function resetView() {
    if (!mesh || !controls) return;
    
    // Stop any ongoing animations
    if (animationMixer) {
      animationMixer.stopAllAction();
    }
    
    // Kill any existing GSAP animations
    animations.forEach(anim => anim.kill());
    animations = [];
    
    // Reset all rotation states
    currentRotation = { x: 0, y: 0, z: 0, w: 0, v: 0 };
    targetRotation = { x: 0, y: 0, z: 0, w: 0, v: 0 };
    rotationDelta = { x: 0, y: 0, z: 0, w: 0, v: 0 };
    rotationPhase = 0;
    currentRotationPhase = 0;
    targetRotationPhase = 0;
    
    // Reset position and rotation
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    mesh.scale.set(1, 1, 1);
    mesh.quaternion.set(0, 0, 0, 1);
    
    // Reset controls
    controls.reset();
    controls.update();
    
    // If we're paused, ensure the reset state is maintained
    if (!$appStore.isPlaying) {
      // Stop any auto-rotation
      if ($appStore.autoRotateDimensions) {
        appStore.toggleDimensionRotation();
      }
      
      // Disable manual rotation
      manualRotationActive = false;
      shouldUpdateRotation = false;
      
      // Force the mesh to stay at reset position
      mesh.rotation.set(0, 0, 0);
      mesh.position.set(0, 0, 0);
      mesh.quaternion.set(0, 0, 0, 1);
      
      // Update material uniforms to reset rotation
      if (material && 'uniforms' in material && material.uniforms) {
        if ('rotationPhase' in material.uniforms) {
          material.uniforms.rotationPhase.value = 0;
        }
        if ('wRotation' in material.uniforms) {
          material.uniforms.wRotation.value = 0;
        }
        if ('vRotation' in material.uniforms) {
          material.uniforms.vRotation.value = 0;
        }
      }
      
      // Keep rotation disabled until explicitly changed
      shouldUpdateRotation = false;
    }
  }

  // Add a new function to handle pausing
  function handlePause() {
    if (!mesh) return;
    
    // Stop any ongoing animations
    if (animationMixer) {
      animationMixer.stopAllAction();
    }
    
    // Kill any existing GSAP animations
    animations.forEach(anim => anim.kill());
    animations = [];
    
    // Reset all rotation states
    currentRotation = { x: 0, y: 0, z: 0, w: 0, v: 0 };
    targetRotation = { x: 0, y: 0, z: 0, w: 0, v: 0 };
    rotationDelta = { x: 0, y: 0, z: 0, w: 0, v: 0 };
    rotationPhase = 0;
    currentRotationPhase = 0;
    targetRotationPhase = 0;
    
    // Force the mesh to stay at reset position
    mesh.rotation.set(0, 0, 0);
    mesh.position.set(0, 0, 0);
    mesh.quaternion.set(0, 0, 0, 1);
    
    // Disable rotation updates
    shouldUpdateRotation = false;
    manualRotationActive = false;
    
    // Update material uniforms to reset rotation
    if (material && 'uniforms' in material && material.uniforms) {
      if ('rotationPhase' in material.uniforms) {
        material.uniforms.rotationPhase.value = 0;
      }
      if ('wRotation' in material.uniforms) {
        material.uniforms.wRotation.value = 0;
      }
      if ('vRotation' in material.uniforms) {
        material.uniforms.vRotation.value = 0;
      }
    }
  }
</script>

<div class="scene-container">
  <!-- This is just a container for the Three.js scene -->
  <!-- Using the props in a way Svelte can track -->
  {#if cameraPosition && controlsEnabled}
    <button 
      class="interaction-area"
      on:mousedown={handleMouseDown}
      on:mousemove={handleMouseMove}
      on:mouseup={handleMouseUp}
      on:mouseleave={handleMouseLeave}
      on:wheel={handleMouseWheel}
      aria-label="3D Scene Interaction Area">
    </button>
    <div class="debug-info ui-element">
      Camera position: {cameraPosition.x.toFixed(2)}, {cameraPosition.y.toFixed(2)}, {cameraPosition.z.toFixed(2)}
      Controls enabled: {controlsEnabled}
      <br>
      Dimension Mode: {dimensionMode} | Projection: {dimensionProjection.toFixed(2)} | Rotation Phase: {rotationPhase.toFixed(2)}
      <br>
      Manual Controls: {!isPlaying ? 'Enabled' : 'Disabled'} | Press W/S for dimension cycling, Arrow keys for rotation
      <br>
      Mouse: Click and drag to rotate, Mouse wheel for Z-axis rotation, Up/Down to change dimension projection
      <br>
      Controls: Arrow keys (X/Y rotation), Z/X (Z rotation), PageUp/PageDown (dimension)
      <br>
      Alt + Arrow keys: Rotate W/V axes | Alt + Mouse wheel: Rotate W axis
      <br>
      Ctrl + Mouse wheel: Zoom in/out
    </div>
  {/if}
</div>

<style>
  .scene-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  
  .interaction-area {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    cursor: grab;
    z-index: 10;
  }
  
  .interaction-area:active {
    cursor: grabbing;
  }
  
  .debug-info {
    position: absolute;
    bottom: 10px;
    left: 10px;
    color: white;
    font-size: 12px;
    opacity: 0.5;
    z-index: 20;
    pointer-events: none; /* Make it non-interactive by default */
  }
  
  /* Add class for UI elements to mark them as non-interactive for rotation */
  .ui-element {
    position: relative;
    z-index: 30; /* Higher than the interaction area */
    pointer-events: auto; /* Make it interactive */
  }
</style> 