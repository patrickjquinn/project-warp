<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import {
        FilePlus,
        FolderPlus,
        Copy,
        Scissors,
        ClipboardPaste,
        FileEdit,
        Trash2
    } from 'lucide-svelte';

    export let x = 0;
    export let y = 0;
    export let isFile = false;
    export let isDirectory = false;
    export let visible = false;

    type MenuAction = 'newFile' | 'newFolder' | 'rename' | 'delete' | 'copy' | 'paste' | 'cut';
    
    const dispatch = createEventDispatcher<{
        [K in MenuAction]: { action: K };
    }>();

    function handleClick(action: MenuAction) {
        dispatch(action, { action });
        visible = false;
    }

    // Close menu when clicking outside
    function handleClickOutside(event: MouseEvent) {
        if (visible && !event.defaultPrevented) {
            visible = false;
        }
    }
</script>

<svelte:window on:click={handleClickOutside} />

{#if visible}
    <div 
        class="context-menu"
        style="left: {x}px; top: {y}px;"
        on:click|stopPropagation
    >
        {#if isDirectory}
            <button on:click={() => handleClick('newFile')}>
                <FilePlus size={14} />
                <span>New File</span>
            </button>
            <button on:click={() => handleClick('newFolder')}>
                <FolderPlus size={14} />
                <span>New Folder</span>
            </button>
            <div class="separator"></div>
        {/if}
        <button on:click={() => handleClick('copy')}>
            <Copy size={14} />
            <span>Copy</span>
        </button>
        <button on:click={() => handleClick('cut')}>
            <Scissors size={14} />
            <span>Cut</span>
        </button>
        {#if isDirectory}
            <button on:click={() => handleClick('paste')}>
                <ClipboardPaste size={14} />
                <span>Paste</span>
            </button>
        {/if}
        <div class="separator"></div>
        <button on:click={() => handleClick('rename')}>
            <FileEdit size={14} />
            <span>Rename</span>
        </button>
        <button on:click={() => handleClick('delete')} class="delete">
            <Trash2 size={14} />
            <span>Delete</span>
        </button>
    </div>
{/if}

<style>
    .context-menu {
        position: fixed;
        background: var(--warp-bg-panel);
        border: 1px solid var(--warp-border);
        border-radius: 4px;
        padding: var(--warp-space-xs) 0;
        min-width: 160px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        z-index: var(--warp-z-dropdown);
    }

    button {
        display: flex;
        align-items: center;
        gap: var(--warp-space-sm);
        width: 100%;
        padding: var(--warp-space-sm) var(--warp-space-md);
        text-align: left;
        background: none;
        border: none;
        color: var(--warp-text-primary);
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    button :global(svg) {
        color: var(--warp-text-secondary);
        transition: color 0.2s ease;
    }

    button:hover {
        background: var(--warp-hover);
    }

    button:hover :global(svg) {
        color: var(--warp-text-primary);
    }

    .delete {
        color: #ff6b6b;
    }

    .delete:hover {
        background: rgba(255, 107, 107, 0.1);
    }

    .delete:hover :global(svg) {
        color: #ff6b6b;
    }

    .separator {
        height: 1px;
        background-color: var(--warp-border);
        margin: var(--warp-space-xs) 0;
        opacity: 0.5;
    }
</style>
