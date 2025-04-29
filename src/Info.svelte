<script>
  import { createEventDispatcher } from 'svelte';
  
  // Props
  export let isVisible = false;
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Close the info panel
  function closeInfo() {
    dispatch('close');
  }
  
  // Info sections
  const sections = [
    {
      title: 'Dimension Controls',
      content: `The dimension controls allow you to explore higher-dimensional spaces:
      - Dimension Mode: Switch between different dimensional representations (3D to 10D)
      - Rotation Speed: Control how fast the dimensions rotate
      - Auto-Rotate: Automatically rotate through dimensions`
    },
    {
      title: 'Sound Resonance',
      content: `The sound resonance visualization creates geometric patterns based on sound waves:
      - Frequency: Control the pitch of the sound (20Hz to 2000Hz)
      - Amplitude: Adjust the volume/intensity of the sound
      - Resonance: Modify how the sound waves interact with the geometry`
    },
    {
      title: 'Fractal',
      content: `The fractal visualization generates recursive geometric patterns:
      - Iteration Level: Control the depth of the fractal (1 to 10)
      - Glow Intensity: Adjust the brightness of the fractal patterns`
    },
    {
      title: 'Quantum Field',
      content: `The quantum field visualization simulates particle behavior:
      - Particle Count: Set the number of particles (10 to 1000)
      - Entanglement: Control how particles interact with each other
      - Uncertainty: Adjust the randomness of particle movement`
    }
  ];
</script>

<div class="info-panel" class:visible={isVisible}>
  <div class="info-content">
    <div class="info-header">
      <h2>Hyperspace Explorer</h2>
      <button class="close-button" on:click={closeInfo}>×</button>
    </div>
    
    <div class="info-sections">
      {#each sections as section}
        <div class="info-section">
          <h3>{section.title}</h3>
          <p>{section.content}</p>
        </div>
      {/each}
    </div>
    
    <div class="info-footer">
      <p>Use the controls panel to adjust visualization parameters and explore different dimensional spaces.</p>
    </div>
  </div>
</div>

<style>
  .info-panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 400px;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    font-family: 'Arial', sans-serif;
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out;
    z-index: 1000;
  }
  
  .info-panel.visible {
    transform: translateX(0);
  }
  
  .info-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 20px;
    overflow-y: auto;
  }
  
  .info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  h2 {
    margin: 0;
    font-size: 24px;
    color: #4fc3f7;
  }
  
  .close-button {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
  }
  
  .close-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .info-sections {
    flex: 1;
  }
  
  .info-section {
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .info-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
  
  h3 {
    margin: 0 0 10px 0;
    font-size: 18px;
    color: #81c784;
  }
  
  p {
    margin: 0;
    line-height: 1.5;
    font-size: 14px;
  }
  
  .info-footer {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }
  
  /* Scrollbar styling */
  .info-content::-webkit-scrollbar {
    width: 8px;
  }
  
  .info-content::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
  }
  
  .info-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }
  
  .info-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
</style> 