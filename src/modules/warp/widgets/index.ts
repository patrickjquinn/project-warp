import type { WidgetState, WidgetProps, ThemeTokens, WidgetTheme, Widget } from './types';
import { createWidgetFactory, widgetRegistry } from './factory';
import {
    Button,
    createButton,
    createButtonWidget,
    createPrimaryButton,
    createSecondaryButton,
    createTextButton,
    createIconButton
} from './button/factory';
import {
    defaultThemeTokens,
    defaultDarkThemeTokens,
    defaultWidgetTheme,
    createThemeVariables
} from './types';

// Export base types and interfaces
export * from './types';

// Export widget factory system
export {
    createWidgetFactory,
    widgetRegistry
} from './factory';

// Export base widget
export { default as BaseWidget } from './base/BaseWidget.svelte';

// Export button widget and factory
export {
    Button,
    createButton,
    createButtonWidget,
    createPrimaryButton,
    createSecondaryButton,
    createTextButton,
    createIconButton
} from './button/factory';

// Helper to register all default widgets
export function registerDefaultWidgets() {
    // Currently only button is implemented
    // Add more widget registrations here as they are implemented
}

// Helper to create themed widgets
export function createThemedWidget<
    TState extends WidgetState = WidgetState,
    TProps extends WidgetProps = WidgetProps
>(
    type: string,
    options: {
        theme?: 'light' | 'dark';
        variant?: string;
        size?: string;
        tokens?: Partial<ThemeTokens>;
        [key: string]: any;
    } = {}
) {
    const { theme = 'light', tokens, ...rest } = options;
    const baseTokens = theme === 'dark' ? defaultDarkThemeTokens : defaultThemeTokens;
    const mergedTokens: ThemeTokens = {
        colors: {
            ...baseTokens.colors,
            ...tokens?.colors
        },
        styles: {
            ...baseTokens.styles,
            ...tokens?.styles
        }
    };

    return createWidgetFactory<TState, TProps>(type, {
        ...rest,
        theme: {
            light: createThemeVariables(defaultThemeTokens),
            dark: createThemeVariables(defaultDarkThemeTokens)
        }
    });
}

// Helper to create a group of related widgets
export function createWidgetGroup(
    widgets: Widget[],
    options: {
        layout?: 'vertical' | 'horizontal' | 'grid';
        spacing?: number;
        styles?: Record<string, string>;
    } = {}
) {
    const { layout = 'vertical', spacing = 8, styles = {} } = options;

    // Create a container widget to hold the group
    const container = createWidgetFactory('group', {
        styles: {
            display: 'flex',
            flexDirection: layout === 'horizontal' ? 'row' : 'column',
            gap: `${spacing}px`,
            ...styles
        }
    })({
        children: widgets
    });

    return container;
}

// Export common widget presets
export const presets = {
    button: {
        primary: (label: string) => createPrimaryButton(label),
        secondary: (label: string) => createSecondaryButton(label),
        text: (label: string) => createTextButton(label),
        icon: (icon: string) => createIconButton(icon)
    }
};

// Export default themes
export const themes = {
    light: createThemeVariables(defaultThemeTokens),
    dark: createThemeVariables(defaultDarkThemeTokens)
};

// Export default theme tokens
export {
    defaultThemeTokens,
    defaultDarkThemeTokens,
    defaultWidgetTheme
};
