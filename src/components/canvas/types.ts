export interface Position {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
}

export interface StyleProperties {
    [key: string]: string;
}

export interface CanvasItem {
    id: number;
    widget: string;
    value?: string;
    parentId?: number;
    children?: number[];
    style: {
        [selector: string]: StyleProperties;
    };
    isContainer?: boolean;
    dropZone?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export interface Device {
    name: string;
    width: number;
    height: number;
}

export interface StyleChange {
    id: number;
    styles: StyleProperties;
}

export interface ValueChange {
    id: number;
    value: string;
}

export type WidgetType = 'container' | 'label' | 'button' | 'image' | 'videoPlayer' | 'scrollContainer' | 'group';

export interface SelectionBox {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export interface GroupData {
    items: number[];  // IDs of grouped items
    originalPositions: {
        [id: number]: {
            x: number;
            y: number;
        };
    };
}

export interface SelectedItem {
    id: number;
    widget: WidgetType;
    style: {
        [selector: string]: StyleProperties;
    };
    value?: string;
}

export interface CanvasAction {
    type: 'add' | 'remove' | 'update' | 'move' | 'nest' | 'unnest';
    item: CanvasItem;
    position?: { x: number; y: number };
    parentId?: number;
}

// History tracking for undo/redo
export interface HistoryState {
    _lastRemoved?: CanvasItem;
    _lastRemovedTree?: CanvasItem[];
    _lastStyles?: StyleProperties;
    _lastValue?: string;
    _lastSelection?: Set<number>;
    _lastParentId?: number;
    _lastChildren?: number[];
    _lastItems?: CanvasItem[];
}

export interface CanvasState extends HistoryState {
    items: CanvasItem[];
    selectedItems: Set<number>;
    copiedItem: CanvasItem | null;
    showGrid: boolean;
    snapToGrid: boolean;
    gridSize: number;
    zoom: number;
    currentDevice: Device;
    draggedItem?: {
        id: number;
        x: number;
        y: number;
        groupData?: GroupData;
    };
    hoveredContainer?: number;
    selectionBox?: SelectionBox;
    groups: Map<number, GroupData>;
}

export interface ToolbarEvent extends CustomEvent {
    type: 'deviceChange' | 'gridToggle' | 'snapToggle' | 'zoomChange' | 'align' | 'distribute' | 'layer' | 'group' | 'ungroup';
    detail: any;
}

export interface PropertyChangeEvent extends CustomEvent {
    detail: StyleChange | ValueChange;
}

export interface WidgetProperties {
    container: Array<StyleProperty>;
    button: Array<StyleProperty>;
    image: Array<StyleProperty>;
    label: Array<StyleProperty>;
    videoPlayer: Array<StyleProperty>;
    scrollContainer: Array<StyleProperty>;
}

export interface StyleProperty {
    name: string;
    type: 'text' | 'number' | 'color' | 'select';
    options?: string[];
    unit?: string;
    label: string;
}

export interface Command {
    execute(): void;
    undo(): void;
    redo?(): void;
}

export interface CanvasStore {
    subscribe: (callback: (state: CanvasState) => void) => () => void;
    addItem: (item: Omit<CanvasItem, 'id'>) => void;
    removeItem: (id: number) => void;
    updateItem: (id: number, updates: Partial<CanvasItem>) => void;
    selectItem: (id: number, multiSelect?: boolean) => void;
    deselectAll: () => void;
    copySelected: () => void;
    paste: () => void;
    toggleGrid: () => void;
    toggleSnap: () => void;
    setGridSize: (size: number) => void;
    setZoom: (zoom: number) => void;
    setDevice: (device: Device) => void;
    setItems: (items: CanvasItem[]) => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
    nestItem: (itemId: number, containerId: number) => void;
    unnestItem: (itemId: number) => void;
    startDrag: (id: number, x: number, y: number) => void;
    updateDrag: (x: number, y: number) => void;
    endDrag: () => void;
    setHoveredContainer: (id?: number) => void;
    getItemDepth: (id: number) => number;
    getItemPath: (id: number) => number[];
    isDescendantOf: (itemId: number, potentialAncestorId: number) => boolean;
    updateItemStyle: (id: number, styles: StyleProperties) => void;
    startSelection: (x: number, y: number) => void;
    updateSelection: (x: number, y: number) => void;
    endSelection: () => void;
    groupSelected: () => void;
    ungroupSelected: () => void;
    selectAll: () => void;
}
