import { writable } from 'svelte/store';
import type { 
    WarpComponent,
    WarpContext,
    WarpComposition,
    WarpComponentDefinition,
    WarpState,
    WarpError,
    WarpComponentOptions
} from './types';
import { StateManager } from './stateManager';
import { eventBus, createComponentEvent } from './eventBus';

export class Composition implements WarpComposition {
    private registry: Map<string, WarpComponentDefinition>;
    private contexts: Map<string, WarpContext>;
    private mountPoints: Map<string, HTMLElement>;

    constructor() {
        this.registry = new Map();
        this.contexts = new Map();
        this.mountPoints = new Map();
    }

    async create(component: WarpComponent): Promise<WarpContext> {
        try {
            // Create component context
            const context: WarpContext = {
                id: component.id,
                state: writable(component.state || {}),
                children: [],
            };

            // Initialize state manager
            const stateManager = new StateManager(component.id, component.state);

            // Register lifecycle hooks if provided
            if (component.lifecycle) {
                const { beforeMount, afterMount, beforeUpdate, afterUpdate, beforeDestroy, afterDestroy } = component.lifecycle;

                if (beforeMount) {
                    eventBus.on(`${component.id}:beforeMount`, async () => {
                        await beforeMount();
                    });
                }

                if (afterMount) {
                    eventBus.on(`${component.id}:afterMount`, async () => {
                        await afterMount();
                    });
                }

                if (beforeUpdate) {
                    eventBus.on(`${component.id}:beforeUpdate`, async () => {
                        await beforeUpdate();
                    });
                }

                if (afterUpdate) {
                    eventBus.on(`${component.id}:afterUpdate`, async () => {
                        await afterUpdate();
                    });
                }

                if (beforeDestroy) {
                    eventBus.on(`${component.id}:beforeDestroy`, async () => {
                        await beforeDestroy();
                    });
                }

                if (afterDestroy) {
                    eventBus.on(`${component.id}:afterDestroy`, async () => {
                        await afterDestroy();
                    });
                }
            }

            // Register event handlers if provided
            if (component.events) {
                Object.entries(component.events).forEach(([event, handler]) => {
                    eventBus.on(`${component.id}:${event}`, handler);
                });
            }

            // Create child contexts
            if (component.children) {
                for (const child of component.children) {
                    const childContext = await this.create(child);
                    childContext.parent = context;
                    context.children.push(childContext);
                    eventBus.registerBubbling(child.id, component.id);
                }
            }

            // Store context
            this.contexts.set(component.id, context);

            return context;
        } catch (error) {
            const warpError: WarpError = {
                name: 'CompositionError',
                message: `Failed to create component context: ${error.message}`,
                code: 'COMPOSITION_CREATE_ERROR',
                component: component.id,
                originalError: error
            };
            throw warpError;
        }
    }

    async mount(context: WarpContext, target: HTMLElement): Promise<void> {
        try {
            // Emit beforeMount event
            await this.emitLifecycleEvent(context.id, 'beforeMount');

            // Get component definition
            const component = this.contexts.get(context.id);
            if (!component) {
                throw new Error(`Component not found: ${context.id}`);
            }

            // Store mount point
            this.mountPoints.set(context.id, target);

            // Mount children recursively
            for (const child of context.children) {
                const childTarget = document.createElement('div');
                target.appendChild(childTarget);
                await this.mount(child, childTarget);
            }

            // Emit afterMount event
            await this.emitLifecycleEvent(context.id, 'afterMount');
        } catch (error) {
            const warpError: WarpError = {
                name: 'MountError',
                message: `Failed to mount component: ${error.message}`,
                code: 'MOUNT_ERROR',
                component: context.id,
                originalError: error
            };
            throw warpError;
        }
    }

    async unmount(context: WarpContext): Promise<void> {
        try {
            // Emit beforeDestroy event
            await this.emitLifecycleEvent(context.id, 'beforeDestroy');

            // Unmount children recursively
            for (const child of context.children) {
                await this.unmount(child);
            }

            // Clean up event handlers
            eventBus.clearComponent(context.id);

            // Remove from DOM
            const mountPoint = this.mountPoints.get(context.id);
            if (mountPoint && mountPoint.parentNode) {
                mountPoint.parentNode.removeChild(mountPoint);
            }

            // Clean up context
            this.contexts.delete(context.id);
            this.mountPoints.delete(context.id);

            // Emit afterDestroy event
            await this.emitLifecycleEvent(context.id, 'afterDestroy');
        } catch (error) {
            const warpError: WarpError = {
                name: 'UnmountError',
                message: `Failed to unmount component: ${error.message}`,
                code: 'UNMOUNT_ERROR',
                component: context.id,
                originalError: error
            };
            throw warpError;
        }
    }

    async update(context: WarpContext, changes: Partial<WarpComponent>): Promise<void> {
        try {
            // Emit beforeUpdate event
            await this.emitLifecycleEvent(context.id, 'beforeUpdate');

            // Update state if provided
            if (changes.state) {
                context.state.update((state: WarpState) => ({
                    ...state,
                    ...changes.state
                }));
            }

            // Update children if provided
            if (changes.children) {
                // Remove old children
                for (const child of context.children) {
                    await this.unmount(child);
                }

                // Create new children
                context.children = [];
                for (const childComponent of changes.children) {
                    const childContext = await this.create(childComponent);
                    childContext.parent = context;
                    context.children.push(childContext);

                    // Mount new child if parent is mounted
                    const parentMount = this.mountPoints.get(context.id);
                    if (parentMount) {
                        const childTarget = document.createElement('div');
                        parentMount.appendChild(childTarget);
                        await this.mount(childContext, childTarget);
                    }
                }
            }

            // Emit afterUpdate event
            await this.emitLifecycleEvent(context.id, 'afterUpdate');
        } catch (error) {
            const warpError: WarpError = {
                name: 'UpdateError',
                message: `Failed to update component: ${error.message}`,
                code: 'UPDATE_ERROR',
                component: context.id,
                originalError: error
            };
            throw warpError;
        }
    }

    private async emitLifecycleEvent(componentId: string, event: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                eventBus.emit(createComponentEvent(
                    componentId,
                    event,
                    undefined,
                    { bubbles: true }
                ));
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }
}

// Create a singleton instance
export const composition = new Composition();

// Helper to create a component with proper typing
export function createComponent<T extends WarpState = WarpState>(
    type: string,
    id: string,
    options: WarpComponentOptions = {}
): WarpComponent {
    return {
        type,
        id,
        state: options.state,
        props: options.props,
        events: options.events,
        lifecycle: options.lifecycle,
        styles: options.styles,
        children: options.children
    };
}
