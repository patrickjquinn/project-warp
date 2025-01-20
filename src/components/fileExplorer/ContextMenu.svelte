<script lang="ts">
    import { createEventDispatcher } from 'svelte';

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
                New File
            </button>
            <button on:click={() => handleClick('newFolder')}>
                New Folder
            </button>
            <div class="separator"></div>
        {/if}
        <button on:click={() => handleClick('copy')}>
            Copy
        </button>
        <button on:click={() => handleClick('cut')}>
            Cut
        </button>
        {#if isDirectory}
            <button on:click={() => handleClick('paste')}>
                Paste
            </button>
        {/if}
        <div class="separator"></div>
        <button on:click={() => handleClick('rename')}>
            Rename
        </button>
        <button on:click={() => handleClick('delete')} class="delete">
            Delete
        </button>
    </div>
{/if}

<style>
    .context-menu {
        position: fixed;
        background: #252526;
        border: 1px solid #454545;
        border-radius: 4px;
        padding: 4px 0;
        min-width: 160px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        z-index: 1000;
    }

    button {
        display: block;
        width: 100%;
        padding: 6px 12px;
        text-align: left;
        background: none;
        border: none;
        color: #cccccc;
        font-size: 12px;
        cursor: pointer;
    }

    button:hover {
        background: #094771;
        color: #ffffff;
    }

    .delete:hover {
        background: #5a1d1d;
    }

    .separator {
        height: 1px;
        background-color: #454545;
        margin: 4px 0;
    }
</style>
