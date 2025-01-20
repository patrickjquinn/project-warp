import { createWarpComponent } from '../core';
import type {
    Widget,
    WidgetState,
    WidgetProps,
    WidgetOptions,
    WidgetFactory,
    WidgetRegistry,
    WidgetEvents,
    WidgetEventType,
    WidgetEventHandler
} from './types';

// Default widget state
const defaultState: WidgetState = {
    visible: true,
    enabled: true,
    focused: false,
    hovered: false
};

// Create a widget factory
export function createWidgetFactory<
    TState extends WidgetState = WidgetState,
    TProps extends WidgetProps = WidgetProps
>(
    type: string,
    defaultOptions: Partial<WidgetOptions<TState, TProps>> = {}
): WidgetFactory<TState, TProps> {
    return (options: WidgetOptions<TState, TProps> = {}) => {
        const id = options.props?.id || `${type}-${Math.random().toString(36).substr(2, 9)}`;

        // Create the Warp component first
        const component = createWarpComponent(type, {
            ...defaultOptions,
            ...options,
            id
        });

        // Create default event handlers with component reference
        const defaultEvents: WidgetEvents = {
            onMouseEnter: async () => {
                component.state.dispatch('setState', { hovered: true });
            },
            onMouseLeave: async () => {
                component.state.dispatch('setState', { hovered: false });
            },
            onFocus: async () => {
                component.state.dispatch('setState', { focused: true });
            },
            onBlur: async () => {
                component.state.dispatch('setState', { focused: false });
            }
        };

        // Merge default and provided options
        const mergedOptions: WidgetOptions<TState, TProps> = {
            state: {
                ...defaultState,
                ...defaultOptions.state,
                ...options.state
            } as TState,
            props: {
                ...defaultOptions.props,
                ...options.props,
                id
            } as TProps,
            events: {
                ...defaultEvents,
                ...defaultOptions.events,
                ...options.events
            },
            styles: {
                ...defaultOptions.styles,
                ...options.styles
            },
            theme: {
                ...defaultOptions.theme,
                ...options.theme
            }
        };

        // Create widget-specific event handlers
        const createEventHandler = <K extends WidgetEventType>(
            eventType: K,
            handler?: WidgetEventHandler<K>
        ) => {
            if (!handler) return undefined;

            return async (event: Event) => {
                try {
                    // Call the handler
                    await handler(event as any);

                    // Emit widget event
                    component.emit(eventType, {
                        event,
                        state: component.state.getState()
                    });
                } catch (error) {
                    console.error(`Error in widget event handler (${type}:${eventType}):`, error);
                }
            };
        };

        // Create widget instance
        const widget: Widget<TState, TProps> = {
            ...component.component,
            state: mergedOptions.state as TState,
            props: mergedOptions.props as TProps,
            events: Object.entries(mergedOptions.events || {}).reduce(
                (acc, [key, handler]) => ({
                    ...acc,
                    [key]: createEventHandler(key as WidgetEventType, handler as any)
                }),
                {}
            ),
            styles: mergedOptions.styles || {},
            theme: mergedOptions.theme
        };

        return widget;
    };
}

// Create widget registry
export class WidgetRegistryImpl implements WidgetRegistry {
    private factories: Map<string, WidgetFactory> = new Map();
    [key: string]: WidgetFactory | any;

    register<TState extends WidgetState, TProps extends WidgetProps>(
        type: string,
        factory: WidgetFactory<TState, TProps>
    ): void {
        if (this.factories.has(type)) {
            throw new Error(`Widget type '${type}' is already registered`);
        }
        this.factories.set(type, factory);
        this[type] = factory;
    }

    get(type: string): WidgetFactory | undefined {
        return this.factories.get(type);
    }

    create<TState extends WidgetState, TProps extends WidgetProps>(
        type: string,
        options?: WidgetOptions<TState, TProps>
    ): Widget<TState, TProps> {
        const factory = this.factories.get(type);
        if (!factory) {
            throw new Error(`Widget type '${type}' is not registered`);
        }
        return factory(options) as Widget<TState, TProps>;
    }

    list(): string[] {
        return Array.from(this.factories.keys());
    }

    clear(): void {
        this.factories.clear();
        // Also clear dynamic properties
        Array.from(this.factories.keys()).forEach(key => {
            delete this[key];
        });
    }
}

// Create singleton instance
export const widgetRegistry = new WidgetRegistryImpl();

// Helper to create a widget with proper typing
export function createWidget<
    TState extends WidgetState = WidgetState,
    TProps extends WidgetProps = WidgetProps
>(
    type: string,
    options?: WidgetOptions<TState, TProps>
): Widget<TState, TProps> {
    return widgetRegistry.create(type, options);
}
