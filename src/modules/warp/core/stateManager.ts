import { writable, derived, type Writable, type Readable } from 'svelte/store';
import type { WarpState, WarpStateManager, WarpStateSelector } from './types';
import { eventBus, createComponentEvent } from './eventBus';

export class StateManager implements WarpStateManager {
    private store: Writable<WarpState>;
    private componentId: string;
    private reducers: Map<string, (state: WarpState, payload: any) => WarpState>;

    constructor(componentId: string, initialState: WarpState = {}) {
        this.componentId = componentId;
        this.store = writable(initialState);
        this.reducers = new Map();

        // Register built-in reducers
        this.registerReducer('setState', (state, payload) => ({
            ...state,
            ...payload
        }));

        this.registerReducer('resetState', () => initialState);
    }

    select<T>(selector: WarpStateSelector<T>): Writable<T> {
        const derivedStore = derived(this.store, selector);
        const { subscribe } = derivedStore;

        return {
            subscribe,
            set: (value: T) => {
                this.dispatch('setState', {
                    [selector.name]: value
                });
            },
            update: (updater: (value: T) => T) => {
                const currentState = selector(this.getState());
                const newValue = updater(currentState);
                this.dispatch('setState', {
                    [selector.name]: newValue
                });
            }
        };
    }

    dispatch(action: string, payload?: any): void {
        const reducer = this.reducers.get(action);
        if (!reducer) {
            console.warn(`No reducer found for action: ${action}`);
            return;
        }

        this.store.update(state => {
            const newState = reducer(state, payload);
            
            // Emit state change event
            eventBus.emit(createComponentEvent(
                this.componentId,
                'stateChange',
                {
                    action,
                    payload,
                    previousState: state,
                    currentState: newState
                },
                { bubbles: true }
            ));

            return newState;
        });
    }

    subscribe(listener: (state: WarpState) => void): () => void {
        return this.store.subscribe(listener);
    }

    // Additional helper methods

    registerReducer(
        action: string,
        reducer: (state: WarpState, payload: any) => WarpState
    ): void {
        if (this.reducers.has(action)) {
            console.warn(`Reducer already registered for action: ${action}`);
            return;
        }
        this.reducers.set(action, reducer);
    }

    unregisterReducer(action: string): void {
        this.reducers.delete(action);
    }

    getState(): WarpState {
        let currentState: WarpState = {};
        const unsubscribe = this.store.subscribe(state => {
            currentState = state;
        });
        unsubscribe();
        return currentState;
    }

    // Create a derived store that only updates when the selected value changes
    createSelector<T>(selector: WarpStateSelector<T>): Readable<T> {
        return derived(this.store, selector);
    }

    // Batch multiple state updates
    batchUpdate(updates: Array<{ action: string; payload?: any }>): void {
        let currentState = this.getState();
        
        updates.forEach(({ action, payload }) => {
            const reducer = this.reducers.get(action);
            if (reducer) {
                currentState = reducer(currentState, payload);
            }
        });

        this.store.set(currentState);

        // Emit batch update event
        eventBus.emit(createComponentEvent(
            this.componentId,
            'batchStateChange',
            {
                updates,
                currentState
            },
            { bubbles: true }
        ));
    }

    // Reset state to initial value
    reset(): void {
        this.dispatch('resetState');
    }

    // Destroy the state manager and clean up subscriptions
    destroy(): void {
        this.reducers.clear();
        eventBus.clearComponent(this.componentId);
    }
}

// Helper function to create a state selector
export function createSelector<T>(name: string, fn: (state: WarpState) => T): WarpStateSelector<T> {
    const selector = (state: WarpState) => fn(state);
    selector.name = name;
    return selector;
}

// Helper to create a computed value from multiple selectors
export function computed<T>(
    selectors: WarpStateSelector[],
    compute: (...values: any[]) => T
): WarpStateSelector<T> {
    const selector = (state: WarpState) => {
        const values = selectors.map(s => s(state));
        return compute(...values);
    };
    selector.name = 'computed';
    return selector;
}

// Create actions with type safety
export function createAction<T = void>(
    type: string,
    prepare?: (payload: T) => any
) {
    const actionCreator = (payload: T) => ({
        type,
        payload: prepare ? prepare(payload) : payload
    });
    actionCreator.type = type;
    return actionCreator;
}
