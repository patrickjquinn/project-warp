import { writable } from 'svelte/store'

interface LayoutState {
  isTerminalVisible: boolean
  isCanvasVisible: boolean
  isEditorVisible: boolean
}

function createLayoutStore() {
  const { subscribe, update, set } = writable<LayoutState>({
    isTerminalVisible: true,
    isCanvasVisible: true,
    isEditorVisible: true
  })

  return {
    subscribe,
    toggleTerminal: () => update(state => ({ ...state, isTerminalVisible: !state.isTerminalVisible })),
    toggleCanvas: () => update(state => ({ ...state, isCanvasVisible: !state.isCanvasVisible })),
    toggleEditor: () => update(state => ({ ...state, isEditorVisible: !state.isEditorVisible })),
    reset: () => set({
      isTerminalVisible: true,
      isCanvasVisible: true,
      isEditorVisible: true
    })
  }
}

export const layoutStore = createLayoutStore()
