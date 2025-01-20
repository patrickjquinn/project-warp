<script lang="ts">
  import type { Position } from './types';
  import { createEventDispatcher } from 'svelte';

  export let position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'right' | 'bottom' | 'left';
  export let snapToGrid = false;
  export let gridSize = 8;

  const dispatch = createEventDispatcher<{
    resize: { deltaX: number; deltaY: number; position: Position };
    resizeStart: void;
    resizeEnd: void;
  }>();

  let isDragging = false;
  let startX = 0;
  let startY = 0;

  $: handleClass = (() => {
    switch (position) {
      case 'top-left':
        return 'top-left';
      case 'top-right':
        return 'top-right';
      case 'bottom-left':
        return 'bottom-left';
      case 'bottom-right':
        return 'bottom-right';
      case 'top':
        return 'top';
      case 'right':
        return 'right';
      case 'bottom':
        return 'bottom';
      case 'left':
        return 'left';
      default:
        return '';
    }
  })();

  $: cursor = (() => {
    switch (position) {
      case 'top-left':
      case 'bottom-right':
        return 'nwse-resize';
      case 'top-right':
      case 'bottom-left':
        return 'nesw-resize';
      case 'top':
      case 'bottom':
        return 'ns-resize';
      case 'left':
      case 'right':
        return 'ew-resize';
      default:
        return 'pointer';
    }
  })();

  function handleMouseDown(event: MouseEvent) {
    isDragging = true;
    startX = event.clientX;
    startY = event.clientY;
    dispatch('resizeStart');

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isDragging) return;

    let deltaX = event.clientX - startX;
    let deltaY = event.clientY - startY;

    if (snapToGrid) {
      deltaX = Math.round(deltaX / gridSize) * gridSize;
      deltaY = Math.round(deltaY / gridSize) * gridSize;
    }

    // Determine which edges should move based on handle position
    const pos: Position = {
      top: position.includes('top'),
      right: position.includes('right'),
      bottom: position.includes('bottom'),
      left: position.includes('left')
    };

    dispatch('resize', { deltaX, deltaY, position: pos });

    startX = event.clientX;
    startY = event.clientY;
  }

  function handleMouseUp() {
    isDragging = false;
    dispatch('resizeEnd');
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }
</script>

<div
  class="resize-handle {handleClass}"
  style="cursor: {cursor}"
  on:mousedown={handleMouseDown}
>
  <div class="handle-inner" />
</div>

<style>
  .resize-handle {
    position: absolute;
    width: 10px;
    height: 10px;
    background: rgba(100, 181, 246, 0.8);
    border-radius: 50%;
    z-index: 100;
  }

  .handle-inner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 6px;
    height: 6px;
    background: #ffffff;
    border-radius: 50%;
  }

  .top-left {
    top: -5px;
    left: -5px;
  }

  .top-right {
    top: -5px;
    right: -5px;
  }

  .bottom-left {
    bottom: -5px;
    left: -5px;
  }

  .bottom-right {
    bottom: -5px;
    right: -5px;
  }

  .top {
    top: -5px;
    left: 50%;
    transform: translateX(-50%);
  }

  .right {
    top: 50%;
    right: -5px;
    transform: translateY(-50%);
  }

  .bottom {
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
  }

  .left {
    top: 50%;
    left: -5px;
    transform: translateY(-50%);
  }

  .resize-handle:hover {
    background: rgba(100, 181, 246, 1);
  }

  .resize-handle:active {
    background: #2196f3;
  }
</style>
