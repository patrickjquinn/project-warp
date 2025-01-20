<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { WidgetType } from './types';

  const dispatch = createEventDispatcher();

  interface ComponentTemplate {
    type: WidgetType;
    icon: string;
    label: string;
    defaultValue?: string;
    defaultStyles?: Record<string, string>;
  }

  const components: ComponentTemplate[] = [
    {
      type: 'container',
      icon: '⬚',
      label: 'Container',
      defaultStyles: {
        width: '200px',
        height: '200px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        gap: '8px'
      }
    },
    {
      type: 'label',
      icon: 'T',
      label: 'Text',
      defaultValue: 'Text Label',
      defaultStyles: {
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: 'normal'
      }
    },
    {
      type: 'button',
      icon: '⬭',
      label: 'Button',
      defaultValue: 'Button',
      defaultStyles: {
        padding: '8px 16px',
        backgroundColor: 'rgba(100, 181, 246, 0.2)',
        border: '1px solid #64b5f6',
        borderRadius: '4px',
        color: '#ffffff',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'medium',
        transition: 'all 0.2s ease'
      }
    },
    {
      type: 'image',
      icon: '🖼',
      label: 'Image',
      defaultStyles: {
        width: '200px',
        height: '150px',
        objectFit: 'cover',
        borderRadius: '4px'
      }
    },
    {
      type: 'scrollContainer',
      icon: '⬍',
      label: 'Scroll Area',
      defaultStyles: {
        width: '200px',
        height: '200px',
        overflow: 'auto',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '4px',
        padding: '8px'
      }
    },
    {
      type: 'videoPlayer',
      icon: '▶',
      label: 'Video',
      defaultStyles: {
        width: '320px',
        height: '180px',
        backgroundColor: '#000000',
        borderRadius: '4px'
      }
    }
  ];

  let draggedComponent: ComponentTemplate | null = null;

  function handleDragStart(component: ComponentTemplate, event: DragEvent) {
    if (!event.dataTransfer) return;
    
    draggedComponent = component;
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/json', JSON.stringify(component));
    
    // Create a ghost image
    const ghost = document.createElement('div');
    ghost.className = 'component-ghost';
    ghost.textContent = component.icon;
    document.body.appendChild(ghost);
    event.dataTransfer.setDragImage(ghost, 25, 25);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }

  function handleDragEnd() {
    draggedComponent = null;
  }
</script>

<div class="component-palette glass">
  <div class="palette-header">
    <h3>Components</h3>
  </div>
  <div class="components-grid">
    {#each components as component}
      <div 
        class="component-item glass"
        draggable="true"
        on:dragstart={(e) => handleDragStart(component, e)}
        on:dragend={handleDragEnd}
      >
        <span class="component-icon">{component.icon}</span>
        <span class="component-label">{component.label}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .component-palette {
    width: 250px;
    height: 100%;
    overflow-y: auto;
    padding: 1rem;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }

  .palette-header {
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .palette-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #ffffff;
  }

  .components-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .component-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    border-radius: 8px;
    cursor: grab;
    transition: all 0.2s ease;
  }

  .component-item:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }

  .component-item:active {
    cursor: grabbing;
  }

  .component-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    color: #64b5f6;
  }

  .component-label {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
  }

  :global(.component-ghost) {
    position: fixed;
    top: -1000px;
    left: -1000px;
    width: 50px;
    height: 50px;
    background: rgba(100, 181, 246, 0.2);
    border: 1px solid #64b5f6;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: #64b5f6;
    pointer-events: none;
  }

  /* Scrollbar styling */
  .component-palette::-webkit-scrollbar {
    width: 8px;
  }

  .component-palette::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  .component-palette::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  .component-palette::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>
