// Re-export all types
export * from './types';

// Import and re-export core functionality
import { eventBus, createComponentEvent, createComponentHandler, createEventType } from './eventBus';
import { StateManager, createSelector, computed, createAction } from './stateManager';
import { composition, createComponent } from './composition';
import { registry, defineComponent, createDefinition } from './registry';

export {
    // Event system
    eventBus,
    createComponentEvent,
    createComponentHandler,
    createEventType,
    
    // State management
    StateManager,
    createSelector,
    computed,
    createAction,
    
    // Component composition
    composition,
    createComponent,
    
    // Component registry
    registry,
    defineComponent,
    createDefinition
};

// Export factory function to create a new component with all features
export function createWarpComponent<T = any>(
    type: string,
    options: {
        id?: string;
        state?: T;
        props?: Record<string, any>;
        events?: Record<string, (event: any) => void>;
        lifecycle?: {
            beforeMount?: () => void | Promise<void>;
            afterMount?: () => void | Promise<void>;
            beforeUpdate?: () => void | Promise<void>;
            afterUpdate?: () => void | Promise<void>;
            beforeDestroy?: () => void | Promise<void>;
            afterDestroy?: () => void | Promise<void>;
        };
        styles?: Record<string, string>;
        children?: any[];
    } = {}
) {
    const id = options.id || `${type}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create state manager for this component
    const stateManager = new StateManager(id, options.state || {});

    // Create event handlers with proper typing
    const events = options.events ? 
        Object.entries(options.events).reduce((acc, [event, handler]) => ({
            ...acc,
            [event]: createComponentHandler(id, event, handler)
        }), {}) : 
        undefined;

    // Create the component
    const component = createComponent(type, id, {
        ...options,
        events
    });

    // Register component definition if not already registered
    if (!registry.exists(type)) {
        registry.register({
            type,
            defaultState: options.state,
            defaultProps: options.props,
            defaultStyles: options.styles,
            lifecycle: options.lifecycle,
            render: async (context) => {
                // Default render implementation
                // Components can override this by registering their own definition
                const element = document.createElement('div');
                element.id = context.id;
                element.className = type;
                
                // Get the mount point from the composition system
                const mountPoint = document.getElementById(context.id);
                if (mountPoint && mountPoint.parentElement) {
                    mountPoint.parentElement.replaceChild(element, mountPoint);
                }
            }
        });
    }

    return {
        component,
        state: stateManager,
        emit: (eventType: string, payload?: any) => {
            eventBus.emit(createComponentEvent(id, eventType, payload));
        },
        on: (eventType: string, handler: (payload: any) => void) => {
            return eventBus.on(createEventType(id, eventType), 
                createComponentHandler(id, eventType, handler)
            );
        }
    };
}

// Export helper to create a component group
export function createComponentGroup(
    components: ReturnType<typeof createWarpComponent>[],
    options: {
        id?: string;
        layout?: 'vertical' | 'horizontal' | 'grid';
        spacing?: number;
        styles?: Record<string, string>;
    } = {}
) {
    const groupId = options.id || `group-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create the group component
    const group = createWarpComponent('group', {
        id: groupId,
        styles: {
            display: 'flex',
            flexDirection: options.layout === 'horizontal' ? 'row' : 'column',
            gap: `${options.spacing || 8}px`,
            ...options.styles
        },
        children: components.map(c => c.component)
    });

    // Set up event bubbling for all child components
    components.forEach(child => {
        eventBus.registerBubbling(child.component.id, groupId);
    });

    return {
        ...group,
        components,
        addComponent: (component: ReturnType<typeof createWarpComponent>) => {
            components.push(component);
            eventBus.registerBubbling(component.component.id, groupId);
            group.component.children = components.map(c => c.component);
        },
        removeComponent: (componentId: string) => {
            const index = components.findIndex(c => c.component.id === componentId);
            if (index !== -1) {
                eventBus.unregisterBubbling(componentId);
                components.splice(index, 1);
                group.component.children = components.map(c => c.component);
            }
        }
    };
}
