<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
  import Scene from './lib/components/Scene.svelte';
  import Controls from './lib/components/Controls.svelte';
  import Info from './lib/components/Info.svelte';
  import { appStore } from './lib/stores/appStore';
  import type { DimensionMode } from './lib/types';

  // Component state
  let isLoaded = false;
  let showInfo = false;
  let isPlaying = false;

  // Sound resonance parameters
  let frequency = 440;
  let amplitude = 0.5;
  let resonance = 0.7;

  // Fractal parameters
  let iteration = 5;
  let glowIntensity = 0.8;

  // Quantum field parameters
  let particleCount = 100;
  let entanglement = 0.6;
  let uncertainty = 0.4;

  // Dimension parameters
  let dimensionMode: DimensionMode = '3D';
  let dimensionRotationSpeed = 1.0;
  let autoRotateDimensions = false;

  // Update app store when parameters change
  $: {
    // Only update if values have actually changed
    if (dimensionMode !== $appStore.dimensionMode) {
      appStore.setDimensionMode(dimensionMode);
    }
    
    if (dimensionRotationSpeed !== $appStore.speed) {
      appStore.setSpeed(dimensionRotationSpeed);
    }
    
    if (autoRotateDimensions !== $appStore.autoRotateDimensions) {
      isPlaying = autoRotateDimensions;
      if (autoRotateDimensions) {
        appStore.toggleDimensionRotation();
      }
    }
  }

  let container: HTMLDivElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  let clock: THREE.Clock;
  let animationFrameId: number;
  let sceneComponent: Scene;

  // Handle window resize with debounce
  let resizeTimeout: number;
  function handleResize() {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    
    resizeTimeout = setTimeout(() => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    }, 100) as unknown as number;
  }

  // Add WebGL compatibility check
  function checkWebGLSupport(): { isSupported: boolean; contextType: string } {
    const canvas = document.createElement('canvas');
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null;
    let contextType = '';

    try {
      // Try WebGL 2 first
      gl = canvas.getContext('webgl2', {
        powerPreference: 'high-performance' as WebGLPowerPreference,
        antialias: true,
        alpha: true,
        depth: true,
        stencil: false,
        failIfMajorPerformanceCaveat: false
      });
      if (gl) {
        contextType = 'webgl2';
        return { isSupported: true, contextType };
      }

      // Fallback to WebGL 1 with optimized settings
      gl = canvas.getContext('webgl', {
        powerPreference: 'high-performance' as WebGLPowerPreference,
        antialias: true,
        alpha: true,
        depth: true,
        stencil: false,
        failIfMajorPerformanceCaveat: false
      }) || canvas.getContext('experimental-webgl', {
        powerPreference: 'high-performance' as WebGLPowerPreference,
        antialias: true,
        alpha: true,
        depth: true,
        stencil: false,
        failIfMajorPerformanceCaveat: false
      }) as WebGLRenderingContext | null;
      
      if (gl) {
        contextType = 'webgl1';
        return { isSupported: true, contextType };
      }

      return { isSupported: false, contextType: 'none' };
    } catch (e) {
      console.error('WebGL initialization error:', e);
      return { isSupported: false, contextType: 'none' };
    }
  }

  let webGLSupport = { isSupported: false, contextType: 'none' };
  let useFallbackRenderer = false;

  onMount(() => {
    // Check WebGL support first
    webGLSupport = checkWebGLSupport();
    console.log('WebGL Support:', webGLSupport);
    
    // Initialize Three.js scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Initialize camera
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    try {
      // Initialize renderer with optimized settings based on WebGL support
      const rendererOptions: THREE.WebGLRendererParameters = {
        antialias: webGLSupport.contextType === 'webgl2',
        powerPreference: 'high-performance' as WebGLPowerPreference,
        precision: webGLSupport.contextType === 'webgl2' ? 'highp' : 'mediump',
        alpha: true,
        stencil: false,
        depth: true,
        logarithmicDepthBuffer: false,
        failIfMajorPerformanceCaveat: false
      };

      renderer = new THREE.WebGLRenderer(rendererOptions);

      // Adjust settings based on context type
      if (webGLSupport.contextType === 'webgl1') {
        console.log('Using WebGL 1 with optimized settings');
        useFallbackRenderer = true;
        
        // Optimize for WebGL 1
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(window.innerWidth, window.innerHeight);
      } else {
        // Use full capabilities for WebGL 2
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
      }

      // Enable shadow maps if supported
      if (renderer.capabilities.isWebGL2) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }

      container.appendChild(renderer.domElement);

    } catch (e) {
      console.error('Failed to initialize WebGL renderer:', e);
      useFallbackRenderer = true;
      
      // Create basic renderer with minimal features
      renderer = new THREE.WebGLRenderer({ 
        antialias: false,
        precision: 'lowp',
        powerPreference: 'default' as WebGLPowerPreference,
        alpha: false,
        stencil: false,
        depth: true,
        failIfMajorPerformanceCaveat: false
      });
      
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(1);
      container.appendChild(renderer.domElement);
    }

    // Initialize controls with adjusted settings for fallback mode
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !useFallbackRenderer;
    controls.dampingFactor = useFallbackRenderer ? 0.1 : 0.05;
    controls.rotateSpeed = useFallbackRenderer ? 0.5 : 0.8;
    controls.enableZoom = true;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.target.set(0, 0, 0);

    // Initialize clock
    clock = new THREE.Clock();

    // Set initial window size
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Mark as loaded
    isLoaded = true;

    // Modified animation loop with performance monitoring
    let lastTime = 0;
    let frameCount = 0;
    let lastFpsUpdate = 0;
    let frameTimeHistory: number[] = [];
    const MAX_FRAME_TIME_HISTORY = 60;
    
    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      
      const currentTime = performance.now();
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      // Track frame times for performance monitoring
      frameTimeHistory.push(delta);
      if (frameTimeHistory.length > MAX_FRAME_TIME_HISTORY) {
        frameTimeHistory.shift();
      }
      
      // Calculate average frame time
      const avgFrameTime = frameTimeHistory.reduce((a, b) => a + b, 0) / frameTimeHistory.length;
      
      // FPS monitoring
      frameCount++;
      if (currentTime - lastFpsUpdate > 1000) {
        const fps = Math.round(frameCount * 1000 / (currentTime - lastFpsUpdate));
        console.log(`FPS: ${fps}, Avg Frame Time: ${(avgFrameTime * 1000).toFixed(2)}ms`);
        
        // Switch to fallback mode if performance is poor
        if (fps < 30 && !useFallbackRenderer) {
          console.warn('Low FPS detected, switching to fallback mode');
          useFallbackRenderer = true;
          // Adjust render quality
          renderer.setPixelRatio(1);
          renderer.setSize(window.innerWidth, window.innerHeight);
        }
        frameCount = 0;
        lastFpsUpdate = currentTime;
      }
      
      // Skip frame if delta is too large
      if (delta > 0.1) return;
      
      controls.update();
      
      if (sceneComponent && typeof sceneComponent.update === 'function') {
        sceneComponent.update(delta);
      }
      
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      cancelAnimationFrame(animationFrameId);
      if (renderer) renderer.dispose();
      if (controls) controls.dispose();
    };
  });
</script>

<svelte:head>
  <title>HyperSpace Explorer</title>
  <meta name="description" content="Explore higher dimensions through interactive visualizations" />
</svelte:head>

<main class:loaded={isLoaded}>
  <div class="container" bind:this={container}>
    {#if scene && camera && controls}
      <Scene bind:this={sceneComponent} {scene} {camera} {controls} {renderer} />
    {/if}
  </div>
  <div class="controls-container">
    <Controls 
      {frequency}
      {amplitude}
      {resonance}
      {iteration}
      {glowIntensity}
      {particleCount}
      {entanglement}
      {uncertainty}
      {dimensionMode}
      {dimensionRotationSpeed}
      {autoRotateDimensions}
      on:frequencyChange={(e) => frequency = e.detail}
      on:amplitudeChange={(e) => amplitude = e.detail}
      on:resonanceChange={(e) => resonance = e.detail}
      on:iterationChange={(e) => iteration = e.detail}
      on:glowIntensityChange={(e) => glowIntensity = e.detail}
      on:particleCountChange={(e) => particleCount = e.detail}
      on:entanglementChange={(e) => entanglement = e.detail}
      on:uncertaintyChange={(e) => uncertainty = e.detail}
      on:dimensionModeChange={(e) => dimensionMode = e.detail}
      on:dimensionRotationSpeedChange={(e) => dimensionRotationSpeed = e.detail}
      on:autoRotateDimensionsChange={(e) => autoRotateDimensions = e.detail}
      on:geometryTypeChange={(e) => appStore.setGeometryType(e.detail)}
      on:colorModeChange={(e) => appStore.setColorMode(e.detail)}
    />
  </div>
  <button class="info-button" on:click={() => showInfo = !showInfo}>
    {showInfo ? 'Hide Info' : 'Show Info'}
  </button>
  {#if showInfo}
    <Info isVisible={showInfo} on:close={() => showInfo = false} />
  {/if}
</main>

<style>
  main {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background-color: #000;
    opacity: 0;
    transition: opacity 1s ease-in-out;
  }
  
  main.loaded {
    opacity: 1;
  }
  
  .container {
    width: 100%;
    height: 100%;
  }
  
  .controls-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
  }
  
  .info-button {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1001;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-family: 'Arial', sans-serif;
    font-size: 14px;
    transition: all 0.3s ease;
  }
  
  .info-button:hover {
    background-color: rgba(0, 0, 0, 0.7);
    border-color: rgba(255, 255, 255, 0.5);
  }
</style>
