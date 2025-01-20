import type { WarpComponentDefinition, WarpRegistry, WarpError } from './types';

class ComponentRegistry implements WarpRegistry {
    private definitions: Map<string, WarpComponentDefinition>;

    constructor() {
        this.definitions = new Map();
    }

    register(definition: WarpComponentDefinition): void {
        if (this.definitions.has(definition.type)) {
            const error: WarpError = {
                name: 'RegistrationError',
                message: `Component type '${definition.type}' is already registered`,
                code: 'DUPLICATE_COMPONENT',
                component: definition.type
            };
            throw error;
        }

        // Validate definition
        this.validateDefinition(definition);

        // Store definition
        this.definitions.set(definition.type, {
            ...definition,
            defaultState: definition.defaultState || {},
            defaultProps: definition.defaultProps || {},
            defaultStyles: definition.defaultStyles || {}
        });
    }

    get(type: string): WarpComponentDefinition | undefined {
        return this.definitions.get(type);
    }

    list(): string[] {
        return Array.from(this.definitions.keys());
    }

    // Additional helper methods

    unregister(type: string): void {
        this.definitions.delete(type);
    }

    clear(): void {
        this.definitions.clear();
    }

    exists(type: string): boolean {
        return this.definitions.has(type);
    }

    getAll(): WarpComponentDefinition[] {
        return Array.from(this.definitions.values());
    }

    private validateDefinition(definition: WarpComponentDefinition): void {
        if (!definition.type) {
            const error: WarpError = {
                name: 'ValidationError',
                message: 'Component definition must have a type',
                code: 'INVALID_DEFINITION'
            };
            throw error;
        }

        if (!definition.render) {
            const error: WarpError = {
                name: 'ValidationError',
                message: `Component '${definition.type}' must have a render function`,
                code: 'INVALID_DEFINITION',
                component: definition.type
            };
            throw error;
        }

        // Validate lifecycle methods are functions if provided
        if (definition.lifecycle) {
            const lifecycleMethods = [
                'beforeMount',
                'afterMount',
                'beforeUpdate',
                'afterUpdate',
                'beforeDestroy',
                'afterDestroy'
            ];

            lifecycleMethods.forEach(method => {
                const lifecycleMethod = definition.lifecycle![method as keyof typeof definition.lifecycle];
                if (lifecycleMethod && typeof lifecycleMethod !== 'function') {
                    const error: WarpError = {
                        name: 'ValidationError',
                        message: `Lifecycle method '${method}' must be a function`,
                        code: 'INVALID_LIFECYCLE',
                        component: definition.type
                    };
                    throw error;
                }
            });
        }

        // Validate defaultState is an object if provided
        if (definition.defaultState !== undefined && 
            (typeof definition.defaultState !== 'object' || definition.defaultState === null)) {
            const error: WarpError = {
                name: 'ValidationError',
                message: `Default state for '${definition.type}' must be an object`,
                code: 'INVALID_DEFAULT_STATE',
                component: definition.type
            };
            throw error;
        }

        // Validate defaultProps is an object if provided
        if (definition.defaultProps !== undefined && 
            (typeof definition.defaultProps !== 'object' || definition.defaultProps === null)) {
            const error: WarpError = {
                name: 'ValidationError',
                message: `Default props for '${definition.type}' must be an object`,
                code: 'INVALID_DEFAULT_PROPS',
                component: definition.type
            };
            throw error;
        }

        // Validate defaultStyles is an object if provided
        if (definition.defaultStyles !== undefined && 
            (typeof definition.defaultStyles !== 'object' || definition.defaultStyles === null)) {
            const error: WarpError = {
                name: 'ValidationError',
                message: `Default styles for '${definition.type}' must be an object`,
                code: 'INVALID_DEFAULT_STYLES',
                component: definition.type
            };
            throw error;
        }
    }
}

// Create singleton instance
export const registry = new ComponentRegistry();

// Helper to create a component definition with proper typing
export function defineComponent(definition: WarpComponentDefinition): WarpComponentDefinition {
    return definition;
}

// Helper to create a component definition with default values
export function createDefinition(
    type: string,
    render: WarpComponentDefinition['render'],
    options: Partial<Omit<WarpComponentDefinition, 'type' | 'render'>> = {}
): WarpComponentDefinition {
    return {
        type,
        render,
        defaultState: {},
        defaultProps: {},
        defaultStyles: {},
        ...options
    };
}
