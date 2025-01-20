import { writable, derived } from 'svelte/store';
import type { CanvasState, CanvasItem, Device, Command, StyleProperties, GroupData } from '../types';
import { get } from 'svelte/store';

function createCanvasStore() {
    const initialState: CanvasState = {
        items: [],
        selectedItems: new Set(),
        copiedItem: null,
        showGrid: false,
        snapToGrid: false,
        gridSize: 8,
        zoom: 100,
        currentDevice: { name: 'Desktop', width: 1200, height: 800 },
        groups: new Map(),
        selectionBox: undefined
    };

    const { subscribe, set, update } = writable<CanvasState>(initialState);
    
    let nextId = 1;
    const undoStack: Command[] = [];
    const redoStack: Command[] = [];
    const maxStackSize = 50;

    function executeCommand(command: Command) {
        console.log('Executing command:', command);
        command.execute();
        undoStack.push(command);
        if (undoStack.length > maxStackSize) {
            undoStack.shift();
        }
        redoStack.length = 0;
    }

    function getItemDepth(state: CanvasState, id: number): number {
        const item = state.items.find(i => i.id === id);
        if (!item || !item.parentId) return 0;
        return 1 + getItemDepth(state, item.parentId);
    }

    function getItemPath(state: CanvasState, id: number): number[] {
        const path: number[] = [];
        let currentId = id;
        
        while (currentId) {
            path.unshift(currentId);
            const item = state.items.find(i => i.id === currentId);
            if (!item || !item.parentId) break;
            currentId = item.parentId;
        }
        
        return path;
    }

    function isDescendantOf(state: CanvasState, itemId: number, potentialAncestorId: number): boolean {
        const path = getItemPath(state, itemId);
        return path.includes(potentialAncestorId);
    }

    function updateItemPosition(state: CanvasState, item: CanvasItem, parentId?: number) {
        if (!parentId) return item;

        const parent = state.items.find(i => i.id === parentId);
        if (!parent || !parent.dropZone) return item;

        const styleKey = Object.keys(item.style)[0];
        const currentLeft = parseInt(item.style[styleKey].left || '0');
        const currentTop = parseInt(item.style[styleKey].top || '0');

        return {
            ...item,
            parentId,
            style: {
                [styleKey]: {
                    ...item.style[styleKey],
                    left: `${currentLeft - parent.dropZone.x}px`,
                    top: `${currentTop - parent.dropZone.y}px`,
                    position: 'absolute'
                }
            }
        };
    }

    function createGroup(itemIds: number[]): number {
        const state = get({ subscribe });
        const items = state.items.filter(item => itemIds.includes(item.id));
        
        let minX = Infinity, minY = Infinity;
        const originalPositions: Record<number, { x: number; y: number }> = {};
        
        items.forEach(item => {
            const styleKey = Object.keys(item.style)[0];
            const left = parseInt(item.style[styleKey].left || '0');
            const top = parseInt(item.style[styleKey].top || '0');
            
            minX = Math.min(minX, left);
            minY = Math.min(minY, top);
            originalPositions[item.id] = { x: left, y: top };
        });

        const groupId = nextId++;
        const groupItem: CanvasItem = {
            id: groupId,
            widget: 'group',
            style: {
                '#group': {
                    position: 'absolute',
                    left: `${minX}px`,
                    top: `${minY}px`,
                    border: '1px dashed rgba(100, 181, 246, 0.5)',
                    background: 'rgba(100, 181, 246, 0.1)',
                    pointerEvents: 'none'
                }
            },
            isContainer: true
        };

        update(state => ({
            ...state,
            items: [...state.items, groupItem]
        }));

        return groupId;
    }

    const store = {
        subscribe,
        
        addItem(item: Omit<CanvasItem, 'id'>) {
            const newItemId = nextId++;
            executeCommand({
                execute: () => update(state => ({
                    ...state,
                    items: [...state.items, { ...item, id: newItemId }]
                })),
                undo: () => update(state => ({
                    ...state,
                    items: state.items.filter(i => i.id !== newItemId)
                }))
            });
        },

        removeItem(id: number) {
            executeCommand({
                execute: () => update(state => {
                    const removedItem = state.items.find(item => item.id === id);
                    const newSelectedItems = new Set(state.selectedItems);
                    newSelectedItems.delete(id);

                    const itemsToRemove = new Set([id]);
                    let foundNew = true;
                    while (foundNew) {
                        foundNew = false;
                        state.items.forEach(item => {
                            if (item.parentId && itemsToRemove.has(item.parentId) && !itemsToRemove.has(item.id)) {
                                itemsToRemove.add(item.id);
                                foundNew = true;
                            }
                        });
                    }

                    const removedItems = state.items.filter(item => itemsToRemove.has(item.id));

                    return {
                        ...state,
                        items: state.items.filter(item => !itemsToRemove.has(item.id)),
                        selectedItems: newSelectedItems,
                        _lastRemoved: removedItem,
                        _lastRemovedTree: removedItems
                    };
                }),
                undo: () => update(state => ({
                    ...state,
                    items: [...state.items, ...state._lastRemovedTree || []],
                    selectedItems: new Set([...state.selectedItems, state._lastRemoved?.id || -1])
                }))
            });
        },

        updateItem(id: number, updates: Partial<CanvasItem>) {
            executeCommand({
                execute: () => update(state => ({
                    ...state,
                    items: state.items.map(i => i.id === id ? { ...i, ...updates } : i)
                })),
                undo: () => update(state => ({
                    ...state,
                    items: state.items.map(i => i.id === id ? { ...i } : i)
                }))
            });
        },

        selectItem(id: number, multiSelect = false) {
            executeCommand({
                execute: () => update(state => {
                    const newSelectedItems = new Set(multiSelect ? state.selectedItems : []);
                    newSelectedItems.add(id);
                    return {
                        ...state,
                        selectedItems: newSelectedItems,
                        _lastSelection: new Set(state.selectedItems)
                    };
                }),
                undo: () => update(state => ({
                    ...state,
                    selectedItems: state._lastSelection || new Set()
                }))
            });
        },

        deselectAll() {
            update(state => ({
                ...state,
                selectedItems: new Set()
            }));
        },

        copySelected() {
            update(state => {
                const selectedId = [...state.selectedItems][0];
                const itemToCopy = state.items.find(item => item.id === selectedId);
                if (!itemToCopy) return state;

                const styleKey = Object.keys(itemToCopy.style)[0];
                const currentLeft = parseInt(itemToCopy.style[styleKey].left || '0');
                const currentTop = parseInt(itemToCopy.style[styleKey].top || '0');

                const newItem = {
                    ...itemToCopy,
                    id: nextId++,
                    style: {
                        [styleKey]: {
                            ...itemToCopy.style[styleKey],
                            left: `${currentLeft + 20}px`,
                            top: `${currentTop + 20}px`
                        }
                    }
                };

                return {
                    ...state,
                    items: [...state.items, newItem],
                    selectedItems: new Set([newItem.id])
                };
            });
        },

        paste() {
            this.copySelected();
        },

        toggleGrid() {
            update(state => ({
                ...state,
                showGrid: !state.showGrid
            }));
        },

        toggleSnap() {
            update(state => ({
                ...state,
                snapToGrid: !state.snapToGrid
            }));
        },

        setGridSize(size: number) {
            update(state => ({
                ...state,
                gridSize: size
            }));
        },

        setZoom(zoom: number) {
            update(state => ({
                ...state,
                zoom
            }));
        },

        setDevice(device: Device) {
            update(state => ({
                ...state,
                currentDevice: device
            }));
        },

        setItems(items: CanvasItem[]) {
            console.log('Setting canvas items:', items);
            executeCommand({
                execute: () => {
                    console.log('Executing setItems command');
                    return update(state => {
                        console.log('Current state:', state);
                        const newState = {
                            ...state,
                            items,
                            _lastItems: state.items
                        };
                        console.log('New state:', newState);
                        return newState;
                    });
                },
                undo: () => {
                    console.log('Undoing setItems command');
                    return update(state => ({
                        ...state,
                        items: state._lastItems || []
                    }));
                }
            });
        },

        undo() {
            const command = undoStack.pop();
            if (command) {
                command.undo();
                redoStack.push(command);
            }
        },

        redo() {
            const command = redoStack.pop();
            if (command) {
                if (command.redo) {
                    command.redo();
                } else {
                    command.execute();
                }
                undoStack.push(command);
            }
        },

        canUndo() {
            return undoStack.length > 0;
        },

        canRedo() {
            return redoStack.length > 0;
        },

        nestItem(itemId: number, containerId: number) {
            executeCommand({
                execute: () => update(state => {
                    if (isDescendantOf(state, containerId, itemId)) return state;

                    const item = state.items.find(i => i.id === itemId);
                    const container = state.items.find(i => i.id === containerId);
                    
                    if (!item || !container || !container.isContainer) return state;

                    const updatedItem = updateItemPosition(state, item, containerId);
                    
                    return {
                        ...state,
                        items: state.items.map(i => 
                            i.id === itemId ? updatedItem : i
                        ),
                        _lastParentId: item.parentId
                    };
                }),
                undo: () => update(state => ({
                    ...state,
                    items: state.items.map(i => 
                        i.id === itemId ? updateItemPosition(state, i, state._lastParentId) : i
                    )
                }))
            });
        },

        unnestItem(itemId: number) {
            executeCommand({
                execute: () => update(state => {
                    const item = state.items.find(i => i.id === itemId);
                    if (!item || !item.parentId) return state;

                    const updatedItem = updateItemPosition(state, item);
                    return {
                        ...state,
                        items: state.items.map(i => 
                            i.id === itemId ? { ...updatedItem, parentId: undefined } : i
                        ),
                        _lastParentId: item.parentId
                    };
                }),
                undo: () => update(state => ({
                    ...state,
                    items: state.items.map(i => 
                        i.id === itemId ? { ...i, parentId: state._lastParentId } : i
                    )
                }))
            });
        },

        startDrag(id: number, x: number, y: number) {
            update(state => {
                const group = Array.from(state.groups.entries())
                    .find(([_, data]) => data.items.includes(id));
                
                let groupData: GroupData | undefined;
                if (group) {
                    const [groupId, data] = group;
                    groupData = {
                        items: data.items,
                        originalPositions: {}
                    };
                    
                    data.items.forEach(itemId => {
                        const item = state.items.find(i => i.id === itemId);
                        if (item) {
                            const styleKey = Object.keys(item.style)[0];
                            const left = parseInt(item.style[styleKey].left || '0');
                            const top = parseInt(item.style[styleKey].top || '0');
                            groupData!.originalPositions[itemId] = { x: left, y: top };
                        }
                    });
                }

                return {
                    ...state,
                    draggedItem: { id, x, y, groupData }
                };
            });
        },

        updateDrag(x: number, y: number) {
            update(state => {
                if (!state.draggedItem) return state;
                
                const { id, groupData } = state.draggedItem;
                const deltaX = x - state.draggedItem.x;
                const deltaY = y - state.draggedItem.y;

                let updatedItems = [...state.items];
                if (groupData) {
                    updatedItems = updatedItems.map(item => {
                        if (groupData.items.includes(item.id)) {
                            const styleKey = Object.keys(item.style)[0];
                            const originalPos = groupData.originalPositions[item.id];
                            return {
                                ...item,
                                style: {
                                    [styleKey]: {
                                        ...item.style[styleKey],
                                        left: `${originalPos.x + deltaX}px`,
                                        top: `${originalPos.y + deltaY}px`
                                    }
                                }
                            };
                        }
                        return item;
                    });
                }

                return {
                    ...state,
                    items: updatedItems,
                    draggedItem: { ...state.draggedItem, x, y }
                };
            });
        },

        endDrag() {
            update(state => {
                const { draggedItem, hoveredContainer } = state;
                if (!draggedItem) return state;

                if (hoveredContainer) {
                    this.nestItem(draggedItem.id, hoveredContainer);
                }

                return {
                    ...state,
                    draggedItem: undefined,
                    hoveredContainer: undefined
                };
            });
        },

        setHoveredContainer(id?: number) {
            update(state => ({
                ...state,
                hoveredContainer: id
            }));
        },

        getItemDepth(id: number) {
            const state = get({ subscribe });
            return getItemDepth(state, id);
        },

        getItemPath(id: number) {
            const state = get({ subscribe });
            return getItemPath(state, id);
        },

        isDescendantOf(itemId: number, potentialAncestorId: number) {
            const state = get({ subscribe });
            return isDescendantOf(state, itemId, potentialAncestorId);
        },

        updateItemStyle(id: number, styles: StyleProperties) {
            executeCommand({
                execute: () => update(state => {
                    const item = state.items.find(i => i.id === id);
                    if (!item) return state;
                    const styleKey = Object.keys(item.style)[0];
                    const oldStyles = { ...item.style[styleKey] };
                    return {
                        ...state,
                        items: state.items.map(i => 
                            i.id === id ? {
                                ...i,
                                style: {
                                    [styleKey]: {
                                        ...i.style[styleKey],
                                        ...styles
                                    }
                                }
                            } : i
                        ),
                        _lastStyles: oldStyles
                    };
                }),
                undo: () => update(state => {
                    const item = state.items.find(i => i.id === id);
                    if (!item) return state;
                    const styleKey = Object.keys(item.style)[0];
                    return {
                        ...state,
                        items: state.items.map(i => 
                            i.id === id ? {
                                ...i,
                                style: {
                                    [styleKey]: state._lastStyles || {}
                                }
                            } : i
                        )
                    };
                })
            });
        },

        startSelection(x: number, y: number) {
            update(state => ({
                ...state,
                selectionBox: {
                    startX: x,
                    startY: y,
                    endX: x,
                    endY: y
                }
            }));
        },

        updateSelection(x: number, y: number) {
            update(state => {
                if (!state.selectionBox) return state;
                return {
                    ...state,
                    selectionBox: {
                        ...state.selectionBox,
                        endX: x,
                        endY: y
                    }
                };
            });
        },

        endSelection() {
            update(state => {
                if (!state.selectionBox) return state;

                const { startX, startY, endX, endY } = state.selectionBox;
                const left = Math.min(startX, endX);
                const right = Math.max(startX, endX);
                const top = Math.min(startY, endY);
                const bottom = Math.max(startY, endY);

                const selectedIds = state.items
                    .filter(item => {
                        const styleKey = Object.keys(item.style)[0];
                        const itemLeft = parseInt(item.style[styleKey].left || '0');
                        const itemTop = parseInt(item.style[styleKey].top || '0');
                        const itemRight = itemLeft + parseInt(item.style[styleKey].width || '0');
                        const itemBottom = itemTop + parseInt(item.style[styleKey].height || '0');

                        return itemLeft >= left && itemRight <= right && 
                               itemTop >= top && itemBottom <= bottom;
                    })
                    .map(item => item.id);

                return {
                    ...state,
                    selectionBox: undefined,
                    selectedItems: new Set(selectedIds)
                };
            });
        },

        groupSelected() {
            update(state => {
                const selectedIds = Array.from(state.selectedItems);
                if (selectedIds.length < 2) return state;

                const groupId = createGroup(selectedIds);
                const groupData: GroupData = {
                    items: selectedIds,
                    originalPositions: {}
                };

                selectedIds.forEach(id => {
                    const item = state.items.find(i => i.id === id);
                    if (item) {
                        const styleKey = Object.keys(item.style)[0];
                        const left = parseInt(item.style[styleKey].left || '0');
                        const top = parseInt(item.style[styleKey].top || '0');
                        groupData.originalPositions[id] = { x: left, y: top };
                    }
                });

                const groups = new Map(state.groups);
                groups.set(groupId, groupData);

                return {
                    ...state,
                    groups,
                    selectedItems: new Set([groupId])
                };
            });
        },

        ungroupSelected() {
            update(state => {
                const selectedIds = Array.from(state.selectedItems);
                const groups = new Map(state.groups);
                const newSelectedItems = new Set<number>();

                selectedIds.forEach(id => {
                    const groupData = groups.get(id);
                    if (groupData) {
                        groupData.items.forEach(itemId => newSelectedItems.add(itemId));
                        groups.delete(id);
                    }
                });

                return {
                    ...state,
                    groups,
                    selectedItems: newSelectedItems,
                    items: state.items.filter(item => !selectedIds.includes(item.id))
                };
            });
        },

        selectAll() {
            update(state => ({
                ...state,
                selectedItems: new Set(state.items.map(item => item.id))
            }));
        }
    };

    return store;
}

export const canvasStore = createCanvasStore();

export const selectedItems = derived(canvasStore, $state => 
    $state.items.filter(item => $state.selectedItems.has(item.id))
);

export const activeItem = derived(canvasStore, $state => {
    const selectedIds = [...$state.selectedItems];
    return selectedIds.length === 1 
        ? $state.items.find(item => item.id === selectedIds[0])
        : null;
});

export const canvasSettings = derived(canvasStore, $state => ({
    showGrid: $state.showGrid,
    snapToGrid: $state.snapToGrid,
    gridSize: $state.gridSize,
    zoom: $state.zoom,
    currentDevice: $state.currentDevice
}));
