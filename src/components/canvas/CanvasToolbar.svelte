<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { canvasStore } from './stores/canvasStore';

  const dispatch = createEventDispatcher();

  interface Device {
    name: string;
    width: number;
    height: number;
  }

  // Device presets
  const devices: Device[] = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 800 }
  ];

  let currentDevice = devices[0];
  let showGrid = false;
  let snapToGrid = false;
  let gridSize = 8;
  let zoom = 100;

  // Track undo/redo state
  let canUndo = false;
  let canRedo = false;

  $: {
    canUndo = canvasStore.canUndo();
    canRedo = canvasStore.canRedo();
  }

  function handleDeviceChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const device = devices[select.selectedIndex];
    currentDevice = device;
    dispatch('deviceChange', device);
  }

  function toggleGrid() {
    showGrid = !showGrid;
    dispatch('gridToggle', showGrid);
  }

  function toggleSnap() {
    snapToGrid = !snapToGrid;
    dispatch('snapToggle', snapToGrid);
  }

  function updateZoom(delta: number) {
    zoom = Math.max(25, Math.min(200, zoom + delta));
    dispatch('zoomChange', zoom);
  }

  function alignSelected(alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') {
    dispatch('align', alignment);
  }

  function distributeSelected(direction: 'horizontal' | 'vertical') {
    dispatch('distribute', direction);
  }

  function moveLayer(direction: 'up' | 'down' | 'top' | 'bottom') {
    dispatch('layer', direction);
  }

  function groupSelected() {
    dispatch('group');
  }

  function ungroupSelected() {
    dispatch('ungroup');
  }

  function handleUndo() {
    canvasStore.undo();
  }

  function handleRedo() {
    canvasStore.redo();
  }

  // Setup keyboard shortcuts
  onMount(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key === 'z') {
        event.preventDefault();
        handleUndo();
      } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z') {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });
</script>

<div class="canvas-toolbar glass">
  <div class="toolbar-section">
    <button 
      class="glass-button" 
      on:click={handleUndo}
      disabled={!canUndo}
      title="Undo (Ctrl+Z)"
    >
      ↶
    </button>
    <button 
      class="glass-button" 
      on:click={handleRedo}
      disabled={!canRedo}
      title="Redo (Ctrl+Shift+Z)"
    >
      ↷
    </button>
  </div>

  <div class="toolbar-section">
    <select 
      value={currentDevice.name} 
      on:change={handleDeviceChange}
      class="glass-select"
    >
      {#each devices as device}
        <option value={device.name}>{device.name}</option>
      {/each}
    </select>
    <input 
      type="number" 
      bind:value={zoom}
      min="25"
      max="200"
      step="25"
      class="glass-input"
    />
    <button class="glass-button" on:click={() => updateZoom(-25)}>-</button>
    <button class="glass-button" on:click={() => updateZoom(25)}>+</button>
  </div>

  <div class="toolbar-section">
    <button 
      class="glass-button" 
      class:active={showGrid} 
      on:click={toggleGrid}
      title="Toggle Grid"
    >
      Grid
    </button>
    <button 
      class="glass-button" 
      class:active={snapToGrid} 
      on:click={toggleSnap}
      title="Snap to Grid"
    >
      Snap
    </button>
    {#if showGrid}
      <input 
        type="number" 
        bind:value={gridSize}
        min="4"
        max="32"
        step="4"
        class="glass-input"
      />
    {/if}
  </div>

  <div class="toolbar-section">
    <button 
      class="glass-button" 
      on:click={() => alignSelected('left')}
      title="Align Left"
    >
      ⇤
    </button>
    <button 
      class="glass-button" 
      on:click={() => alignSelected('center')}
      title="Align Center"
    >
      ⇔
    </button>
    <button 
      class="glass-button" 
      on:click={() => alignSelected('right')}
      title="Align Right"
    >
      ⇥
    </button>
    <button 
      class="glass-button" 
      on:click={() => alignSelected('top')}
      title="Align Top"
    >
      ⇧
    </button>
    <button 
      class="glass-button" 
      on:click={() => alignSelected('middle')}
      title="Align Middle"
    >
      ⇕
    </button>
    <button 
      class="glass-button" 
      on:click={() => alignSelected('bottom')}
      title="Align Bottom"
    >
      ⇩
    </button>
  </div>

  <div class="toolbar-section">
    <button 
      class="glass-button" 
      on:click={() => distributeSelected('horizontal')}
      title="Distribute Horizontally"
    >
      ⇹
    </button>
    <button 
      class="glass-button" 
      on:click={() => distributeSelected('vertical')}
      title="Distribute Vertically"
    >
      ⫯
    </button>
  </div>

  <div class="toolbar-section">
    <button 
      class="glass-button" 
      on:click={() => moveLayer('top')}
      title="Bring to Front"
    >
      ⭱
    </button>
    <button 
      class="glass-button" 
      on:click={() => moveLayer('up')}
      title="Bring Forward"
    >
      ↑
    </button>
    <button 
      class="glass-button" 
      on:click={() => moveLayer('down')}
      title="Send Backward"
    >
      ↓
    </button>
    <button 
      class="glass-button" 
      on:click={() => moveLayer('bottom')}
      title="Send to Back"
    >
      ⭳
    </button>
  </div>

  <div class="toolbar-section">
    <button 
      class="glass-button" 
      on:click={groupSelected}
      title="Group Selection"
    >
      Group
    </button>
    <button 
      class="glass-button" 
      on:click={ungroupSelected}
      title="Ungroup Selection"
    >
      Ungroup
    </button>
  </div>
</div>

<style>
  .canvas-toolbar {
    display: flex;
    gap: 1rem;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    align-items: center;
  }

  .toolbar-section {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding: 0 0.5rem;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }

  .toolbar-section:last-child {
    border-right: none;
  }

  .glass-button {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #ffffff;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .glass-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
  }

  .glass-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .glass-button.active {
    background: rgba(100, 181, 246, 0.2);
    border-color: #64b5f6;
  }

  .glass-input, .glass-select {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #ffffff;
    padding: 0.25rem;
    border-radius: 4px;
    width: 4rem;
  }

  .glass-select {
    width: auto;
  }

  .glass-input:focus, .glass-select:focus {
    outline: none;
    border-color: #64b5f6;
  }

  /* Style the select options */
  .glass-select option {
    background-color: #2d2d2d;
    color: #ffffff;
  }
</style>
