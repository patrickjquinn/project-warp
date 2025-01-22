import { writable } from 'svelte/store';

export type PanelType = 'explorer' | 'search' | 'sourceControl' | 'debug' | 'extensions' | 'settings';

interface PanelState {
  activePanel: PanelType | null;
  isVisible: boolean;
}

function createPanelStore() {
  const { subscribe, set, update } = writable<PanelState>({
    activePanel: 'explorer',
    isVisible: true
  });

  return {
    subscribe,
    
    togglePanel: (panel: PanelType) => {
      update(state => {
        if (state.activePanel === panel) {
          return {
            ...state,
            isVisible: !state.isVisible
          };
        }
        return {
          activePanel: panel,
          isVisible: true
        };
      });
    },
    
    hidePanel: () => {
      update(state => ({ ...state, isVisible: false }));
    },
    
    showPanel: (panel: PanelType) => {
      set({
        activePanel: panel,
        isVisible: true
      });
    }
  };
}

export const panelStore = createPanelStore();
