<script lang="ts">
    import BaseWidget from '../base/BaseWidget.svelte';
    import type { ContainerWidgetState, ContainerWidgetProps } from '../types';
    import type { WarpEvent } from '../../core/types';
    import { createEventDispatcher, onDestroy } from 'svelte';
    import { defaultWidgetTheme } from '../types';

    // Props
    export let id: string;
    export let state: ContainerWidgetState = {
        visible: true,
        enabled: true,
        focused: false,
        hovered: false,
        layout: 'vertical',
        spacing: 8,
        padding: 16,
        scrollable: false
    };
    export let props: ContainerWidgetProps = {
        layout: 'vertical',
        spacing: 8,
        padding: 16,
        scrollable: false
    };

    const dispatch = createEventDispatcher();

    // Theme styles
    const theme = defaultWidgetTheme;

    // Event handlers
    const events = {
        onDragOver: async (event: WarpEvent) => {
            if (state.enabled && event.originalEvent instanceof DragEvent) {
                event.originalEvent.preventDefault();
                event.originalEvent.dataTransfer.dropEffect = 'move';
                state.hovered = true;
                dispatch('dragOver', { event, state });
            }
        },
        onDragLeave: async (event: WarpEvent) => {
            state.hovered = false;
            dispatch('dragLeave', { event, state });
        },
        onDrop: async (event: WarpEvent) => {
            if (state.enabled && event.originalEvent instanceof DragEvent) {
                event.originalEvent.preventDefault();
                state.hovered = false;
                dispatch('drop', { event, state });
            }
        }
    };

    // Computed styles based on props and state
    $: styles = {
        display: 'flex',
        flexDirection: props.layout === 'horizontal' ? 'row' :
                      props.layout === 'grid' ? 'row' : 'column',
        flexWrap: props.layout === 'grid' ? 'wrap' : 'nowrap',
        gap: `${props.spacing || state.spacing}px`,
        padding: `${props.padding || state.padding}px`,
        position: 'relative',
        minHeight: '50px',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        backgroundColor: state.hovered ? 'var(--container-hover-color)' : 'var(--container-color)',
        border: state.hovered ? '2px dashed var(--primary-color)' : 'none',
        borderRadius: '4px',
        transition: 'all 0.2s ease',
        overflow: props.scrollable ? 'auto' : 'visible',
        ...(props.layout === 'grid' && {
            gridTemplateColumns: props.columns ? `repeat(${props.columns}, 1fr)` : 'repeat(auto-fill, minmax(200px, 1fr))',
            gridTemplateRows: props.rows ? `repeat(${props.rows}, 1fr)` : 'auto',
            gridAutoFlow: 'row'
        })
    };

    // Handle resize observer
    let container: HTMLElement;
    let resizeObserver: ResizeObserver;

    $: if (container && props.layout === 'grid') {
        if (!resizeObserver) {
            resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    const { width } = entry.contentRect;
                    dispatch('resize', { width, state });
                }
            });
        }
        resizeObserver.observe(container);
    }

    onDestroy(() => {
        if (resizeObserver) {
            resizeObserver.disconnect();
        }
    });
</script>

<BaseWidget 
    bind:element={container}
    {id} 
    {state} 
    {props} 
    {events} 
    {styles} 
    {theme}
>
    <slot />
</BaseWidget>

<style>
    :global(.container-grid) {
        display: grid !important;
    }

    :global(.container-horizontal) {
        flex-direction: row !important;
    }

    :global(.container-vertical) {
        flex-direction: column !important;
    }

    :global(.container-wrap) {
        flex-wrap: wrap !important;
    }

    :global(.container-scroll) {
        overflow: auto !important;
    }

    :global(.container-no-scroll) {
        overflow: hidden !important;
    }
</style>
