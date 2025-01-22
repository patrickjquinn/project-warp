import { writable } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';

interface SearchResult {
  path: string;
  line: number;
  content: string;
  matches: { start: number; end: number }[];
}

interface SearchState {
  query: string;
  isSearching: boolean;
  results: SearchResult[];
  error: string | null;
}

function createSearchStore() {
  const { subscribe, set, update } = writable<SearchState>({
    query: '',
    isSearching: false,
    results: [],
    error: null
  });

  return {
    subscribe,
    setQuery: (query: string) => update(state => ({ ...state, query })),
    
    search: async (projectPath: string, query: string) => {
      update(state => ({ ...state, isSearching: true, error: null }));
      
      try {
        // Use ripgrep through Tauri command for fast searching
        const results = await invoke<SearchResult[]>('search_in_files', {
          path: projectPath,
          query
        });
        
        update(state => ({
          ...state,
          results,
          isSearching: false
        }));
      } catch (error) {
        update(state => ({
          ...state,
          results: [],
          isSearching: false,
          error: error instanceof Error ? error.message : 'Search failed'
        }));
      }
    },
    
    clear: () => {
      set({
        query: '',
        isSearching: false,
        results: [],
        error: null
      });
    }
  };
}

export const searchStore = createSearchStore();
