import { writable } from 'svelte/store';

export type Theme = 'dark' | 'darker' | 'light' | 'system';
export type Font = 'system' | 'fira' | 'jetbrains' | 'cascadia';
export type WordWrap = 'off' | 'on' | 'wordWrapColumn';
export type Position = 'left' | 'right' | 'bottom';

export interface AppSettings {
  appearance: {
    theme: Theme;
    font: Font;
    fontSize: number;
  };
  editor: {
    tabSize: number;
    insertSpaces: boolean;
    wordWrap: WordWrap;
  };
  layout: {
    sidebarPosition: Position;
    panelPosition: Position;
  };
}

const defaultSettings: AppSettings = {
  appearance: {
    theme: 'dark',
    font: 'system',
    fontSize: 13
  },
  editor: {
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'off'
  },
  layout: {
    sidebarPosition: 'left',
    panelPosition: 'bottom'
  }
};

function createSettingsStore() {
  // Load settings from localStorage if available
  const storedSettings = typeof localStorage !== 'undefined' 
    ? localStorage.getItem('warpcode-settings')
    : null;
  
  const initialSettings = storedSettings 
    ? { ...defaultSettings, ...JSON.parse(storedSettings) }
    : defaultSettings;

  const { subscribe, set, update } = writable<AppSettings>(initialSettings);

  return {
    subscribe,
    
    updateSetting: <T extends keyof AppSettings, K extends keyof AppSettings[T]>(
      section: T,
      key: K,
      value: AppSettings[T][K]
    ) => {
      update(settings => {
        const newSettings = {
          ...settings,
          [section]: {
            ...settings[section],
            [key]: value
          }
        };
        
        // Save to localStorage
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('warpcode-settings', JSON.stringify(newSettings));
        }
        
        return newSettings;
      });
    },
    
    reset: () => {
      set(defaultSettings);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('warpcode-settings', JSON.stringify(defaultSettings));
      }
    }
  };
}

export const settingsStore = createSettingsStore();
