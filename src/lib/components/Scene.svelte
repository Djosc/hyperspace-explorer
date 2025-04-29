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
  type MaterialUniforms = {
    [key: string]: { value: any };
  };

  // Props
  export let scene: THREE.Scene;
  export let camera: THREE.PerspectiveCamera;
  export let controls: OrbitControls;

  // State
  let geometryType: GeometryType = 'hyperCube';
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
  let material: THREE.ShaderMaterial & { uniforms: MaterialUniforms };
  let mesh: THREE.Mesh;
  let clock: THREE.Clock;
  let time: number = 0;
  let particles: THREE.Points;
  let particleGeometry: THREE.BufferGeometry;
  let particleMaterial: THREE.PointsMaterial;
  let dimensionLabels: THREE.Group;
  let animationMixer: THREE.AnimationMixer;
  let animations: THREE.AnimationClip[] = [];
  let dimensionSprites: THREE.Sprite[] = [];
  let annotations: THREE.Group;
  let dimensionProjection: number = 0.5; // Controls how much of the higher dimension is projected

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

  // Subscribe to store
  $: {
    const newGeometryType = $appStore.geometryType;
    const newComplexity = $appStore.complexity;
    const newSymmetry = $appStore.symmetry;
    const newColorMode = $appStore.colorMode;
    const newDimensionMode = $appStore.dimensionMode;
    
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
      updateGeometry();
    }
  }

  // Separate function for geometry updates
  function updateGeometry() {
    console.log('Updating geometry:', { geometryType, complexity, symmetry });
    
    // Create new geometry
    const newGeometry = createGeometry(geometryType, complexity, symmetry);
    
    // Initialize or update mesh
    if (!mesh) {
      console.log('Creating new mesh');
      geometry = newGeometry;
      material = createMaterial(colorMode) as THREE.ShaderMaterial & { uniforms: MaterialUniforms };
      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      
      // Initialize animation mixer after mesh is created
      animationMixer = new THREE.AnimationMixer(mesh);
      
      // Create animations
      createAnimations();
      
      // Create supporting systems
      createParticleSystem();
      createDimensionLabels();
      createAnnotations();
    } else {
      console.log('Updating existing mesh');
      // Dispose of old geometry
      if (geometry) geometry.dispose();
      geometry = newGeometry;
      mesh.geometry = geometry;
      
      // Update animations for new geometry
      createAnimations();
    }
  }

  // Update material when color mode changes
  $: if (colorMode && material) {
    console.log('Updating material for color mode:', colorMode);
    const newMaterial = createMaterial(colorMode) as THREE.ShaderMaterial & { uniforms: MaterialUniforms };
    if (mesh) {
      // Update material uniforms based on dimension mode
      if ('uniforms' in newMaterial && newMaterial.uniforms) {
        // Make sure time uniform is set
        if ('time' in newMaterial.uniforms) {
          newMaterial.uniforms.time.value = time;
        }
        
        // Make sure rotationPhase uniform is set
        if ('rotationPhase' in newMaterial.uniforms) {
          newMaterial.uniforms.rotationPhase = { value: rotationPhase };
        }
        
        // Make sure dimensionFactor uniform is set
        if ('dimensionFactor' in newMaterial.uniforms) {
          newMaterial.uniforms.dimensionFactor = { 
            value: parseInt($appStore.dimensionMode) || 3 
          };
        }
        
        // Update color parameters
        updateColorParameters(newMaterial);
      }
      mesh.material = newMaterial;
      material = newMaterial;
    }
  }

  // Update color parameters based on dimension mode
  function updateColorParameters(mat: THREE.Material) {
    if (!('uniforms' in mat)) return;
    
    const uniforms = mat.uniforms as {
      saturation?: { value: number };
      brightness?: { value: number };
      contrast?: { value: number };
      colorA?: { value: THREE.Color };
      colorB?: { value: THREE.Color };
      colorC?: { value: THREE.Color };
      baseColor?: { value: THREE.Color };
    };
    
    // Ensure color values are set
    if (uniforms.colorA && !uniforms.colorA.value) {
      uniforms.colorA.value = new THREE.Color(0xff0000);
    }
    if (uniforms.colorB && !uniforms.colorB.value) {
      uniforms.colorB.value = new THREE.Color(0x00ff00);
    }
    if (uniforms.colorC && !uniforms.colorC.value) {
      uniforms.colorC.value = new THREE.Color(0x0000ff);
    }
    if (uniforms.baseColor && !uniforms.baseColor.value) {
      uniforms.baseColor.value = new THREE.Color(0xffffff);
    }
    
    // Set color parameters based on dimension mode
    switch (dimensionMode) {
      case '3D':
        if (uniforms.saturation) uniforms.saturation.value = 1.2;
        if (uniforms.brightness) uniforms.brightness.value = 1.2;
        if (uniforms.contrast) uniforms.contrast.value = 1.3;
        break;
      case '4D':
        if (uniforms.saturation) uniforms.saturation.value = 1.4;
        if (uniforms.brightness) uniforms.brightness.value = 1.3;
        if (uniforms.contrast) uniforms.contrast.value = 1.4;
        break;
      case '5D':
        if (uniforms.saturation) uniforms.saturation.value = 1.6;
        if (uniforms.brightness) uniforms.brightness.value = 1.4;
        if (uniforms.contrast) uniforms.contrast.value = 1.5;
        break;
      case '6D':
      case '7D':
      case '8D':
      case '9D':
      case '10D':
        if (uniforms.saturation) uniforms.saturation.value = 1.8;
        if (uniforms.brightness) uniforms.brightness.value = 1.5;
        if (uniforms.contrast) uniforms.contrast.value = 1.6;
        break;
      case 'all':
        if (uniforms.saturation) uniforms.saturation.value = 2.0;
        if (uniforms.brightness) uniforms.brightness.value = 1.6;
        if (uniforms.contrast) uniforms.contrast.value = 1.7;
        break;
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

  // Create particle system
  function createParticleSystem() {
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      // Position particles in a sphere around the mesh
      const radius = 5 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Random colors
      colors[i * 3] = Math.random();
      colors[i * 3 + 1] = Math.random();
      colors[i * 3 + 2] = Math.random();
    }
    
    particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
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
      hyper10D: 'A 10D hypercube at the boundary of comprehensible dimensional space.'
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
    if (!mesh || !animationMixer) return;
    
    // Clear existing animations
    if (animations.length > 0) {
      animations = [];
    }
    
    // Create rotation animation
    const rotationAnimation = new THREE.AnimationClip(
      'rotation',
      10, // duration in seconds
      [
        new QuaternionKeyframeTrack(
          '.quaternion',
          [0, 5, 10],
          [
            0, 0, 0, 1, // start rotation (identity quaternion)
            0, 0.5, 0, 0.866, // middle rotation (90 degrees around Y)
            0, 1, 0, 0 // end rotation (180 degrees around Y)
          ]
        )
      ]
    );
    
    // Create scale animation
    const scaleAnimation = new THREE.AnimationClip(
      'scale',
      5, // duration in seconds
      [
        new VectorKeyframeTrack(
          '.scale',
          [0, 2.5, 5],
          [
            1, 1, 1, // start scale
            1.2, 1.2, 1.2, // middle scale
            1, 1, 1 // end scale
          ]
        )
      ]
    );
    
    // Add animations to the array
    animations.push(rotationAnimation, scaleAnimation);
    
    // Create animation actions
    const rotationAction = animationMixer.clipAction(rotationAnimation);
    const scaleAction = animationMixer.clipAction(scaleAnimation);
    
    // Set up animation loop
    rotationAction.setLoop(THREE.LoopRepeat, Infinity);
    scaleAction.setLoop(THREE.LoopRepeat, Infinity);
    
    // Play animations
    rotationAction.play();
    scaleAction.play();
  }

  // Update dimension projection
  function updateDimensionProjection() {
    if (material && 'uniforms' in material && material.uniforms) {
      if ('dimensionProjection' in material.uniforms && material.uniforms.dimensionProjection && material.uniforms.dimensionProjection.value !== undefined) {
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

  // Update the existing update function
  function update(deltaTime: number) {
    const cappedDelta = Math.min(deltaTime, 0.1);
    time += cappedDelta;

    // Update pattern based on geometry type
    switch($appStore.geometryType) {
      case 'hyperCube':
      case 'tesseract':
        currentPattern = ROTATION_PATTERNS.HYPERCUBE;
        break;
      case 'vortex':
        currentPattern = ROTATION_PATTERNS.SPIRAL;
        break;
      case 'quantumField':
        currentPattern = ROTATION_PATTERNS.QUANTUM;
        break;
      case 'mandala':
        currentPattern = ROTATION_PATTERNS.KALEIDOSCOPE;
        break;
      case 'fractal':
        currentPattern = ROTATION_PATTERNS.FRACTAL;
        break;
      default:
        currentPattern = ROTATION_PATTERNS.SPIRAL;
    }

    if (mesh && $appStore.autoRotateDimensions) {
      applyHyperRotation(mesh, cappedDelta);
    }

    if (particles) {
      applyHyperRotation(particles, cappedDelta * 0.5);
    }

    if (dimensionLabels) {
      applyHyperRotation(dimensionLabels, cappedDelta * 0.3);
    }

    // Update material uniforms
    if (material && 'uniforms' in material && material.uniforms) {
      material.uniforms.time.value = time;
      material.uniforms.rotationPhase = { value: rotationPhase };
      material.uniforms.dimensionFactor = { 
        value: parseInt($appStore.dimensionMode) || 3 
      };
    }
  }

  // Initialize on mount
  onMount(() => {
    // Removed console.log
    clock = new THREE.Clock();
    
    // Set initial camera position
    if (camera) {
      camera.position.set(0, 0, 5);
      camera.lookAt(scene.position);
    }
    
    // Configure OrbitControls for better interaction
    if (controls) {
      controls.enableDamping = true; // Add smooth damping effect
      controls.dampingFactor = 0.05;
      controls.enableZoom = true; // Enable zooming
      controls.enablePan = true; // Enable panning
      controls.enableRotate = true; // Enable rotation
      controls.rotateSpeed = 0.5; // Adjust rotation speed
      controls.zoomSpeed = 1.0; // Adjust zoom speed
      controls.panSpeed = 0.5; // Adjust pan speed
      controls.minDistance = 2; // Minimum zoom distance
      controls.maxDistance = 20; // Maximum zoom distance
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
    
    // Enable auto-rotation through dimensions
    appStore.toggleDimensionRotation();
    
    // Start animation loop
    animate();
  });

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
      animationMixer.update(deltaTime);
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
    if (animationMixer) animationMixer.stopAllAction();
    if (animations.length > 0) {
      animations = [];
    }
  });
</script>

<div class="scene-container">
  <!-- This is just a container for the Three.js scene -->
  <!-- Using the props in a way Svelte can track -->
  {#if camera && controls}
    <div class="debug-info">
      Camera position: {camera.position.x.toFixed(2)}, {camera.position.y.toFixed(2)}, {camera.position.z.toFixed(2)}
      Controls enabled: {controls.enabled}
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
  
  .debug-info {
    position: absolute;
    bottom: 10px;
    left: 10px;
    color: white;
    font-size: 12px;
    opacity: 0.5;
  }
</style> 