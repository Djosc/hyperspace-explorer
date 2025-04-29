<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  // Props
  export let isVisible = false;
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Close handler
  function handleClose() {
    dispatch('close');
  }
  
  // Info sections
  const sections = [
    {
      title: 'Dimension Controls',
      content: [
        { name: 'Dimension Mode', description: 'Select the dimension mode (3D to 10D) to visualize higher-dimensional objects.' },
        { name: 'Rotation Speed', description: 'Control the speed of dimension rotation.' },
        { name: 'Auto-Rotate', description: 'Toggle automatic rotation through dimensions.' }
      ]
    },
    {
      title: 'Sound Resonance',
      content: [
        { name: 'Frequency', description: 'Adjust the frequency of sound resonance (20-2000 Hz).' },
        { name: 'Amplitude', description: 'Control the amplitude of sound waves.' },
        { name: 'Resonance', description: 'Adjust the resonance factor for sound visualization.' }
      ]
    },
    {
      title: 'Fractal',
      content: [
        { name: 'Iteration Level', description: 'Control the complexity of fractal patterns (1-10).' },
        { name: 'Glow Intensity', description: 'Adjust the glow effect intensity.' }
      ]
    },
    {
      title: 'Quantum Field',
      content: [
        { name: 'Particle Count', description: 'Set the number of particles in the quantum field.' },
        { name: 'Entanglement', description: 'Control the entanglement factor between particles.' },
        { name: 'Uncertainty', description: 'Adjust the uncertainty principle visualization.' }
      ]
    }
  ];
</script>

<div class="info-panel" class:visible={isVisible}>
  <div class="info-content">
    <h2>HyperSpace Explorer</h2>
    <p class="description">Explore higher dimensions through mathematical visualization</p>
    
    {#each sections as section}
      <div class="section">
        <h3>{section.title}</h3>
        <ul>
          {#each section.content as item}
            <li>
              <strong>{item.name}:</strong> {item.description}
            </li>
          {/each}
        </ul>
      </div>
    {/each}
    
    <div class="footer">
      <button class="close-button" on:click={handleClose}>Close</button>
    </div>
  </div>
</div>

<style>
  .info-panel {
    position: fixed;
    top: 0;
    right: -400px;
    width: 400px;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.85);
    color: white;
    z-index: 100;
    transition: right 0.5s ease-in-out;
    overflow-y: auto;
    box-shadow: -5px 0 15px rgba(0, 0, 0, 0.5);
  }
  
  .info-panel.visible {
    right: 0;
  }
  
  .info-content {
    padding: 20px;
    font-family: 'Arial', sans-serif;
  }
  
  h2 {
    margin-top: 0;
    color: #00ffff;
    text-align: center;
    font-size: 24px;
  }
  
  .description {
    text-align: center;
    margin-bottom: 20px;
    color: #aaa;
    font-style: italic;
  }
  
  .section {
    margin-bottom: 25px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 15px;
  }
  
  h3 {
    color: #00ffaa;
    margin-bottom: 10px;
    font-size: 18px;
  }
  
  ul {
    list-style-type: none;
    padding-left: 0;
  }
  
  li {
    margin-bottom: 10px;
    line-height: 1.4;
  }
  
  strong {
    color: #00ffff;
  }
  
  .footer {
    margin-top: 20px;
    text-align: center;
  }
  
  .close-button {
    background-color: rgba(0, 255, 255, 0.2);
    color: #00ffff;
    border: 1px solid #00ffff;
    padding: 8px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
  }
  
  .close-button:hover {
    background-color: rgba(0, 255, 255, 0.3);
  }
  
  /* Custom scrollbar */
  .info-panel::-webkit-scrollbar {
    width: 8px;
  }
  
  .info-panel::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }
  
  .info-panel::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 255, 0.3);
    border-radius: 4px;
  }
  
  .info-panel::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 255, 255, 0.5);
  }
</style> 