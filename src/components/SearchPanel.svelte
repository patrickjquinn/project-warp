<script lang="ts">
  import { searchStore } from '../stores/searchStore';
  import { Search, Loader, AlertCircle, FileText } from 'lucide-svelte';
  import SearchBar from './SearchBar.svelte';
  import { fade } from 'svelte/transition';

  export let projectPath: string;

  let selectedResult: number | null = null;

  function handleSearch(event: CustomEvent<string>) {
    const query = event.detail;
    if (query.trim()) {
      searchStore.search(projectPath, query);
    } else {
      searchStore.clear();
    }
  }

  function handleResultClick(path: string, line: number) {
    // TODO: Open file at specific line
    window.dispatchEvent(new CustomEvent('openFile', {
      detail: { path, line }
    }));
  }

  function highlightMatch(content: string, matches: { start: number; end: number }[]) {
    let result = '';
    let lastIndex = 0;

    matches.forEach(match => {
      result += content.slice(lastIndex, match.start);
      result += `<span class="match">${content.slice(match.start, match.end)}</span>`;
      lastIndex = match.end;
    });

    result += content.slice(lastIndex);
    return result;
  }
</script>

<div class="search-panel">
  <div class="search-header">
    <SearchBar on:search={handleSearch} />
  </div>

  <div class="search-results">
    {#if $searchStore.isSearching}
      <div class="search-message" transition:fade>
        <Loader size={16} class="spin" />
        <span>Searching...</span>
      </div>
    {:else if $searchStore.error}
      <div class="search-message error" transition:fade>
        <AlertCircle size={16} />
        <span>{$searchStore.error}</span>
      </div>
    {:else if $searchStore.results.length === 0 && $searchStore.query}
      <div class="search-message" transition:fade>
        <Search size={16} />
        <span>No results found</span>
      </div>
    {:else if $searchStore.results.length > 0}
      <div class="results-list" transition:fade>
        {#each $searchStore.results as result, i}
          <div
            class="result-item"
            class:selected={selectedResult === i}
            on:click={() => handleResultClick(result.path, result.line)}
          >
            <div class="result-header">
              <FileText size={14} />
              <span class="result-path">{result.path}</span>
              <span class="result-line">:{result.line}</span>
            </div>
            <div class="result-content">
              {@html highlightMatch(result.content, result.matches)}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .search-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--warp-bg-panel);
  }

  .search-header {
    padding: var(--warp-space-md);
    border-bottom: 1px solid var(--warp-border);
  }

  .search-results {
    flex: 1;
    overflow-y: auto;
    padding: var(--warp-space-md);
  }

  .search-message {
    display: flex;
    align-items: center;
    gap: var(--warp-space-sm);
    color: var(--warp-text-secondary);
    padding: var(--warp-space-md);
  }

  .search-message.error {
    color: #ff6b6b;
  }

  .results-list {
    display: flex;
    flex-direction: column;
    gap: var(--warp-space-md);
  }

  .result-item {
    padding: var(--warp-space-md);
    border-radius: 4px;
    background-color: var(--warp-bg-main);
    border: 1px solid var(--warp-border);
    cursor: pointer;
    transition: all var(--warp-transition-normal);
  }

  .result-item:hover {
    background-color: var(--warp-hover);
    border-color: var(--warp-border-light);
  }

  .result-item.selected {
    background-color: var(--warp-accent-transparent);
    border-color: var(--warp-accent);
  }

  .result-header {
    display: flex;
    align-items: center;
    gap: var(--warp-space-sm);
    color: var(--warp-text-secondary);
    margin-bottom: var(--warp-space-sm);
  }

  .result-path {
    color: var(--warp-accent);
  }

  .result-line {
    color: var(--warp-text-secondary);
  }

  .result-content {
    font-family: var(--warp-font-mono);
    font-size: 12px;
    color: var(--warp-text-primary);
    white-space: pre-wrap;
    word-break: break-all;
  }

  .match {
    background-color: var(--warp-accent-transparent);
    color: var(--warp-accent);
    border-radius: 2px;
    padding: 0 2px;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
