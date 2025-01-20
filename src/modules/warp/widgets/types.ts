import type { WarpState, WarpComponent, WarpComponentOptions, WarpEventHandler } from '../core/types';

export interface WidgetState extends WarpState {
    visible: boolean;
    enabled: boolean;
    focused: boolean;
    hovered: boolean;
}

export interface WidgetStyles {
    width?: string;
    height?: string;
    margin?: string;
    padding?: string;
    backgroundColor?: string;
    color?: string;
    border?: string;
    borderRadius?: string;
    boxShadow?: string;
    opacity?: string;
    transform?: string;
    transition?: string;
    cursor?: string;
    overflow?: string;
    position?: string;
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    zIndex?: string;
    display?: string;
    flexDirection?: string;
    justifyContent?: string;
    alignItems?: string;
    gap?: string;
    gridTemplateColumns?: string;
    gridTemplateRows?: string;
    [key: string]: string | undefined;
}

export interface ThemeTokens {
    colors: {
        primary: string;
        secondary: string;
        text: string;
        primaryText: string;
        secondaryText: string;
        shadow: string;
        [key: string]: string;
    };
    styles: WidgetStyles;
}

export interface ThemeVariables {
    [key: `--${string}-color`]: string;
    [key: string]: string;
}

export interface WidgetTheme {
    light: ThemeVariables;
    dark: ThemeVariables;
}

// Helper function to create theme variables
export function createThemeVariables(tokens: ThemeTokens): ThemeVariables {
    return {
        '--primary-color': tokens.colors.primary,
        '--secondary-color': tokens.colors.secondary,
        '--text-color': tokens.colors.text,
        '--primary-text': tokens.colors.primaryText,
        '--secondary-text': tokens.colors.secondaryText,
        '--shadow': tokens.colors.shadow,
        ...tokens.styles
    };
}

// Default theme tokens
export const defaultThemeTokens: ThemeTokens = {
    colors: {
        primary: '#64b5f6',
        secondary: '#e0e0e0',
        text: '#424242',
        primaryText: 'white',
        secondaryText: '#424242',
        shadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    styles: {}
};

// Default dark theme tokens
export const defaultDarkThemeTokens: ThemeTokens = {
    colors: {
        primary: '#90caf9',
        secondary: '#424242',
        text: '#e0e0e0',
        primaryText: '#212121',
        secondaryText: '#e0e0e0',
        shadow: '0 2px 4px rgba(0,0,0,0.2)'
    },
    styles: {}
};

// Default widget theme
export const defaultWidgetTheme: WidgetTheme = {
    light: createThemeVariables(defaultThemeTokens),
    dark: createThemeVariables(defaultDarkThemeTokens)
};

export interface WidgetProps {
    id?: string;
    className?: string;
    style?: Partial<WidgetStyles>;
    theme?: Partial<WidgetTheme>;
    visible?: boolean;
    enabled?: boolean;
    tabIndex?: number;
    role?: string;
    ariaLabel?: string;
    testId?: string;
    element?: HTMLElement;
}

export interface BaseWidgetProps extends WidgetProps {
    element?: HTMLElement;
}

export type WidgetEventType = 
    | 'click'
    | 'doubleClick'
    | 'mouseEnter'
    | 'mouseLeave'
    | 'focus'
    | 'blur'
    | 'keyDown'
    | 'keyUp'
    | 'keyPress';

export interface WidgetEventMap {
    click: MouseEvent;
    doubleClick: MouseEvent;
    mouseEnter: MouseEvent;
    mouseLeave: MouseEvent;
    focus: FocusEvent;
    blur: FocusEvent;
    keyDown: KeyboardEvent;
    keyUp: KeyboardEvent;
    keyPress: KeyboardEvent;
}

export type WidgetEventHandler<K extends WidgetEventType> = (event: WidgetEventMap[K]) => void | Promise<void>;

export type WidgetEvents = {
    [K in WidgetEventType as `on${Capitalize<K>}`]?: WidgetEventHandler<K>;
} & Record<string, WarpEventHandler>;

export interface WidgetOptions<
    TState extends WidgetState = WidgetState,
    TProps extends WidgetProps = WidgetProps
> extends WarpComponentOptions {
    state?: TState;
    props?: TProps;
    events?: WidgetEvents;
    styles?: WidgetStyles;
    theme?: WidgetTheme;
}

export interface Widget<
    TState extends WidgetState = WidgetState,
    TProps extends WidgetProps = WidgetProps
> extends WarpComponent {
    state: TState;
    props: TProps;
    events?: WidgetEvents;
    styles: WidgetStyles;
    theme?: WidgetTheme;
}

// Widget-specific types

export interface ContainerWidgetState extends WidgetState {
    layout: 'vertical' | 'horizontal' | 'grid';
    spacing: number;
    padding: number;
    scrollable: boolean;
}

export interface ContainerWidgetProps extends WidgetProps {
    layout?: 'vertical' | 'horizontal' | 'grid';
    spacing?: number;
    padding?: number;
    scrollable?: boolean;
    columns?: number;
    rows?: number;
}

export interface ButtonWidgetState extends WidgetState {
    pressed: boolean;
    loading: boolean;
    icon?: string;
    label: string;
}

export interface ButtonWidgetProps extends WidgetProps {
    label?: string;
    icon?: string;
    variant?: 'primary' | 'secondary' | 'text';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    disabled?: boolean;
}

export interface TextInputWidgetState extends WidgetState {
    value: string;
    placeholder: string;
    valid: boolean;
    error?: string;
}

export interface TextInputWidgetProps extends WidgetProps {
    value?: string;
    placeholder?: string;
    type?: 'text' | 'password' | 'email' | 'number';
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    required?: boolean;
    readOnly?: boolean;
    autoFocus?: boolean;
    autoComplete?: string;
    spellCheck?: boolean;
}

export interface ImageWidgetState extends WidgetState {
    src: string;
    alt: string;
    loaded: boolean;
    error?: string;
}

export interface ImageWidgetProps extends WidgetProps {
    src: string;
    alt: string;
    fit?: 'contain' | 'cover' | 'fill' | 'none';
    lazy?: boolean;
    placeholder?: string;
}

// Widget factory types

export type WidgetFactory<
    TState extends WidgetState = WidgetState,
    TProps extends WidgetProps = WidgetProps
> = (options: WidgetOptions<TState, TProps>) => Widget<TState, TProps>;

export type WidgetRegistry = {
    [key: string]: WidgetFactory;
};
