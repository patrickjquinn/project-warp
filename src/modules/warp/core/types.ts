import type { Writable } from 'svelte/store';

export interface WarpState {
    [key: string]: any;
}

export interface WarpContext {
    id: string;
    state: Writable<WarpState>;
    parent?: WarpContext;
    children: WarpContext[];
}

export interface WarpLifecycle {
    beforeMount?: () => void | Promise<void>;
    afterMount?: () => void | Promise<void>;
    beforeUpdate?: () => void | Promise<void>;
    afterUpdate?: () => void | Promise<void>;
    beforeDestroy?: () => void | Promise<void>;
    afterDestroy?: () => void | Promise<void>;
}

export interface WarpEvent {
    type: string;
    payload?: any;
    source: string;
    target?: string;
    bubbles?: boolean;
    originalEvent?: Event;
}

export interface WarpEventHandler {
    (event: WarpEvent): void | Promise<void>;
}

export interface WarpEventBus {
    emit: (event: WarpEvent) => void;
    on: (type: string, handler: WarpEventHandler) => () => void;
    off: (type: string, handler: WarpEventHandler) => void;
}

export interface WarpComponent {
    id: string;
    type: string;
    state?: WarpState;
    props?: Record<string, any>;
    children?: WarpComponent[];
    events?: Record<string, WarpEventHandler>;
    lifecycle?: WarpLifecycle;
    styles?: Record<string, string>;
}

export interface WarpComponentDefinition {
    type: string;
    defaultState?: WarpState;
    defaultProps?: Record<string, any>;
    defaultStyles?: Record<string, string>;
    lifecycle?: WarpLifecycle;
    render: (context: WarpContext) => void | Promise<void>;
}

export interface WarpRegistry {
    register: (definition: WarpComponentDefinition) => void;
    get: (type: string) => WarpComponentDefinition | undefined;
    list: () => string[];
}

export interface WarpComposition {
    create: (component: WarpComponent) => Promise<WarpContext>;
    mount: (context: WarpContext, target: HTMLElement) => Promise<void>;
    unmount: (context: WarpContext) => Promise<void>;
    update: (context: WarpContext, changes: Partial<WarpComponent>) => Promise<void>;
}

export interface WarpError extends Error {
    code: string;
    component?: string;
    originalError?: Error;
}

export type WarpStateSelector<T = any> = (state: WarpState) => T;

export interface WarpStateManager {
    select: <T>(selector: WarpStateSelector<T>) => Writable<T>;
    dispatch: (action: string, payload?: any) => void;
    subscribe: (listener: (state: WarpState) => void) => () => void;
}

export interface WarpComponentOptions {
    state?: WarpState;
    props?: Record<string, any>;
    events?: Record<string, WarpEventHandler>;
    lifecycle?: WarpLifecycle;
    styles?: Record<string, string>;
    children?: WarpComponent[];
}

export interface WarpFactory {
    createComponent: (type: string, options?: WarpComponentOptions) => WarpComponent;
    createContainer: (options?: WarpComponentOptions) => WarpComponent;
    createComposition: (components: WarpComponent[]) => WarpComponent;
}
