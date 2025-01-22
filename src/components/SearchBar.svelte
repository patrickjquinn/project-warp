<script lang="ts">
  import { Search } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let placeholder = 'Search';

  let searchQuery = '';
  let focused = false;

  function handleSearch(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      dispatch('search', searchQuery);
    }
  }

  function handleFocus() {
    focused = true;
  }

  function handleBlur() {
    focused = false;
  }
</script>

<div class="search-container" class:focused>
  <div class="search-icon">
    <Search size={16} />
  </div>
  <input
    type="text"
    bind:value={searchQuery}
    placeholder="{placeholder}"
    on:keydown={handleSearch}
    on:focus={handleFocus}
    on:blur={handleBlur}
  />
</div>

<style>
  .search-container {
    display: flex;
    align-items: center;
    background-color: var(--warp-bg-main);
    border: 1px solid var(--warp-border);
    border-radius: 4px;
    height: 24px;
    width: 400px;
    margin: 0 auto;
    transition: all var(--warp-transition-normal);
  }

  .search-container:hover {
    border-color: var(--warp-border-light);
  }

  .search-container.focused {
    border-color: var(--warp-accent);
    background-color: var(--warp-bg-editor);
  }

  .search-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    color: var(--warp-text-secondary);
    transition: color var(--warp-transition-normal);
  }

  .focused .search-icon {
    color: var(--warp-accent);
  }

  input {
    flex: 1;
    background: none;
    border: none;
    color: var(--warp-text-primary);
    font-size: 13px;
    padding: 0;
    margin-right: var(--warp-space-sm);
    min-width: 0;
  }

  input::placeholder {
    color: var(--warp-text-secondary);
  }

  input:focus {
    outline: none;
  }
</style>
