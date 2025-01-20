<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { canvasStore, canvasSettings } from './stores/canvasStore';
  import type { CanvasItem } from './types';

  export let items: CanvasItem[] = [];

  const dispatch = createEventDispatcher<{
    action: CanvasItem[];
  }>();

  let canvasElement: HTMLElement;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let draggedItemId: number | null = null;

  $: ({ showGrid, snapToGrid, gridSize, zoom, currentDevice } = $canvasSettings);

	// Update store when items prop changes
	$: {
		console.log('UICanvas items changed:', items);
		if (items && JSON.stringify(items) !== JSON.stringify($canvasStore.items)) {
			console.log('Updating canvas store with items:', items);
			canvasStore.setItems(items);
		}
	}

	// Update items prop when store changes
	$: {
		console.log('Canvas store items changed:', $canvasStore.items);
		if ($canvasStore.items && JSON.stringify($canvasStore.items) !== JSON.stringify(items)) {
			console.log('Updating items prop from store:', $canvasStore.items);
			items = [...$canvasStore.items];
			dispatch('action', items);
		}
	}

  function styleToString(style: Record<string, string>): string {
    return Object.entries(style)
      .map(([key, value]) => `${key}: ${value}`)
      .join(';');
  }

  function getItemStyle(item: CanvasItem): string {
    const styleKey = Object.keys(item.style)[0];
    return styleToString(item.style[styleKey]);
  }

  function snapToGridValue(value: number): number {
    return snapToGrid ? Math.round(value / gridSize) * gridSize : value;
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';

    // Find potential container under cursor
    const target = event.target as HTMLElement;
    const containerElement = target.closest('.container');
    if (containerElement) {
      const containerId = parseInt(containerElement.getAttribute('data-id') || '');
      if (!isNaN(containerId) && draggedItemId && !canvasStore.isDescendantOf(containerId, draggedItemId)) {
        canvasStore.setHoveredContainer(containerId);
      }
    } else {
      canvasStore.setHoveredContainer(undefined);
    }
  }

  function handleDragStart(event: DragEvent, item: CanvasItem) {
    draggedItemId = item.id;
    canvasStore.startDrag(item.id, event.clientX, event.clientY);
    
    // Set drag image
    const dragImage = event.target as HTMLElement;
    if (dragImage) {
      event.dataTransfer?.setDragImage(dragImage, 0, 0);
    }
  }

  function handleDragEnd() {
    draggedItemId = null;
    canvasStore.endDrag();
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    
    if (draggedItemId) {
      // Handle internal drag and drop
      const target = event.target as HTMLElement;
      const containerElement = target.closest('.container');
      if (containerElement) {
        const containerId = parseInt(containerElement.getAttribute('data-id') || '');
        if (!isNaN(containerId) && !canvasStore.isDescendantOf(containerId, draggedItemId)) {
          canvasStore.nestItem(draggedItemId, containerId);
        }
      } else {
        canvasStore.unnestItem(draggedItemId);
      }
    } else {
      // Handle new component drop
      const componentData = event.dataTransfer?.getData('application/json');
      if (!componentData) return;

      const component = JSON.parse(componentData);
      const rect = canvasElement.getBoundingClientRect();
      const x = snapToGridValue(event.clientX - rect.left);
      const y = snapToGridValue(event.clientY - rect.top);

      const target = event.target as HTMLElement;
      const containerElement = target.closest('.container');
      const containerId = containerElement ? 
        parseInt(containerElement.getAttribute('data-id') || '') : 
        undefined;

      const newItem: Omit<CanvasItem, 'id'> = {
        widget: component.type,
        value: component.defaultValue || '',
        parentId: containerId,
        isContainer: component.type === 'container',
        style: {
          [`#${component.type}`]: {
            ...component.defaultStyles,
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`
          }
        }
      };

      canvasStore.addItem(newItem);
    }
  }

  function handleMouseDown(event: MouseEvent, item?: CanvasItem) {
    const rect = canvasElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (item && event.target instanceof HTMLElement && event.target.classList.contains('handle')) {
      isDragging = true;
      dragStartX = event.clientX;
      dragStartY = event.clientY;

      const styleKey = Object.keys(item.style)[0];
      const currentLeft = parseInt(item.style[styleKey].left || '0');
      const currentTop = parseInt(item.style[styleKey].top || '0');

      function handleMouseMove(moveEvent: MouseEvent) {
        if (!isDragging) return;

        const deltaX = moveEvent.clientX - dragStartX;
        const deltaY = moveEvent.clientY - dragStartY;

        const newLeft = snapToGridValue(currentLeft + deltaX);
        const newTop = snapToGridValue(currentTop + deltaY);

        canvasStore.updateItemStyle(item.id, {
          left: `${newLeft}px`,
          top: `${newTop}px`
        });
      }

      function handleMouseUp() {
        isDragging = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      }

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else if (item) {
      canvasStore.selectItem(item.id, event.ctrlKey || event.metaKey);
    } else {
      // Start rectangle selection
      canvasStore.startSelection(x, y);

      function handleMouseMove(moveEvent: MouseEvent) {
        const newX = moveEvent.clientX - rect.left;
        const newY = moveEvent.clientY - rect.top;
        canvasStore.updateSelection(newX, newY);
      }

      function handleMouseUp() {
        canvasStore.endSelection();
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      }

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const selectedIds = [...$canvasStore.selectedItems];
      selectedIds.forEach(id => canvasStore.removeItem(id));
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      canvasStore.copySelected();
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      canvasStore.copySelected(); // This will create a new copy
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.preventDefault();
      canvasStore.selectAll();
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'g') {
      event.preventDefault();
      canvasStore.groupSelected();
    } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'g') {
      event.preventDefault();
      canvasStore.ungroupSelected();
    }
  }

  function renderItem(item: CanvasItem) {
    const isHovered = $canvasStore.hoveredContainer === item.id;
    const isSelected = $canvasStore.selectedItems.has(item.id);
    const depth = canvasStore.getItemDepth(item.id);
    
    return `
      <div
        class="canvas-item ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}"
        style="z-index: ${depth * 10}"
        draggable="true"
        data-id="${item.id}"
      >
        <div class="handle" />
        ${item.widget === 'container' ? `
          <div 
            class="container ${isHovered ? 'hovered' : ''} ${item.value?.split(/\s+/).filter(Boolean).join(' ')}" 
            style="${getItemStyle(item)}"
            data-id="${item.id}"
          >
            ${item.value || ''}
            ${$canvasStore.items
              .filter(child => child.parentId === item.id)
              .map(child => renderItem(child))
              .join('')}
          </div>
        ` : item.widget === 'label' ? `
          <div class="label" style="${getItemStyle(item)}">
            ${item.value || ''}
          </div>
        ` : item.widget === 'button' ? `
          <button class="button" style="${getItemStyle(item)}">
            ${item.value || ''}
          </button>
        ` : item.widget === 'image' ? `
          <img
            src="${item.value}"
            alt="Canvas Image"
            style="${getItemStyle(item)}"
          />
        ` : item.widget === 'scrollContainer' ? `
          <div class="scroll-container" style="${getItemStyle(item)}">
            ${item.value || ''}
          </div>
        ` : item.widget === 'videoPlayer' ? `
          <video
            src="${item.value}"
            controls
            style="${getItemStyle(item)}"
          />
        ` : ''}
      </div>
    `;
  }

  onMount(() => {
    canvasElement.addEventListener('keydown', handleKeyDown);
    return () => {
      canvasElement.removeEventListener('keydown', handleKeyDown);
    };
  });
</script>

<div 
  class="canvas-container"
  style="--zoom: {zoom}%; --device-width: {currentDevice.width}px; --device-height: {currentDevice.height}px"
>
  <div
    class="canvas"
    class:show-grid={showGrid}
    style="--grid-size: {gridSize}px"
    bind:this={canvasElement}
    on:dragover={handleDragOver}
    on:drop={handleDrop}
    on:mousedown={(e) => handleMouseDown(e)}
    tabindex="0"
  >
    {#if $canvasStore.selectionBox}
      <div
        class="selection-box"
        style="
          left: {Math.min($canvasStore.selectionBox.startX, $canvasStore.selectionBox.endX)}px;
          top: {Math.min($canvasStore.selectionBox.startY, $canvasStore.selectionBox.endY)}px;
          width: {Math.abs($canvasStore.selectionBox.endX - $canvasStore.selectionBox.startX)}px;
          height: {Math.abs($canvasStore.selectionBox.endY - $canvasStore.selectionBox.startY)}px;
        "
      />
    {/if}
    {#each $canvasStore.items.filter(item => !item.parentId) as item (item.id)}
      <div
        class="canvas-item"
        class:selected={$canvasStore.selectedItems.has(item.id)}
        class:hovered={$canvasStore.hoveredContainer === item.id}
        style="z-index: {canvasStore.getItemDepth(item.id) * 10}"
        draggable="true"
        data-id={item.id}
        on:mousedown={(e) => handleMouseDown(e, item)}
        on:dragstart={(e) => handleDragStart(e, item)}
        on:dragend={handleDragEnd}
      >
        <div class="handle" />
        {#if item.widget === 'container'}
          <div 
            class={`container ${item.value?.split(/\s+/).filter(Boolean).join(' ')}`}
            class:hovered={$canvasStore.hoveredContainer === item.id}
            style={getItemStyle(item)}
            data-id={item.id}
          >
            {item.value}
            {#each $canvasStore.items.filter(child => child.parentId === item.id) as child (child.id)}
              {@html renderItem(child)}
            {/each}
          </div>
        {:else if item.widget === 'label'}
          <div class="label" style={getItemStyle(item)}>
            {item.value}
          </div>
        {:else if item.widget === 'button'}
          <button class="button" style={getItemStyle(item)}>
            {item.value}
          </button>
        {:else if item.widget === 'image'}
          <img
            src={item.value}
            alt="Canvas Image"
            style={getItemStyle(item)}
          />
        {:else if item.widget === 'scrollContainer'}
          <div class="scroll-container" style={getItemStyle(item)}>
            {item.value}
          </div>
        {:else if item.widget === 'videoPlayer'}
          <video
            src={item.value}
            controls
            style={getItemStyle(item)}
          />
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .selection-box {
    position: absolute;
    border: 1px solid #64b5f6;
    background: rgba(100, 181, 246, 0.1);
    pointer-events: none;
  }

  .group {
    position: absolute;
    border: 1px dashed rgba(100, 181, 246, 0.5);
    background: rgba(100, 181, 246, 0.1);
    pointer-events: none;
  }

  .canvas-container {
    width: 100%;
    height: 100%;
    overflow: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #1e1e1e;
    padding: 2rem;
  }

  .canvas {
    width: var(--device-width);
    height: var(--device-height);
    background: linear-gradient(45deg, #2d2d2d, #1e1e1e);
    position: relative;
    transform: scale(calc(var(--zoom) / 100));
    transform-origin: center center;
    transition: transform 0.2s ease;
    outline: none;
    overflow: hidden;
  }

  .canvas.show-grid {
    background-image: 
      linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    background-size: var(--grid-size) var(--grid-size);
  }

  .canvas-item {
    position: absolute;
    user-select: none;
  }

  .canvas-item.selected {
    outline: 2px solid #64b5f6;
  }

  .canvas-item.hovered {
    outline: 2px dashed #64b5f6;
  }

  .handle {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 16px;
    height: 16px;
    background-color: #64b5f6;
    border-radius: 50%;
    cursor: move;
    display: none;
  }

  .canvas-item:hover .handle,
  .canvas-item.selected .handle {
    display: block;
  }

  .container {
    min-width: 100px;
    min-height: 100px;
    position: relative;
    transition: background-color 0.2s ease;
  }

  .container.hovered {
    background: rgba(100, 181, 246, 0.1) !important;
    border-color: #64b5f6 !important;
  }

  .container.glass {
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .container.navbar {
    padding: 1rem 0;
    margin-bottom: 2rem;
    border-radius: 0;
  }

  .container.navbar :global(a) {
    color: var(--text-color, #ffffff);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .container.navbar :global(a:hover) {
    color: var(--primary-color, #64b5f6);
  }

  .container.navbar .brand {
    font-size: 1.5rem;
    font-weight: bold;
  }

  .container.navbar .nav-links {
    display: flex;
    gap: 2rem;
  }

  .label {
    color: #ffffff;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .button {
    cursor: pointer;
    border: none;
    background: rgba(100, 181, 246, 0.2);
    color: #ffffff;
    padding: 8px 16px;
    border-radius: 4px;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .scroll-container {
    overflow: auto;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
</style>
