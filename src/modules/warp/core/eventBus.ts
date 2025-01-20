import type { WarpEvent, WarpEventHandler, WarpEventBus } from './types';

class EventBus implements WarpEventBus {
    private handlers: Map<string, Set<WarpEventHandler>>;
    private bubbleMap: Map<string, string>; // child -> parent mapping

    constructor() {
        this.handlers = new Map();
        this.bubbleMap = new Map();
    }

    emit(event: WarpEvent): void {
        const { type, bubbles = false } = event;
        
        // Handle direct listeners
        const handlers = this.handlers.get(type);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(event);
                } catch (error) {
                    console.error(`Error in event handler for ${type}:`, error);
                }
            });
        }

        // Handle event bubbling
        if (bubbles && event.source) {
            let currentSource = event.source;
            while (this.bubbleMap.has(currentSource)) {
                currentSource = this.bubbleMap.get(currentSource)!;
                const parentHandlers = this.handlers.get(`${currentSource}:${type}`);
                if (parentHandlers) {
                    parentHandlers.forEach(handler => {
                        try {
                            handler({
                                ...event,
                                target: event.source,
                                source: currentSource
                            });
                        } catch (error) {
                            console.error(`Error in bubbled event handler for ${type}:`, error);
                        }
                    });
                }
            }
        }
    }

    on(type: string, handler: WarpEventHandler): () => void {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }
        this.handlers.get(type)!.add(handler);

        // Return unsubscribe function
        return () => this.off(type, handler);
    }

    off(type: string, handler: WarpEventHandler): void {
        const handlers = this.handlers.get(type);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.handlers.delete(type);
            }
        }
    }

    // Register parent-child relationship for event bubbling
    registerBubbling(childId: string, parentId: string): void {
        this.bubbleMap.set(childId, parentId);
    }

    // Remove parent-child relationship
    unregisterBubbling(childId: string): void {
        this.bubbleMap.delete(childId);
    }

    // Clear all handlers for a specific component
    clearComponent(componentId: string): void {
        // Clear direct handlers
        for (const [type, handlers] of this.handlers.entries()) {
            if (type.startsWith(`${componentId}:`)) {
                this.handlers.delete(type);
            }
        }

        // Clear bubbling relationships
        this.unregisterBubbling(componentId);
    }

    // Clear all event handlers and relationships
    clear(): void {
        this.handlers.clear();
        this.bubbleMap.clear();
    }
}

// Create a singleton instance
export const eventBus = new EventBus();

// Helper functions for component-specific events
export function createComponentEvent(
    componentId: string,
    type: string,
    payload?: any,
    options: { bubbles?: boolean; target?: string } = {}
): WarpEvent {
    return {
        type,
        payload,
        source: componentId,
        target: options.target,
        bubbles: options.bubbles
    };
}

export function createComponentHandler(
    componentId: string,
    type: string,
    handler: (payload: any) => void | Promise<void>
): WarpEventHandler {
    return (event: WarpEvent) => {
        if (event.target === componentId || event.source === componentId) {
            handler(event.payload);
        }
    };
}

// Helper to create namespaced event types
export function createEventType(componentId: string, type: string): string {
    return `${componentId}:${type}`;
}
