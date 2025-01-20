import type { ButtonWidgetState, ButtonWidgetProps, WidgetOptions } from '../types';
import { createWidgetFactory, widgetRegistry } from '../factory';
import Button from './Button.svelte';

// Default button state
const defaultState: ButtonWidgetState = {
    visible: true,
    enabled: true,
    focused: false,
    hovered: false,
    pressed: false,
    loading: false,
    label: '',
    icon: undefined
};

// Default button props
const defaultProps: ButtonWidgetProps = {
    variant: 'primary',
    size: 'medium',
    role: 'button',
    tabIndex: 0
};

// Default button styles
const defaultStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontFamily: 'inherit',
    fontWeight: '500',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
};

import { defaultWidgetTheme, createThemeVariables } from '../types';

// Button theme tokens
const buttonThemeTokens = {
    colors: {
        primary: '#64b5f6',
        secondary: '#e0e0e0',
        text: '#424242',
        primaryText: 'white',
        secondaryText: '#424242',
        shadow: '0 2px 4px rgba(0,0,0,0.1)',
        buttonHover: '#42a5f5',
        buttonActive: '#1e88e5',
        buttonDisabled: '#bdbdbd'
    },
    styles: defaultStyles
};

// Create button factory
export const createButton = createWidgetFactory<ButtonWidgetState, ButtonWidgetProps>(
    'button',
    {
        state: defaultState,
        props: defaultProps,
        styles: defaultStyles,
        theme: {
            light: createThemeVariables(buttonThemeTokens),
            dark: createThemeVariables({
                ...buttonThemeTokens,
                colors: {
                    ...buttonThemeTokens.colors,
                    primary: '#90caf9',
                    secondary: '#424242',
                    text: '#e0e0e0',
                    primaryText: '#212121',
                    secondaryText: '#e0e0e0',
                    shadow: '0 2px 4px rgba(0,0,0,0.2)',
                    buttonHover: '#64b5f6',
                    buttonActive: '#42a5f5',
                    buttonDisabled: '#616161'
                }
            })
        }
    }
);

// Helper to create a button with proper typing
export function createButtonWidget(
    options: WidgetOptions<ButtonWidgetState, ButtonWidgetProps> = {}
) {
    const id = options.props?.id || `button-${Math.random().toString(36).substr(2, 9)}`;
    return createButton({
        ...options,
        props: {
            ...defaultProps,
            ...options.props,
            id
        }
    });
}

// Register button component
widgetRegistry.register('button', createButton);

// Export button component
export { Button };

// Export button types
export type { ButtonWidgetState, ButtonWidgetProps };

// Helper functions for common button variants
export function createPrimaryButton(
    label: string,
    options: Partial<WidgetOptions<ButtonWidgetState, ButtonWidgetProps>> = {}
) {
    return createButtonWidget({
        ...options,
        state: {
            ...defaultState,
            label,
            ...options.state
        },
        props: {
            ...defaultProps,
            variant: 'primary',
            ...options.props
        }
    });
}

export function createSecondaryButton(
    label: string,
    options: Partial<WidgetOptions<ButtonWidgetState, ButtonWidgetProps>> = {}
) {
    return createButtonWidget({
        ...options,
        state: {
            ...defaultState,
            label,
            ...options.state
        },
        props: {
            ...defaultProps,
            variant: 'secondary',
            ...options.props
        }
    });
}

export function createTextButton(
    label: string,
    options: Partial<WidgetOptions<ButtonWidgetState, ButtonWidgetProps>> = {}
) {
    return createButtonWidget({
        ...options,
        state: {
            ...defaultState,
            label,
            ...options.state
        },
        props: {
            ...defaultProps,
            variant: 'text',
            ...options.props
        }
    });
}

export function createIconButton(
    icon: string,
    options: Partial<WidgetOptions<ButtonWidgetState, ButtonWidgetProps>> = {}
) {
    return createButtonWidget({
        ...options,
        state: {
            ...defaultState,
            icon,
            ...options.state
        },
        props: {
            ...defaultProps,
            size: 'small',
            ...options.props
        }
    });
}
