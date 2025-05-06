<script lang="ts">
  import { appStore } from '../stores/appStore';
  import type { GeometryType, ColorMode, DimensionMode } from '../types';
  import { createEventDispatcher } from 'svelte';

  const geometryTypes: GeometryType[] = [
    'hyperCube', 
    'mandala', 
    'vortex', 
    'neuronal', 
    'tesseract', 
    'hypersphere', 
    'hyper5D',
    'dmtTunnel',
    'soundResonance',
    'fractal',
    'quantumField',
    'hyper6D',
    'hyper7D',
    'hyper8D',
    'hyper9D',
    'hyper10D',
    'hopfFibration',
    'goldenSpiral',
    'piSpiral',
    'kleinBottle',
    'mobiusStrip',
    'torusKnot'
  ];
  
  const colorModes: ColorMode[] = [
    'spectralShift', 
    'kaleidoscope', 
    'both', 
    'hyperspace',
    'mathematical'
  ];

  const dimensionModes: DimensionMode[] = [
    '3D',
    '4D',
    '5D',
    '6D',
    '7D',
    '8D',
    '9D',
    '10D',
    'all'
  ];

  // Props
  export let frequency = 440;
  export let amplitude = 0.5;
  export let resonance = 0.7;
  export let iteration = 5;
  export let glowIntensity = 0.8;
  export let particleCount = 100;
  export let entanglement = 0.6;
  export let uncertainty = 0.4;
  export let dimensionMode = '3D';
  export let dimensionRotationSpeed = 1.0;
  export let autoRotateDimensions = false;
  export let isTransitioning = false;
  
  // Event dispatcher
  const dispatch = createEventDispatcher();

  // Add state for advanced controls
  let showAdvanced = false;

  function handleGeometryTypeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (!select || !geometryTypes.includes(select.value as GeometryType)) {
      console.error('Invalid geometry type selected');
      return;
    }
    const value = select.value as GeometryType;
    console.log(`Changing geometry type to: ${value}`);
    appStore.setGeometryType(value);
  }

  function handleColorModeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (!select || !colorModes.includes(select.value as ColorMode)) {
      console.error('Invalid color mode selected');
      return;
    }
    const value = select.value as ColorMode;
    console.log(`Changing color mode to: ${value}`);
    appStore.setColorMode(value);
  }

  function handleDimensionModeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (!select || !dimensionModes.includes(select.value as DimensionMode)) {
      console.error('Invalid dimension mode selected');
      return;
    }
    const value = select.value as DimensionMode;
    console.log(`Changing dimension mode to: ${value}`);
    appStore.setDimensionMode(value);
  }

  function handleInputChange(event: Event, param: string) {
    const target = event.currentTarget as HTMLInputElement;
    if (!target) return;
    
    const value = target.type === 'checkbox' 
      ? target.checked 
      : parseFloat(target.value);
    
    console.log(`Input change for ${param}:`, value);
    
    switch(param) {
      case 'complexity':
        appStore.setComplexity(parseInt(target.value));
        break;
      case 'symmetry':
        appStore.setSymmetry(parseInt(target.value));
        break;
      case 'speed':
        appStore.setSpeed(parseFloat(target.value));
        break;
      default:
        dispatch(`${param}Change`, value);
    }
  }
  
  function handleSelectChange(event: Event, param: string) {
    const target = event.target as HTMLSelectElement;
    if (!target) return;
    
    console.log(`Select change for ${param}:`, target.value);
    dispatch(`${param}Change`, target.value);
  }

  function togglePlayPause() {
    const newState = !$appStore.isPlaying;
    console.log(`Toggling play/pause to: ${newState ? 'play' : 'pause'}`);
    appStore.togglePlay();
    
    // If we're pausing, also stop rotation
    if (!newState && $appStore.autoRotateDimensions) {
      appStore.toggleDimensionRotation();
    }
  }

  function toggleAnnotations() {
    console.log('Toggling annotations');
    appStore.toggleAnnotations();
  }

  function toggleDimensionRotation() {
    console.log('Toggling dimension rotation');
    // Only allow rotation if we're in play mode
    if ($appStore.isPlaying) {
      appStore.toggleDimensionRotation();
    }
  }
  
  // Format the display name for geometry types and color modes
  function formatDisplayName(name: string): string {
    // Convert camelCase to Title Case with spaces
    return name
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  }
</script>

<div class="controls">
  <h2>HyperSpace Explorer</h2>
  
  <div class="control-group">
    <label for="geometry-type">Geometry Type</label>
    <select id="geometry-type" on:change={handleGeometryTypeChange} class:changing={isTransitioning}>
      {#each geometryTypes as type}
        <option value={type} selected={$appStore.geometryType === type}>
          {formatDisplayName(type)}
        </option>
      {/each}
    </select>
  </div>

  <div class="control-group">
    <label for="complexity">Complexity</label>
    <input 
      type="range" 
      id="complexity" 
      min="1" 
      max="10" 
      value={$appStore.complexity} 
      on:input={(e) => handleInputChange(e, 'complexity')}
      class:changing={isTransitioning}
    />
    <div class="value-display">{$appStore.complexity}</div>
  </div>

  <div class="control-group">
    <label for="symmetry">Symmetry</label>
    <input 
      type="range" 
      id="symmetry" 
      min="1" 
      max="10" 
      value={$appStore.symmetry} 
      on:input={(e) => handleInputChange(e, 'symmetry')}
      class:changing={isTransitioning}
    />
    <div class="value-display">{$appStore.symmetry}</div>
  </div>

  <div class="control-group">
    <label for="color-mode">Color Mode</label>
    <select id="color-mode" on:change={handleColorModeChange} class:changing={isTransitioning}>
      {#each colorModes as mode}
        <option value={mode} selected={$appStore.colorMode === mode}>
          {formatDisplayName(mode)}
        </option>
      {/each}
    </select>
  </div>

  <div class="control-group">
    <label for="dimension-mode">Dimension Mode</label>
    <select id="dimension-mode" on:change={handleDimensionModeChange} class:changing={isTransitioning}>
      {#each dimensionModes as mode}
        <option value={mode} selected={$appStore.dimensionMode === mode}>
          {formatDisplayName(mode)}
        </option>
      {/each}
    </select>
  </div>

  <div class="control-group">
    <label for="speed">Animation Speed</label>
    <input 
      type="range" 
      id="speed" 
      min="0.1" 
      max="2" 
      step="0.1" 
      value={$appStore.speed} 
      on:input={(e) => handleInputChange(e, 'speed')}
      class:changing={isTransitioning}
    />
    <div class="value-display">{$appStore.speed.toFixed(1)}x</div>
  </div>

  <div class="buttons">
    <button 
      class="play-pause" 
      on:click={togglePlayPause} 
      class:playing={$appStore.isPlaying}
      class:changing={isTransitioning}
    >
      {$appStore.isPlaying ? '⏸' : '▶'}
    </button>
    <button 
      class="annotations" 
      on:click={toggleAnnotations} 
      class:active={$appStore.showAnnotations}
      class:changing={isTransitioning}
    >
      {$appStore.showAnnotations ? '👁' : '👁‍🗨'}
    </button>
    <button 
      class="auto-rotate" 
      on:click={toggleDimensionRotation} 
      class:active={$appStore.autoRotateDimensions}
      class:changing={isTransitioning}
    >
      {$appStore.autoRotateDimensions ? '⏹' : '🔄'}
    </button>
  </div>

  <div class="control-group collapsible" class:collapsed={!showAdvanced}>
    <label on:click={() => showAdvanced = !showAdvanced}>
      Advanced Controls
    </label>
    
    {#if showAdvanced}
      <div class="advanced-controls">
        <div class="control-group">
          <h3>Sound Resonance</h3>
          <div class="control-row">
            <label for="frequency">Frequency</label>
            <input 
              type="range" 
              id="frequency" 
              min="20" 
              max="2000" 
              step="1" 
              value={frequency} 
              on:input={(e) => handleInputChange(e, 'frequency')}
            />
            <span class="value-display">{frequency} Hz</span>
          </div>
          <div class="control-row">
            <label for="amplitude">Amplitude</label>
            <input 
              type="range" 
              id="amplitude" 
              min="0" 
              max="1" 
              step="0.01" 
              value={amplitude} 
              on:input={(e) => handleInputChange(e, 'amplitude')}
            />
            <span class="value-display">{amplitude.toFixed(2)}</span>
          </div>
        </div>

        <div class="control-group">
          <h3>Fractal</h3>
          <div class="control-row">
            <label for="iteration">Iteration</label>
            <input 
              type="range" 
              id="iteration" 
              min="1" 
              max="10" 
              step="1" 
              value={iteration} 
              on:input={(e) => handleInputChange(e, 'iteration')}
            />
            <span class="value-display">{iteration}</span>
          </div>
          <div class="control-row">
            <label for="glowIntensity">Glow</label>
            <input 
              type="range" 
              id="glowIntensity" 
              min="0" 
              max="1" 
              step="0.01" 
              value={glowIntensity} 
              on:input={(e) => handleInputChange(e, 'glowIntensity')}
            />
            <span class="value-display">{glowIntensity.toFixed(2)}</span>
          </div>
        </div>

        <div class="control-group">
          <h3>Quantum Field</h3>
          <div class="control-row">
            <label for="particleCount">Particles</label>
            <input 
              type="range" 
              id="particleCount" 
              min="10" 
              max="1000" 
              step="10" 
              value={particleCount} 
              on:input={(e) => handleInputChange(e, 'particleCount')}
            />
            <span class="value-display">{particleCount}</span>
          </div>
          <div class="control-row">
            <label for="entanglement">Entanglement</label>
            <input 
              type="range" 
              id="entanglement" 
              min="0" 
              max="1" 
              step="0.01" 
              value={entanglement} 
              on:input={(e) => handleInputChange(e, 'entanglement')}
            />
            <span class="value-display">{entanglement.toFixed(2)}</span>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <div class="info-text">
    <p>Explore higher dimensions through mathematical visualization</p>
    <div class="dimension-info">
      {#if $appStore.dimensionMode === '3D'}
        Exploring 3D projection of higher-dimensional objects
      {:else if $appStore.dimensionMode === '4D'}
        Exploring 4D space (tesseract, hypercube)
      {:else if $appStore.dimensionMode === '5D'}
        Exploring 5D space (penteract, 5D hypercube)
      {:else if $appStore.dimensionMode === '6D'}
        Exploring 6D space (hexeract, 6D hypercube)
      {:else if $appStore.dimensionMode === '7D'}
        Exploring 7D space (hepteract, 7D hypercube)
      {:else if $appStore.dimensionMode === '8D'}
        Exploring 8D space (octeract, 8D hypercube)
      {:else if $appStore.dimensionMode === '9D'}
        Exploring 9D space (enneract, 9D hypercube)
      {:else if $appStore.dimensionMode === '10D'}
        Exploring 10D space (dekeract, 10D hypercube)
      {:else}
        Exploring all dimensions simultaneously
      {/if}
    </div>
  </div>
</div>

<style>
  .controls {
    background: rgba(0, 0, 0, 0.85);
    padding: 15px;
    border-radius: 12px;
    color: white;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    width: 280px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  h2 {
    margin: 0 0 15px 0;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    letter-spacing: 0.5px;
  }

  .control-group {
    margin-bottom: 15px;
    padding: 8px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    transition: background 0.2s ease;
  }

  .control-group:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .control-group label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
  }

  .control-group select {
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.9rem;
    width: 100%;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .control-group select:hover {
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(0, 0, 0, 0.8);
  }

  .control-group select option {
    background: rgba(0, 0, 0, 0.9);
    color: white;
  }

  .control-group input[type="range"] {
    -webkit-appearance: none;
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    margin: 8px 0;
    transition: height 0.2s ease;
  }

  .control-group input[type="range"]:hover {
    height: 6px;
  }

  .control-group input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: #fff;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .control-group input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
  }

  .control-group input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: #fff;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .control-group input[type="range"]::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
  }

  .value-display {
    text-align: right;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 4px;
    font-variant-numeric: tabular-nums;
  }

  .buttons {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 15px;
  }

  button {
    padding: 6px 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  button:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  button:active {
    transform: translateY(0);
  }

  button.playing {
    background: rgba(0, 255, 0, 0.15);
    border-color: rgba(0, 255, 0, 0.3);
  }

  button.active {
    background: rgba(0, 255, 255, 0.15);
    border-color: rgba(0, 255, 255, 0.3);
  }

  .info-text {
    margin-top: 15px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.4;
  }

  .dimension-info {
    margin-top: 8px;
    padding: 8px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 6px;
    font-size: 11px;
  }

  /* Collapsible sections */
  .control-group.collapsible {
    cursor: pointer;
  }

  .control-group.collapsible > label {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .control-group.collapsible > label::after {
    content: '▼';
    font-size: 10px;
    transition: transform 0.2s ease;
  }

  .control-group.collapsible.collapsed > label::after {
    transform: rotate(-90deg);
  }

  .control-group.collapsible.collapsed > *:not(label) {
    display: none;
  }

  /* Smooth transitions */
  * {
    transition: all 0.2s ease;
  }

  .geometry-preview {
    margin-top: 10px;
    height: 60px;
    position: relative;
  }

  .preview-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .preview-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    position: relative;
    overflow: hidden;
  }

  .preview-icon.active {
    background: rgba(0, 255, 0, 0.2);
  }

  .preview-animation {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(0, 255, 0, 0.3);
    transform: translate(-50%, -50%);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      width: 0;
      height: 0;
      opacity: 1;
    }
    100% {
      width: 100%;
      height: 100%;
      opacity: 0;
    }
  }

  .advanced-controls {
    margin-top: 10px;
  }

  .control-row {
    margin-bottom: 8px;
  }

  .control-row:last-child {
    margin-bottom: 0;
  }

  h3 {
    font-size: 12px;
    margin: 0 0 8px 0;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 600;
  }
</style> 