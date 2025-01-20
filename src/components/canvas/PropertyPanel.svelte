<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { CanvasItem, StyleProperty, WidgetProperties, SelectedItem } from './types';
  import selected from './stores/selected';

  const dispatch = createEventDispatcher();

  const commonProperties: StyleProperty[] = [
    { name: 'width', type: 'text', label: 'Width' },
    { name: 'height', type: 'text', label: 'Height' },
    { name: 'backgroundColor', type: 'color', label: 'Background' },
    { name: 'color', type: 'color', label: 'Text Color' },
    { name: 'fontSize', type: 'number', unit: 'px', label: 'Font Size' },
    { name: 'padding', type: 'text', label: 'Padding' },
    { name: 'margin', type: 'text', label: 'Margin' },
    { name: 'borderRadius', type: 'text', label: 'Border Radius' },
    { name: 'border', type: 'text', label: 'Border' },
    { name: 'opacity', type: 'number', label: 'Opacity' },
    { name: 'display', type: 'select', options: ['block', 'flex', 'grid', 'none'], label: 'Display' },
    { name: 'position', type: 'select', options: ['static', 'relative', 'absolute', 'fixed'], label: 'Position' }
  ];

  const widgetSpecificProperties: WidgetProperties = {
    container: [
      { name: 'flexDirection', type: 'select', options: ['row', 'column'], label: 'Direction' },
      { name: 'justifyContent', type: 'select', options: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around'], label: 'Justify' },
      { name: 'alignItems', type: 'select', options: ['flex-start', 'center', 'flex-end', 'stretch'], label: 'Align' }
    ],
    button: [
      { name: 'cursor', type: 'select', options: ['pointer', 'default'], label: 'Cursor' },
      { name: 'fontWeight', type: 'select', options: ['normal', 'bold'], label: 'Font Weight' }
    ],
    image: [
      { name: 'objectFit', type: 'select', options: ['contain', 'cover', 'fill', 'none'], label: 'Object Fit' }
    ],
    label: [],
    videoPlayer: [],
    scrollContainer: []
  };

  let selectedItem: SelectedItem | null = null;
  let currentStyles: Record<string, string> = {};

  function handleSelectedUpdate(data: unknown) {
    if (data && typeof data === 'object' && 'style' in data) {
      selectedItem = data as SelectedItem;
      const styleKey = Object.keys(selectedItem.style)[0];
      currentStyles = selectedItem.style[styleKey] || {};
    } else {
      selectedItem = null;
      currentStyles = {};
    }
  }

  selected.subscribe(handleSelectedUpdate);

  function updateStyle(property: string, value: string) {
    if (!selectedItem) return;

    const styleKey = Object.keys(selectedItem.style)[0];
    const newStyles = {
      ...selectedItem.style[styleKey],
      [property]: value
    };

    dispatch('styleChange', {
      id: selectedItem.id,
      styles: { [styleKey]: newStyles }
    });
  }

  function getInputValue(event: Event): string {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    return target.value;
  }

  function handleInput(event: Event, property: string) {
    updateStyle(property, getInputValue(event));
  }

  function getApplicableProperties(): StyleProperty[] {
    if (!selectedItem) return [];
    
    const widgetProps = widgetSpecificProperties[selectedItem.widget] || [];
    return [...commonProperties, ...widgetProps];
  }

  function handleValueChange(event: Event) {
    if (!selectedItem) return;
    const target = event.target as HTMLInputElement;
    dispatch('valueChange', {
      id: selectedItem.id,
      value: target.value
    });
  }
</script>

<div class="property-panel glass">
  {#if selectedItem}
    <div class="panel-header">
      <h3>{selectedItem.widget}</h3>
      <span class="id">ID: {selectedItem.id}</span>
    </div>

    <div class="properties">
      {#if selectedItem.widget !== 'container'}
        <div class="property-group">
          <label>Content</label>
          <input 
            type="text" 
            class="glass-input" 
            value={selectedItem.value || ''} 
            on:input={handleValueChange}
          />
        </div>
      {/if}

      {#each getApplicableProperties() as prop}
        <div class="property-group">
          <label>{prop.label}</label>
          {#if prop.type === 'select'}
            <select 
              class="glass-select"
              value={currentStyles[prop.name] || ''}
              on:change={(e) => handleInput(e, prop.name)}
            >
              <option value="">Default</option>
              {#each prop.options || [] as option}
                <option value={option}>{option}</option>
              {/each}
            </select>
          {:else if prop.type === 'color'}
            <div class="color-input">
              <input 
                type="color"
                value={currentStyles[prop.name] || '#ffffff'}
                on:input={(e) => handleInput(e, prop.name)}
              />
              <input 
                type="text"
                class="glass-input"
                value={currentStyles[prop.name] || ''}
                on:input={(e) => handleInput(e, prop.name)}
              />
            </div>
          {:else}
            <input 
              type={prop.type}
              class="glass-input"
              value={currentStyles[prop.name] || ''}
              on:input={(e) => handleInput(e, prop.name)}
              placeholder={prop.unit ? `Value in ${prop.unit}` : ''}
            />
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div class="no-selection">
      <p>No element selected</p>
    </div>
  {/if}
</div>

<style>
  .property-panel {
    width: 250px;
    height: 100%;
    overflow-y: auto;
    padding: 1rem;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
  }

  .panel-header {
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .panel-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #ffffff;
    text-transform: capitalize;
  }

  .id {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .properties {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .property-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .glass-input, .glass-select {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #ffffff;
    padding: 0.5rem;
    border-radius: 4px;
    width: 100%;
  }

  .glass-input:focus, .glass-select:focus {
    outline: none;
    border-color: #64b5f6;
  }

  .glass-select option {
    background-color: #2d2d2d;
    color: #ffffff;
  }

  .color-input {
    display: flex;
    gap: 0.5rem;
  }

  .color-input input[type="color"] {
    width: 40px;
    padding: 0;
    background: none;
    border: none;
  }

  .color-input input[type="text"] {
    flex: 1;
  }

  .no-selection {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: rgba(255, 255, 255, 0.5);
  }

  /* Scrollbar styling */
  .property-panel::-webkit-scrollbar {
    width: 8px;
  }

  .property-panel::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  .property-panel::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  .property-panel::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>
