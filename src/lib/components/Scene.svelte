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
  import { JuliaSetShader } from '../shaders/JuliaSetShader';
  import { createJuliaSet } from '../utils/mathGeometry';
  import { createHopfFibration, createGoldenSpiral, createPiSpiral, createKleinBottle, createMobiusStrip, createTorusKnot, createHopfFibrationTubes, createHopfFibrationRibbons, createHopfFibrationWithBaseSphere } from '../utils/mathGeometry';

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
  let geometry: THREE.BufferGeometry | null = null;
  let material: CustomShaderMaterial | null = null;
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
  let currentObject: THREE.Object3D | null = null;

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

  // Add Julia set specific state
  let juliaComplex: [number, number] = [-0.4, 0.6];
  let juliaIterations: number = 50;
  let juliaResolution: number = 50;

  // Add LOD update function to the component
  let lodUpdateFunction: (() => void) | null = null;

  // Function to safely toggle auto-rotation with debounce
  function safeToggleAutoRotation(enable: boolean) {
    const currentTime = Date.now();
    if (currentTime - lastToggleTime > TOGGLE_DEBOUNCE_TIME) {
      if ($appStore.autoRotateDimensions !== enable) {
        // Store current rotation state before toggling
        const currentRotationState = {
          x: currentObject?.rotation.x || 0,
          y: currentObject?.rotation.y || 0,
          z: currentObject?.rotation.z || 0,
          w: currentRotation.w,
          v: currentRotation.v
        };
        
        // Toggle the auto-rotation state
        appStore.toggleDimensionRotation();
        lastToggleTime = currentTime;
        
        // If we're disabling auto-rotation, preserve the current rotation
        if (!enable && currentObject && (currentObject instanceof THREE.Mesh || currentObject instanceof THREE.Points)) {
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
          x: currentObject?.rotation.x || 0,
          y: currentObject?.rotation.y || 0,
          z: currentObject?.rotation.z || 0,
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
          x: currentObject?.rotation.x || 0,
          y: currentObject?.rotation.y || 0,
          z: currentObject?.rotation.z || 0,
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

  // Update geometry function to create solid surfaces with beautiful materials
  function updateGeometry() {
    console.log('[updateGeometry] Creating geometry for type:', geometryType);
    
    // Remove current object if it exists
    if (currentObject) {
      scene.remove(currentObject);
      if (currentObject instanceof THREE.Mesh || currentObject instanceof THREE.Points) {
        currentObject.geometry.dispose();
        if (Array.isArray(currentObject.material)) {
          currentObject.material.forEach(mat => mat.dispose());
        } else {
          currentObject.material.dispose();
        }
      }
      currentObject = null;
    }

    // For special geometries that return groups
    if (geometryType === 'hopfFibration' || geometryType === 'hopfTubes' || geometryType === 'hopfRibbons' || geometryType === 'hopfEducational' ||
        geometryType === 'goldenSpiral' || geometryType === 'piSpiral' || 
        geometryType === 'torusKnot') {
      const geometryOrGroup = createGeometryForType(geometryType);
      addGeometryToScene(geometryOrGroup);
      return;
    }

    // For all other types: create geometry with beautiful shader materials
    if (geometry) (geometry as THREE.BufferGeometry).dispose();
    if (material) (material as THREE.Material).dispose();
    geometry = createGeometryForType(geometryType);

    if (geometry) {
      try {
        // Optimize geometry
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();
        
        // Compute normals if missing for proper lighting
        if (!geometry.attributes.normal) {
          geometry.computeVertexNormals();
        }
        
        // Create the beautiful shader material
        material = createMaterial(colorMode);
        
        // Create solid mesh with shader material
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Optional: Add wireframe overlay for mathematical precision visualization
        if (showAnnotations) {
          try {
            const wireframeGeometry = new THREE.WireframeGeometry(geometry);
            
            // Validate wireframe geometry before using it
            if (wireframeGeometry.attributes.position && 
                wireframeGeometry.attributes.position.array.length > 0) {
              
              // Check for NaN values in position array
              const positions = wireframeGeometry.attributes.position.array;
              let hasNaN = false;
              for (let i = 0; i < positions.length; i++) {
                if (isNaN(positions[i])) {
                  hasNaN = true;
                  break;
                }
              }
              
              if (!hasNaN) {
                const wireframeMaterial = new THREE.LineBasicMaterial({
                  color: 0xffffff,
                  transparent: true,
                  opacity: 0.1,  // Very subtle wireframe overlay
                  depthTest: true,
                  depthWrite: false
                });
                const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
                
                // Create a group to hold both mesh and wireframe
                const group = new THREE.Group();
                group.add(mesh);
                group.add(wireframe);
                scene.add(group);
                currentObject = group;
              } else {
                console.warn('Wireframe geometry contains NaN values, skipping wireframe overlay');
                // Just add the solid mesh without wireframe
                scene.add(mesh);
                currentObject = mesh;
              }
            } else {
              console.warn('Invalid wireframe geometry, skipping wireframe overlay');
              // Just add the solid mesh without wireframe
              scene.add(mesh);
              currentObject = mesh;
            }
          } catch (wireframeError) {
            console.warn('Error creating wireframe overlay:', wireframeError);
            // Just add the solid mesh without wireframe
            scene.add(mesh);
            currentObject = mesh;
          }
        } else {
          // Just add the solid mesh
          scene.add(mesh);
          currentObject = mesh;
        }
        
        console.log('[updateGeometry] Added solid mesh with shader material:', currentObject);
      } catch (e) {
        console.error('[updateGeometry] Error creating mesh:', e, 'geometry:', geometry);
      }
    } else {
      console.error('[updateGeometry] geometry is null, cannot create mesh.');
    }
  }

  // Update material when color mode changes
  $: if ($appStore.colorMode && material) {
    const newMaterial = createMaterial(colorMode);
    if (currentObject && (currentObject instanceof THREE.Mesh || currentObject instanceof THREE.Points)) {
      (currentObject as THREE.Mesh | THREE.Points).material = newMaterial;
      if (material) (material as THREE.Material).dispose();
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
    const particleCount = 3000;
    
    // Create arrays for particle attributes
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3);
    const phases = new Float32Array(particleCount);
    const lifetimes = new Float32Array(particleCount);
    
    // Initialize particles with smooth distribution
    for (let i = 0; i < particleCount; i++) {
      // Use spherical distribution for better coverage
      const radius = 3 + Math.random() * 7;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // Add some noise to create more organic distribution
      const noise = (Math.random() - 0.5) * 0.5;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta) + noise;
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) + noise;
      positions[i * 3 + 2] = radius * Math.cos(phi) + noise;
      
      // Assign colors with smooth transitions
      const hue = (i / particleCount) * 0.8 + 0.2;
      const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      // Vary particle sizes with smooth distribution
      sizes[i] = 0.05 + Math.random() * 0.15;
      
      // Add smooth velocities
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      
      // Add random phases for smooth pulsing
      phases[i] = Math.random() * Math.PI * 2;
      
      // Add lifetimes for smooth transitions
      lifetimes[i] = Math.random() * 2 + 1;
    }
    
    // Create geometry with all attributes
    particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Store velocities, phases, and lifetimes for animation
    particleGeometry.userData.velocities = velocities;
    particleGeometry.userData.phases = phases;
    particleGeometry.userData.lifetimes = lifetimes;
    
    // Create custom shader material for smoother particles
    const particleVertexShader = `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      uniform float time;
      
      void main() {
        vColor = color;
        
        // Calculate smooth pulsing effect
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
        
        // Add a smooth glow effect
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
        
        // Get position attribute and user data
        const positions = particleGeometry.attributes.position.array;
        const velocities = particleGeometry.userData.velocities;
        const phases = particleGeometry.userData.phases;
        const lifetimes = particleGeometry.userData.lifetimes;
        
        // Update particle positions with smooth transitions
        for (let i = 0; i < positions.length; i += 3) {
          // Update lifetime
          lifetimes[i / 3] -= deltaTime;
          
          // Reset particle if lifetime is over
          if (lifetimes[i / 3] <= 0) {
            // Reset position with smooth transition
            const radius = 3 + Math.random() * 7;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = radius * Math.cos(phi);
            
            // Reset lifetime
            lifetimes[i / 3] = Math.random() * 2 + 1;
            
            // Update velocity with smooth transition
            velocities[i] = (Math.random() - 0.5) * 0.02;
            velocities[i + 1] = (Math.random() - 0.5) * 0.02;
            velocities[i + 2] = (Math.random() - 0.5) * 0.02;
          } else {
            // Update position with smooth velocity
            positions[i] += velocities[i] * deltaTime * 30;
            positions[i + 1] += velocities[i + 1] * deltaTime * 30;
            positions[i + 2] += velocities[i + 2] * deltaTime * 30;
          }
          
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
      hopfTubes: 'A smooth tube-based Hopf fibration with flowing circular fibers and rainbow coloring.',
      hopfRibbons: 'An elegant ribbon-based Hopf fibration creating flowing dimensional streams.',
      hopfEducational: 'A Hopf fibration with visible base sphere showing the "sphere with circles" structure.',
      goldenSpiral: 'A golden spiral based on the golden ratio (φ) and Fibonacci sequence.',
      piSpiral: 'A spiral visualization based on the digits of π.',
      kleinBottle: 'A Klein bottle, a non-orientable surface with no inside or outside.',
      mobiusStrip: 'A Möbius strip, a one-sided surface with no boundary.',
      torusKnot: 'A torus knot, a closed curve on the surface of a torus.'
    };
    
    const annotation = annotationTexts[geometryType as keyof typeof annotationTexts] ?? "No annotation available for this geometry.";
    if (context) {
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
      const words = annotation.split(' ');
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
    if (!currentObject || !$appStore.isPlaying) return;
    
    // Clear any existing animations
    if (animations.length > 0) {
      animations.forEach(anim => anim.kill());
      animations = [];
    }

    // Only create rotation animation if auto-rotation is enabled
    if ($appStore.autoRotateDimensions) {
      const baseDuration = 20; // Base duration in seconds
      const adjustedDuration = baseDuration / $appStore.speed; // Adjust duration based on speed
      
      const rotationAnimation = gsap.to(currentObject.rotation, {
        y: currentObject.rotation.y + Math.PI * 2,
        duration: adjustedDuration,
        ease: "none",
        repeat: -1,
        onUpdate: () => {
          if (currentObject) {
            currentObject.rotation.x = Math.sin(Date.now() * 0.001 * $appStore.speed) * 0.2;
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

  // Watch for speed changes and recreate animations
  $: if ($appStore.speed !== undefined && $appStore.autoRotateDimensions) {
    console.log('Speed changed to:', $appStore.speed, 'Recreating animations');
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
      }
    }
  }

  // Animate transition
  function animateTransition() {
    if (currentObject) {
      // Reset position and rotation
      currentObject.position.set(0, 0, 0);
      currentObject.rotation.set(0, 0, 0);
      currentObject.scale.set(0.1, 0.1, 0.1);
      
      // Animate with GSAP
      gsap.to(currentObject.position, {
        y: 0,
        duration: 1.5,
        ease: 'elastic.out(1, 0.5)'
      });
      
      gsap.to(currentObject.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1.5,
        ease: 'elastic.out(1, 0.5)'
      });
      
      gsap.to(currentObject.rotation, {
        y: Math.PI * 2,
        duration: 2,
        ease: 'power2.inOut'
      });
    }
  }

  // Higher dimensional rotation functions
  function applyHyperRotation(object: THREE.Object3D, deltaTime: number) {
    const speed = $appStore.speed * dimensionRotationSpeed;
    console.log('Applying hyper rotation with speed:', speed, 'Store speed:', $appStore.speed, 'Dimension rotation speed:', dimensionRotationSpeed);
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
        quaternions[0].setFromAxisAngle(new THREE.Vector3(1, 0, 0), rotationPhase * 0.3 * speed);
        quaternions[1].setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationPhase * 0.5 * speed);
        quaternions[2].setFromAxisAngle(new THREE.Vector3(0, 0, 1), rotationPhase * 0.2 * speed);
        quaternions[3].setFromAxisAngle(new THREE.Vector3(1, 1, 1).normalize(), rotationPhase * 0.4 * speed);
        
        object.quaternion.multiplyQuaternions(quaternions[0], quaternions[1]);
        object.quaternion.multiplyQuaternions(object.quaternion, quaternions[2]);
        object.quaternion.multiplyQuaternions(object.quaternion, quaternions[3]);
        break;

      case ROTATION_PATTERNS.QUANTUM:
        // Quantum pattern - probabilistic rotation with uncertainty
        const uncertainty = Math.sin(rotationPhase * 2) * 0.5 + 0.5;
        object.rotation.x += (Math.random() - 0.5) * uncertainty * deltaTime * speed;
        object.rotation.y += (Math.random() - 0.5) * uncertainty * deltaTime * speed;
        object.rotation.z += (Math.random() - 0.5) * uncertainty * deltaTime * speed;
        break;

      case ROTATION_PATTERNS.KALEIDOSCOPE:
        // Kaleidoscopic pattern - symmetrical rotations
        const angle = rotationPhase * 0.5 * speed;
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
        object.rotation.x = Math.sin(rotationPhase * scale * speed) * Math.PI;
        object.rotation.y = Math.cos(rotationPhase * scale * speed) * Math.PI * 0.5;
        object.rotation.z = Math.sin(rotationPhase * scale * 0.5 * speed) * Math.PI * 0.25;
        break;
    }

    // Apply dimension warping based on current dimension mode
    if ($appStore.dimensionMode !== '3D') {
      const dimensionFactor = parseInt($appStore.dimensionMode) || 3;
      const warpFactor = Math.sin(rotationPhase * 0.3 * speed) * 0.2 + 1;
      object.scale.setScalar(Math.pow(warpFactor, dimensionFactor / 3));
    }
  }

  // Update the update function to include LOD updates
  function update(deltaTime: number) {
    const cappedDelta = Math.min(deltaTime, 0.1);
    const speedMultiplier = $appStore.speed;
    time += cappedDelta * speedMultiplier;

    // Update controls
    if (controls) {
      controls.update();
    }
    
    // Apply smooth rotation interpolation
    if (currentObject && (currentObject instanceof THREE.Mesh || currentObject instanceof THREE.Points)) {
      // Interpolate current rotation towards target rotation
      const interpolationSpeed = ROTATION_INTERPOLATION_SPEED * $appStore.speed;
      currentRotation.x += (targetRotation.x - currentRotation.x) * interpolationSpeed;
      currentRotation.y += (targetRotation.y - currentRotation.y) * interpolationSpeed;
      currentRotation.z += (targetRotation.z - currentRotation.z) * interpolationSpeed;
      currentRotation.w += (targetRotation.w - currentRotation.w) * interpolationSpeed;
      currentRotation.v += (targetRotation.v - currentRotation.v) * interpolationSpeed;
      // Apply interpolated rotation to mesh
      (currentObject as THREE.Mesh | THREE.Points).rotation.x = currentRotation.x;
      (currentObject as THREE.Mesh | THREE.Points).rotation.y = currentRotation.y;
      (currentObject as THREE.Mesh | THREE.Points).rotation.z = currentRotation.z;
      // Apply higher dimension rotations through quaternions or matrix transformations
      if (currentRotation.w !== 0 || currentRotation.v !== 0) {
        // Create quaternions for W and V axis rotations
        const wQuaternion = new THREE.Quaternion();
        wQuaternion.setFromAxisAngle(new THREE.Vector3(1, 1, 1).normalize(), currentRotation.w);
        const vQuaternion = new THREE.Quaternion();
        vQuaternion.setFromAxisAngle(new THREE.Vector3(-1, 1, -1).normalize(), currentRotation.v);
        // Apply quaternions to mesh
        (currentObject as THREE.Mesh | THREE.Points).quaternion.multiplyQuaternions(wQuaternion, (currentObject as THREE.Mesh | THREE.Points).quaternion);
        (currentObject as THREE.Mesh | THREE.Points).quaternion.multiplyQuaternions(vQuaternion, (currentObject as THREE.Mesh | THREE.Points).quaternion);
      }
      // Update rotation phase for shader effects
      rotationPhase = currentRotation.y;
    }

    // Update LOD if needed
    if (lodUpdateFunction) {
      lodUpdateFunction();
    }

    // Only apply auto-rotation if auto-rotation is enabled and manual rotation is not active
    if ($appStore.autoRotateDimensions && !manualRotationActive && currentObject && (currentObject instanceof THREE.Mesh || currentObject instanceof THREE.Points)) {
      applyHyperRotation(currentObject, cappedDelta);
    }

    // Update particle system if it exists
    if (particleSystem) {
      particleSystem.update(cappedDelta * $appStore.speed);
    }

    // Update material uniforms for all objects in the scene
    if (material && 'uniforms' in material && material.uniforms) {
      if ('time' in material.uniforms && material.uniforms.time) {
        material.uniforms.time.value = time;
      }
      if ('rotationPhase' in material.uniforms && material.uniforms.rotationPhase) {
        material.uniforms.rotationPhase.value = rotationPhase;
      }
      if ('wRotation' in material.uniforms && material.uniforms.wRotation) {
        material.uniforms.wRotation.value = currentRotation.w;
      }
      if ('vRotation' in material.uniforms && material.uniforms.vRotation) {
        material.uniforms.vRotation.value = currentRotation.v;
      }
    }
    
    // Also update materials in groups (like Hopf fibrations)
    if (currentObject) {
      currentObject.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material && 'uniforms' in child.material) {
          const mat = child.material as THREE.ShaderMaterial;
          if (mat.uniforms) {
            if ('time' in mat.uniforms && mat.uniforms.time) {
              mat.uniforms.time.value = time;
            }
            if ('rotationPhase' in mat.uniforms && mat.uniforms.rotationPhase) {
              mat.uniforms.rotationPhase.value = rotationPhase;
            }
            if ('wRotation' in mat.uniforms && mat.uniforms.wRotation) {
              mat.uniforms.wRotation.value = currentRotation.w;
            }
            if ('vRotation' in mat.uniforms && mat.uniforms.vRotation) {
              mat.uniforms.vRotation.value = currentRotation.v;
            }
          }
        }
      });
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
      (animationMixer as THREE.AnimationMixer).stopAllAction();
    }
    
    // Update scene
    update(deltaTime);
  }

  // Cleanup on destroy
  onDestroy(() => {
    // Clean up Three.js objects
    if (geometry) (geometry as THREE.BufferGeometry).dispose();
    if (material) (material as THREE.Material).dispose();
    if (currentObject && (currentObject instanceof THREE.Mesh || currentObject instanceof THREE.Points)) {
      scene.remove(currentObject);
    }
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
      (animationMixer as THREE.AnimationMixer).stopAllAction();
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
    if (!currentObject || !controls) return;
    
    // Stop any ongoing animations
    if (animationMixer) {
      (animationMixer as THREE.AnimationMixer).stopAllAction();
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
    (currentObject as THREE.Mesh | THREE.Points).position.set(0, 0, 0);
    (currentObject as THREE.Mesh | THREE.Points).rotation.set(0, 0, 0);
    (currentObject as THREE.Mesh | THREE.Points).scale.set(1, 1, 1);
    (currentObject as THREE.Mesh | THREE.Points).quaternion.set(0, 0, 0, 1);
    
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
      (currentObject as THREE.Mesh | THREE.Points).rotation.set(0, 0, 0);
      (currentObject as THREE.Mesh | THREE.Points).position.set(0, 0, 0);
      (currentObject as THREE.Mesh | THREE.Points).quaternion.set(0, 0, 0, 1);
      
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
    if (!currentObject) return;
    
    // Stop any ongoing animations
    if (animationMixer) {
      (animationMixer as THREE.AnimationMixer).stopAllAction();
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
    (currentObject as THREE.Mesh | THREE.Points).rotation.set(0, 0, 0);
    (currentObject as THREE.Mesh | THREE.Points).position.set(0, 0, 0);
    (currentObject as THREE.Mesh | THREE.Points).quaternion.set(0, 0, 0, 1);
    
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

  // Initialize camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 8; // Increased from 5 to 8 to see more of the field

  // Update the material creation logic
  function createMaterialForGeometry(type: GeometryType): CustomShaderMaterial {
    if (type === 'juliaSet') {
      return new THREE.ShaderMaterial({
        vertexShader: JuliaSetShader.vertexShader,
        fragmentShader: JuliaSetShader.fragmentShader,
        uniforms: {
          ...JuliaSetShader.uniforms,
          time: { value: 0 },
          c: { value: new THREE.Vector2(...juliaComplex) },
          maxIterations: { value: juliaIterations },
          dimensionProjection: { value: dimensionProjection }
        }
      });
    }
    return createMaterial(colorMode);
  }

  // Update the geometry creation logic
  function createGeometryForType(type: GeometryType): any {
    if (type === 'juliaSet') {
      return createJuliaSet(juliaIterations, juliaComplex, juliaResolution);
    }
    if (type === 'hopfTubes') {
      // Beautiful tube-based Hopf fibration with improved smoothness
      return createHopfFibrationTubes(complexity, 1, 0.02, 120);
    }
    if (type === 'hopfRibbons') {
      // Elegant ribbon-based Hopf fibration for maximum visual appeal
      return createHopfFibrationRibbons(complexity, 1, 0.08, 0.015);
    }
    if (type === 'hopfEducational') {
      // Educational Hopf fibration showing the base sphere structure
      return createHopfFibrationWithBaseSphere(complexity, 1, true);
    }
    if (type === 'hopfFibration') {
      // Use the smooth point-based Hopf fibration (now much cleaner)
      return createHopfFibration(complexity, 1);
    }
    return createGeometry(type, complexity, symmetry);
  }

  // When adding to the scene, check if the returned object is a THREE.Group
  function addGeometryToScene(geometryOrGroup: any) {
    // Remove previous object if it exists
    if (typeof currentObject !== 'undefined' && currentObject) {
      scene.remove(currentObject);
    }
    if (geometryOrGroup instanceof THREE.Group) {
      scene.add(geometryOrGroup);
      currentObject = geometryOrGroup;
    } else {
      const material = createMaterialForGeometry(geometryType);
      const mesh = new THREE.Mesh(geometryOrGroup, material);
      scene.add(mesh);
      currentObject = mesh;
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