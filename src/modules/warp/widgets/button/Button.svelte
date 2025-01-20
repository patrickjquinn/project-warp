<script lang="ts">
    import BaseWidget from '../base/BaseWidget.svelte';
    import type { ButtonWidgetState, ButtonWidgetProps } from '../types';
    import { createEventDispatcher } from 'svelte';

    // Props
    export let id: string;
    export let state: ButtonWidgetState = {
        visible: true,
        enabled: true,
        focused: false,
        hovered: false,
        pressed: false,
        loading: false,
        label: '',
        icon: undefined
    };
    export let props: ButtonWidgetProps = {
        variant: 'primary',
        size: 'medium'
    };

    const dispatch = createEventDispatcher();

    import { defaultWidgetTheme } from '../types';

    // Theme styles
    const theme = defaultWidgetTheme;

    // Event handlers
    const events = {
        onMouseDown: async () => {
            state.pressed = true;
            dispatch('pressStart', { state });
        },
        onMouseUp: async () => {
            state.pressed = false;
            dispatch('pressEnd', { state });
        },
        onMouseLeave: async () => {
            if (state.pressed) {
                state.pressed = false;
                dispatch('pressEnd', { state });
            }
        },
        onClick: async () => {
            if (!state.loading && state.enabled) {
                dispatch('click', { state });
            }
        },
        onMouseEnter: async () => {
            if (state.enabled && !state.loading) {
                state.hovered = true;
            }
        }
    };

    // Computed styles based on variant, size, and state
    $: styles = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontFamily: 'inherit',
        fontWeight: '500',
        border: 'none',
        borderRadius: '4px',
        transition: 'all 0.2s ease',
        padding: props.size === 'small' ? '0.5rem 1rem' : 
                props.size === 'large' ? '1rem 2rem' : 
                '0.75rem 1.5rem',
        fontSize: props.size === 'small' ? '0.875rem' : 
                 props.size === 'large' ? '1.125rem' : 
                 '1rem',
        backgroundColor: props.variant === 'primary' ? 
                        state.pressed ? 'var(--button-active-color)' :
                        state.hovered ? 'var(--button-hover-color)' :
                        state.enabled ? 'var(--primary-color)' :
                        'var(--button-disabled-color)' :
                        props.variant === 'secondary' ? 
                        'var(--secondary-color)' :
                        'transparent',
        color: props.variant === 'primary' ? 'var(--primary-text)' :
               props.variant === 'secondary' ? 'var(--secondary-text)' :
               'var(--text-color)',
        boxShadow: props.variant === 'text' ? 'none' :
                  state.pressed ? 'var(--shadow-pressed)' :
                  'var(--shadow)',
        opacity: state.enabled ? '1' : '0.6',
        transform: state.pressed ? 'scale(0.98)' : 'scale(1)',
        cursor: state.loading ? 'wait' :
                !state.enabled ? 'not-allowed' :
                'pointer',
        pointerEvents: state.enabled ? 'auto' : 'none'
    };
</script>

<BaseWidget {id} {state} {props} {events} {styles} {theme}>
    {#if state.loading}
        <span class="spinner" />
    {/if}
    {#if state.icon}
        <span class="icon">
            {state.icon}
        </span>
    {/if}
    <span class="label">
        {state.label || props.label || ''}
    </span>
</BaseWidget>

<style>
    .spinner {
        width: 1em;
        height: 1em;
        border: 2px solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        animation: spin 0.75s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
