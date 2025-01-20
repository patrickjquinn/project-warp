<script lang="ts">
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    import type { WidgetState, WidgetProps, WidgetEvents, WidgetStyles, WidgetTheme } from '../types';
    import type { WarpEvent } from '../../core/types';
    import { createWarpComponent } from '../../core';

    interface BaseWidgetProps {
        id: string;
        state: WidgetState;
        props: WidgetProps;
        events: WidgetEvents;
        styles: WidgetStyles;
        theme?: WidgetTheme;
        element?: HTMLElement;
    }

    // Props
    export let id: string;
    export let state: WidgetState = {
        visible: true,
        enabled: true,
        focused: false,
        hovered: false
    };
    export let props: WidgetProps = {};
    export let events: WidgetEvents = {};
    export let styles: WidgetStyles = {};
    export let theme: WidgetTheme | undefined = undefined;
    export let element: HTMLElement | undefined = undefined;

    // Internal state
    let component = createWarpComponent('base', {
        id,
        state,
        props,
        events,
        styles: {
            ...styles,
            ...(theme && theme[document.documentElement.classList.contains('dark') ? 'dark' : 'light'])
        }
    });

    const dispatch = createEventDispatcher();

    // Handle state changes
    $: {
        if (state) {
            component.state.dispatch('setState', state);
        }
    }

    // Handle style changes
    $: {
        if (styles && element) {
            Object.entries(styles).forEach(([key, value]) => {
                if (value !== undefined) {
                    element.style.setProperty(key, value);
                }
            });
        }
    }

    // Handle theme changes
    $: {
        if (theme && element) {
            const themeStyles = theme[document.documentElement.classList.contains('dark') ? 'dark' : 'light'];
            Object.entries(themeStyles).forEach(([key, value]) => {
                if (value !== undefined) {
                    element.style.setProperty(key, value);
                }
            });
        }
    }

    // Handle visibility
    $: if (element) {
        element.style.display = state.visible ? '' : 'none';
    }

    // Handle enabled state
    $: if (element) {
        element.setAttribute('aria-disabled', (!state.enabled).toString());
        if (!state.enabled) {
            element.classList.add('disabled');
        } else {
            element.classList.remove('disabled');
        }
    }

    // Create a WarpEvent from a DOM Event
    function createWarpEvent<T extends Event>(event: T, type: string): WarpEvent & T {
        return {
            ...event,
            type,
            source: id,
            payload: {
                state: component.state.getState()
            },
            bubbles: event.bubbles
        } as WarpEvent & T;
    }

    // Lifecycle
    onMount(() => {
        // Set up event listeners
        if (events && element) {
            Object.entries(events).forEach(([event, handler]) => {
                const eventName = event.toLowerCase().replace(/^on/, '');
                element.addEventListener(eventName, async (e: Event) => {
                    if (!state.enabled) return;
                    
                    try {
                        // Create appropriate event type based on event name
                        let warpEvent;
                        switch (eventName) {
                            case 'click':
                            case 'mouseenter':
                            case 'mouseleave':
                            case 'mousemove':
                            case 'mousedown':
                            case 'mouseup':
                                warpEvent = createWarpEvent(e as MouseEvent, eventName);
                                break;
                            case 'focus':
                            case 'blur':
                                warpEvent = createWarpEvent(e as FocusEvent, eventName);
                                break;
                            case 'keydown':
                            case 'keyup':
                            case 'keypress':
                                warpEvent = createWarpEvent(e as KeyboardEvent, eventName);
                                break;
                            default:
                                warpEvent = createWarpEvent(e, eventName);
                        }

                        await handler(warpEvent);
                        dispatch(eventName, warpEvent);
                    } catch (error) {
                        console.error(`Error in widget event handler (${id}:${eventName}):`, error);
                    }
                });
            });
        }

        // Set initial attributes
        if (element) {
            if (props.role) {
                element.setAttribute('role', props.role);
            }
            if (props.ariaLabel) {
                element.setAttribute('aria-label', props.ariaLabel);
            }
            if (props.testId) {
                element.setAttribute('data-testid', props.testId);
            }
            if (props.tabIndex !== undefined) {
                element.setAttribute('tabindex', props.tabIndex.toString());
            }
        }

        // Emit mounted event
        dispatch('mounted', { component });
    });

    onDestroy(() => {
        // Clean up component
        component.state.destroy();
        dispatch('destroyed', { component });
    });
</script>

<div
    bind:this={element}
    {id}
    class="widget {props.className || ''}"
    class:focused={state.focused}
    class:hovered={state.hovered}
    class:disabled={!state.enabled}
>
    <slot />
</div>

<style>
    .widget {
        position: relative;
        box-sizing: border-box;
        transition: all 0.2s ease;
    }

    .widget.disabled {
        opacity: 0.5;
        pointer-events: none;
        user-select: none;
    }

    .widget.focused {
        outline: 2px solid var(--focus-color, #64b5f6);
        outline-offset: 2px;
    }

    .widget.hovered:not(.disabled) {
        cursor: pointer;
    }
</style>
