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
    'hyper10D'
  ];
  
  const colorModes: ColorMode[] = [
    'spectralShift', 
    'kaleidoscope', 
    'both', 
    'hyperspace'
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
  
  // Event dispatcher
  const dispatch = createEventDispatcher();

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

  function handleComplexityChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value);
    if (isNaN(value) || value < 1 || value > 10) {
      console.error('Invalid complexity value');
      return;
    }
    console.log(`Changing complexity to: ${value}`);
    appStore.setComplexity(value);
  }

  function handleSymmetryChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value);
    if (isNaN(value) || value < 3 || value > 12) {
      console.error('Invalid symmetry value');
      return;
    }
    console.log(`Changing symmetry to: ${value}`);
    appStore.setSymmetry(value);
  }

  function handleSpeedChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    if (isNaN(value) || value < 0.1 || value > 5) {
      console.error('Invalid speed value');
      return;
    }
    console.log(`Changing speed to: ${value}`);
    appStore.setSpeed(value);
  }

  function togglePlayPause() {
    const newState = !$appStore.isPlaying;
    console.log(`Toggling play/pause to: ${newState ? 'play' : 'pause'}`);
    appStore.togglePlay();
  }

  function toggleAnnotations() {
    console.log('Toggling annotations');
    appStore.toggleAnnotations();
  }

  function toggleDimensionRotation() {
    console.log('Toggling dimension rotation');
    appStore.toggleDimensionRotation();
  }
  
  // Format the display name for geometry types and color modes
  function formatDisplayName(name: string): string {
    // Convert camelCase to Title Case with spaces
    return name
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  }

  // Handle input changes
  function handleInputChange(event, param) {
    const value = event.target.type === 'checkbox' 
      ? event.target.checked 
      : parseFloat(event.target.value);
    
    console.log(`Input change for ${param}:`, value);
    dispatch(`${param}Change`, value);
  }
  
  function handleSelectChange(event, param) {
    console.log(`Select change for ${param}:`, event.target.value);
    dispatch(`${param}Change`, event.target.value);
  }
</script>

<div class="controls">
  <h2>HyperSpace Explorer</h2>
  
  <div class="control-group">
    <label for="geometry-type">Geometry Type</label>
    <select id="geometry-type" on:change={handleGeometryTypeChange}>
      {#each geometryTypes as type}
        <option value={type} selected={$appStore.geometryType === type}>
          {formatDisplayName(type)}
        </option>
      {/each}
    </select>
  </div>

  <div class="control-group">
    <label for="color-mode">Color Mode</label>
    <select id="color-mode" on:change={handleColorModeChange}>
      {#each colorModes as mode}
        <option value={mode} selected={$appStore.colorMode === mode}>
          {formatDisplayName(mode)}
        </option>
      {/each}
    </select>
  </div>

  <div class="control-group">
    <label for="dimension-mode">Dimension Mode</label>
    <select id="dimension-mode" on:change={(e) => handleSelectChange(e, 'dimensionMode')}>
      {#each dimensionModes as mode}
        <option value={mode} selected={$appStore.dimensionMode === mode}>
          {mode}
        </option>
      {/each}
    </select>
  </div>

  <div class="control-group">
    <label for="complexity">Complexity: {$appStore.complexity}</label>
    <input
      type="range"
      id="complexity"
      min="1"
      max="10"
      value={$appStore.complexity}
      on:input={handleComplexityChange}
    />
  </div>

  <div class="control-group">
    <label for="symmetry">Symmetry: {$appStore.symmetry}</label>
    <input
      type="range"
      id="symmetry"
      min="2"
      max="16"
      value={$appStore.symmetry}
      on:input={handleSymmetryChange}
    />
  </div>

  <div class="control-group">
    <label for="speed">Speed: {$appStore.speed.toFixed(1)}x</label>
    <input
      type="range"
      id="speed"
      min="0.1"
      max="5"
      step="0.1"
      value={$appStore.speed}
      on:input={handleSpeedChange}
    />
  </div>

  <div class="button-group">
    <button class="play-pause" on:click={togglePlayPause}>
      {$appStore.isPlaying ? '⏸️ Pause' : '▶️ Play'}
    </button>
    
    <button class="annotations-toggle" on:click={toggleAnnotations}>
      {$appStore.showAnnotations ? '🔍 Hide Annotations' : '🔍 Show Annotations'}
    </button>
    
    <button class="dimension-rotation-toggle" on:click={toggleDimensionRotation}>
      {$appStore.autoRotateDimensions ? '🔄 Stop Dimension Rotation' : '🔄 Start Dimension Rotation'}
    </button>
  </div>
  
  <div class="info-text">
    <p>Explore higher dimensions through mathematical visualization</p>
    <p class="dimension-info">
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
    </p>
  </div>

  <div class="control-group">
    <h3>Dimension Controls</h3>
    <div class="control-row">
      <label for="dimensionMode">Dimension Mode:</label>
      <select 
        id="dimensionMode" 
        value={dimensionMode} 
        on:change={(e) => handleSelectChange(e, 'dimensionMode')}
      >
        {#each dimensionModes as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
    </div>
    <div class="control-row">
      <label for="dimensionRotationSpeed">Rotation Speed:</label>
      <input 
        type="range" 
        id="dimensionRotationSpeed" 
        min="0" 
        max="2" 
        step="0.1" 
        value={dimensionRotationSpeed} 
        on:input={(e) => handleInputChange(e, 'dimensionRotationSpeed')}
      />
      <span class="value-display">{dimensionRotationSpeed.toFixed(1)}</span>
    </div>
    <div class="control-row">
      <label for="autoRotateDimensions">Auto-Rotate Dimensions:</label>
      <input 
        type="checkbox" 
        id="autoRotateDimensions" 
        checked={autoRotateDimensions} 
        on:change={(e) => handleInputChange(e, 'autoRotateDimensions')}
      />
    </div>
  </div>
  
  <div class="control-group">
    <h3>Sound Resonance</h3>
    <div class="control-row">
      <label for="frequency">Frequency (Hz):</label>
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
      <label for="amplitude">Amplitude:</label>
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
    <div class="control-row">
      <label for="resonance">Resonance:</label>
      <input 
        type="range" 
        id="resonance" 
        min="0" 
        max="1" 
        step="0.01" 
        value={resonance} 
        on:input={(e) => handleInputChange(e, 'resonance')}
      />
      <span class="value-display">{resonance.toFixed(2)}</span>
    </div>
  </div>
  
  <div class="control-group">
    <h3>Fractal</h3>
    <div class="control-row">
      <label for="iteration">Iteration Level:</label>
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
      <label for="glowIntensity">Glow Intensity:</label>
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
      <label for="particleCount">Particle Count:</label>
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
      <label for="entanglement">Entanglement:</label>
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
    <div class="control-row">
      <label for="uncertainty">Uncertainty:</label>
      <input 
        type="range" 
        id="uncertainty" 
        min="0" 
        max="1" 
        step="0.01" 
        value={uncertainty} 
        on:input={(e) => handleInputChange(e, 'uncertainty')}
      />
      <span class="value-display">{uncertainty.toFixed(2)}</span>
    </div>
  </div>
</div>

<style>
  .controls {
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 20px;
    border-radius: 10px;
    z-index: 1000;
    width: 300px;
    max-height: 90vh;
    overflow-y: auto;
  }

  h2 {
    margin-top: 0;
    text-align: center;
    color: #00ffff;
  }

  .control-group {
    margin-bottom: 15px;
  }

  label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }

  select, input {
    width: 100%;
    padding: 8px;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    border: 1px solid #00ffff;
    border-radius: 4px;
  }

  input[type="range"] {
    -webkit-appearance: none;
    height: 8px;
    background: #333;
    border-radius: 4px;
    outline: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: #00ffff;
    border-radius: 50%;
    cursor: pointer;
  }

  .button-group {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
  }

  button {
    padding: 8px 15px;
    background-color: #00ffff;
    color: black;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }

  button:hover {
    background-color: #00cccc;
  }

  .info-text {
    margin-top: 20px;
    font-size: 0.9em;
    text-align: center;
    color: #aaa;
  }

  .dimension-info {
    margin-top: 5px;
    font-style: italic;
    color: #00ffff;
  }

  .control-group:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
  
  h3 {
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: bold;
    color: #4fc3f7;
  }
  
  .control-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .value-display {
    min-width: 50px;
    text-align: right;
    font-size: 14px;
    color: #81c784;
  }
  
  /* Custom styling for range inputs */
  input[type="range"] {
    -webkit-appearance: none;
    height: 6px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    outline: none;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: #4fc3f7;
    border-radius: 50%;
    cursor: pointer;
  }
  
  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: #4fc3f7;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
  
  /* Scrollbar styling */
  .controls::-webkit-scrollbar {
    width: 8px;
  }
  
  .controls::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
  }
  
  .controls::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }
  
  .controls::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
</style> 