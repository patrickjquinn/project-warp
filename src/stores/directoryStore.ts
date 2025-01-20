import { writable, derived } from 'svelte/store'
import type { ActiveFile } from './activeFile'

interface DirectoryState {
    mainDir: string;
    fileTree: FileTreeItem[];
    activeDir: string;
    activeFolder: string;
    operations: {
        rename: boolean;
        delete: boolean;
        createFile: boolean;
        createFolder: boolean;
        reload: boolean;
    };
}

export interface FileTreeItem {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: FileTreeItem[];
}

export interface EditorTab {
    editorValue: string;
    ext: string;
    editorLang: {
        name: string;
        json?: boolean;
        highlightFormatting?: boolean;
        fencedCodeBlockHighlighting?: boolean;
        base?: string;
    };
    filePath: string;
    fileName: string;
    tabId: number;
    modified: boolean;
}

function createDirectoryStore() {
    const { subscribe, set, update } = writable<DirectoryState>({
        mainDir: '',
        fileTree: [],
        activeDir: '',
        activeFolder: '',
        operations: {
            rename: false,
            delete: false,
            createFile: false,
            createFolder: false,
            reload: false
        }
    })

    return {
        subscribe,
        setMainDir: (dir: string) => update(state => ({ ...state, mainDir: dir })),
        setFileTree: (tree: FileTreeItem[]) => update(state => ({ ...state, fileTree: tree })),
        setActiveDir: (dir: string) => update(state => ({ ...state, activeDir: dir })),
        setActiveFolder: (folder: string) => update(state => ({ ...state, activeFolder: folder })),
        startOperation: (operation: keyof DirectoryState['operations']) => 
            update(state => ({
                ...state,
                operations: {
                    ...state.operations,
                    [operation]: true
                }
            })),
        endOperation: (operation: keyof DirectoryState['operations']) => 
            update(state => ({
                ...state,
                operations: {
                    ...state.operations,
                    [operation]: false
                }
            })),
        reset: () => set({
            mainDir: '',
            fileTree: [],
            activeDir: '',
            activeFolder: '',
            operations: {
                rename: false,
                delete: false,
                createFile: false,
                createFolder: false,
                reload: false
            }
        })
    }
}

function createTabsStore() {
    const { subscribe, set, update } = writable<EditorTab[]>([]);
    
    const store = {
        subscribe,
        set,
        update,
        addTab: (tab: EditorTab) => update(tabs => {
            const existingTab = tabs.find(t => t.filePath === tab.filePath)
            if (existingTab) {
                return tabs.map(t => t.filePath === tab.filePath ? { ...t, ...tab } : t)
            }
            return [...tabs, tab]
        }),
        removeTab: (tabId: number) => update(tabs => {
            const filtered = tabs.filter(t => t.tabId !== tabId)
            return filtered.map((t, i) => ({ ...t, tabId: i }))
        }),
        updateTab: (tabId: number, updates: Partial<EditorTab>) => update(tabs => 
            tabs.map(tab => tab.tabId === tabId ? { ...tab, ...updates } : tab)
        ),
        setModified: (tabId: number, modified: boolean) => update(tabs =>
            tabs.map(tab => tab.tabId === tabId ? { ...tab, modified } : tab)
        ),
        clear: () => set([])
    };

    return store;
}

export const DirectoryData = createDirectoryStore()
export const openTabs = createTabsStore()

// Derived store for active tab
export const activeTab = derived(openTabs, $tabs => 
    $tabs.find(tab => tab.modified) || $tabs[0]
)

// Derived store for modified files
export const modifiedFiles = derived(openTabs, $tabs => 
    $tabs.filter(tab => tab.modified)
)
