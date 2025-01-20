import { writable } from 'svelte/store'

export interface ActiveFile {
    name: string;
    path: string;
    content: string;
    type: 'file' | 'directory';
    language: string;
    modified: boolean;
    lastSaved?: Date;
}

function createActiveFileStore() {
    const { subscribe, set, update } = writable<ActiveFile | null>(null)

    return {
        subscribe,
        set: (file: ActiveFile) => {
            set({
                ...file,
                modified: false,
                lastSaved: new Date()
            })
        },
        update,
        markModified: () => {
            update(file => {
                if (file) {
                    return { ...file, modified: true }
                }
                return file
            })
        },
        markSaved: () => {
            update(file => {
                if (file) {
                    return {
                        ...file,
                        modified: false,
                        lastSaved: new Date()
                    }
                }
                return file
            })
        },
        clear: () => set(null)
    }
}

const activeFile = createActiveFileStore()

export default activeFile
