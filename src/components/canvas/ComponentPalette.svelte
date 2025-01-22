<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { WidgetType } from './types';
  import {
    Box,
    Type,
    Square as ButtonIcon,
    Image as ImageIcon,
    ScrollText,
    Play
  } from 'lucide-svelte';

  const dispatch = createEventDispatcher();

  interface ComponentTemplate {
    type: WidgetType;
    icon: any; // Lucide icon component type
    label: string;
    defaultValue?: string;
    defaultStyles?: Record<string, string>;
  }

  const components: ComponentTemplate[] = [
    {
      type: 'container',
      icon: Box,
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
      icon: Type,
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
      icon: ButtonIcon,
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
      icon: ImageIcon,
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
      icon: ScrollText,
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
      icon: Play,
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
    ghost.innerHTML = `<div style="width: 24px; height: 24px; color: var(--warp-accent);"></div>`;
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
        role="button"
        tabindex="0"
        aria-label={`Drag ${component.label} component`}
        on:dragstart={(e) => handleDragStart(component, e)}
        on:dragend={handleDragEnd}
        on:keydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleDragStart(component, new DragEvent('dragstart'));
          }
        }}
      >
        <span class="component-icon">
          <svelte:component this={component.icon} size={24} />
        </span>
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
    padding: var(--warp-space-md);
    border-right: 1px solid var(--warp-border);
    background-color: var(--warp-bg-panel);
  }

  .palette-header {
    margin-bottom: var(--warp-space-md);
    padding-bottom: var(--warp-space-sm);
    border-bottom: 1px solid var(--warp-border);
  }

  .palette-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--warp-text-primary);
    letter-spacing: 0.5px;
  }

  .components-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--warp-space-md);
  }

  .component-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--warp-space-md);
    border-radius: 6px;
    cursor: grab;
    transition: all 0.2s ease;
    background-color: var(--warp-bg-main);
    border: 1px solid var(--warp-border);
  }

  .component-item:hover {
    background-color: var(--warp-hover);
    transform: translateY(-2px);
    border-color: var(--warp-accent);
  }

  .component-item:active {
    cursor: grabbing;
    transform: translateY(0);
  }

  .component-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--warp-space-sm);
    color: var(--warp-accent);
    width: 24px;
    height: 24px;
  }

  .component-label {
    font-size: 12px;
    color: var(--warp-text-secondary);
    transition: color 0.2s ease;
  }

  .component-item:hover .component-label {
    color: var(--warp-text-primary);
  }

  :global(.component-ghost) {
    position: fixed;
    top: -1000px;
    left: -1000px;
    width: 50px;
    height: 50px;
    background-color: var(--warp-accent-transparent);
    border: 1px solid var(--warp-accent);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--warp-accent);
    pointer-events: none;
  }

  /* Scrollbar styling */
  .component-palette::-webkit-scrollbar {
    width: 8px;
  }

  .component-palette::-webkit-scrollbar-track {
    background: transparent;
  }

  .component-palette::-webkit-scrollbar-thumb {
    background-color: var(--warp-border);
    border-radius: 4px;
    border: 2px solid var(--warp-bg-panel);
  }

  .component-palette::-webkit-scrollbar-thumb:hover {
    background-color: var(--warp-border-light);
  }
</style>
