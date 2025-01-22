<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import { X } from 'lucide-svelte'

	export let items: Array<{
		label: string;
		value: number;
		path?: string;
		modified?: boolean;
	}> = []
	export let add = false
	export let activeTabValue = 1

	const dispatch = createEventDispatcher()

	function tabTapped() {
		dispatch('message', activeTabValue)
	}

	function handleClick(tabValue: number) {
		return () => {
			activeTabValue = tabValue
			tabTapped()
		}
	}

	function handleClose(event: MouseEvent, item: any) {
		event.stopPropagation()
		dispatch('close', item)
	}
</script>

<div class="tabs-container">
	<div class="tabs">
		{#each items as item}
			<div 
				class="tab"
				class:active={activeTabValue === item.value}
				class:modified={item.modified}
			>
				<div 
					class="tab-content"
					on:click={handleClick(item.value)}
				>
					<span class="tab-label">{item.label}</span>
					{#if item.path}
						<button 
							class="close-button"
							on:click={(e) => handleClose(e, item)}
							title="Close"
						>
							<X size={14} />
						</button>
					{/if}
				</div>
			</div>
		{/each}
		{#if add}
			<div class="tab add-tab">
				<div class="tab-content">
					<span class="tab-label">+</span>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.tabs-container {
		height: var(--warp-header-height);
		background-color: var(--warp-bg-panel);
		border-bottom: 1px solid var(--warp-border);
	}

	.tabs {
		height: 100%;
		display: flex;
		position: relative;
	}

	.tab {
		height: 100%;
		display: flex;
		align-items: center;
		background-color: var(--warp-bg-panel);
		border-right: 1px solid var(--warp-border);
		min-width: 120px;
		max-width: 200px;
		position: relative;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.tab:hover {
		background-color: var(--warp-hover);
	}

	.tab.active {
		background-color: var(--warp-bg-main);
		border-top: 1px solid var(--warp-accent);
		margin-top: -1px;
	}

	.tab.modified::after {
		content: "";
		display: block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: var(--warp-text-secondary);
		position: absolute;
		top: 50%;
		right: 28px;
		transform: translateY(-50%);
		transition: background-color 0.2s ease;
	}

	.tab.active.modified::after {
		background-color: var(--warp-accent);
	}

	.tab-content {
		flex: 1;
		display: flex;
		align-items: center;
		padding: 0 var(--warp-space-md);
		min-width: 0;
		height: 100%;
	}

	.tab-label {
		flex: 1;
		font-size: 13px;
		color: var(--warp-text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-right: var(--warp-space-sm);
		transition: color 0.2s ease;
	}

	.tab.active .tab-label {
		color: var(--warp-text-primary);
	}

	.close-button {
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: none;
		padding: 0;
		margin: 0;
		cursor: pointer;
		opacity: 0;
		color: var(--warp-text-secondary);
		border-radius: 3px;
		transition: all 0.2s ease;
	}

	.close-button:hover {
		background-color: var(--warp-hover);
		color: var(--warp-text-primary);
	}

	.close-button :global(svg) {
		transition: color 0.2s ease;
	}

	.tab:hover .close-button,
	.tab.active .close-button {
		opacity: 1;
	}

	.tab.modified .close-button {
		opacity: 0;
	}

	.tab.modified:hover .close-button {
		opacity: 1;
	}

	.add-tab {
		min-width: var(--warp-header-height);
		width: var(--warp-header-height);
	}

	.add-tab .tab-content {
		justify-content: center;
		padding: 0;
	}

	.add-tab .tab-label {
		margin: 0;
		flex: 0;
		font-size: 16px;
		font-weight: 300;
	}
</style>
