<script lang="ts">
	import File from './File.svelte'
	import { slide } from 'svelte/transition'
	import { createEventDispatcher } from 'svelte'
	import activeDirectory from '../../stores/activeDirectory'
	import { invoke } from '@tauri-apps/api/core'
	import ContextMenu from './ContextMenu.svelte'
	import type { FileNode, FileSelectedEvent } from './types'
	import { ChevronRight, File as FileIcon, Folder as FolderIcon, FolderOpen } from 'lucide-svelte'

	type MenuAction = 'newFile' | 'newFolder' | 'rename' | 'delete' | 'copy' | 'paste' | 'cut';

	export let expanded = false
	export let root = false
	export let name: string
	export let children: FileNode[] = []
	export let path: string

	const dispatch = createEventDispatcher<{
		fileSelected: FileSelectedEvent
	}>()

	let contextMenu: { x: number; y: number; visible: boolean } = {
		x: 0,
		y: 0,
		visible: false
	}

	let isEditing = false
	let editValue = name
	let inputElement: HTMLInputElement
	let newFileEditing = false
	let newFileValue = ''
	let newFileInputElement: HTMLInputElement
	let newItemIsFolder = false

	async function handleContextMenu(event: MouseEvent) {
		event.preventDefault()
		contextMenu = {
			x: event.clientX,
			y: event.clientY,
			visible: true
		}
	}

	async function handleKeyboardContextMenu(event: KeyboardEvent) {
		event.preventDefault()
		const target = event.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		contextMenu = {
			x: rect.left,
			y: rect.bottom,
			visible: true
		}
	}

	async function handleMenuAction(event: CustomEvent<{ action: MenuAction }>) {
		const { action } = event.detail
		try {
			switch (action) {
				case 'newFile':
					startNewFile()
					break
				case 'newFolder':
					startNewFolder()
					break
				case 'rename':
					startEditing()
					break
				case 'delete':
					if (confirm(`Are you sure you want to delete ${name} and all its contents?`)) {
						await invoke('delete_path', { path })
						await refreshFolder()
					}
					break
				case 'copy':
					await invoke('copy_path', { path, cut: false })
					break
				case 'cut':
					await invoke('copy_path', { path, cut: true })
					break
				case 'paste':
					await invoke('paste_path', { destination: path })
					await refreshFolder()
					break
			}
			contextMenu.visible = false
		} catch (error) {
			console.error(`Failed to ${action}:`, error)
			alert(`Failed to ${action}: ${error}`)
		}
	}

	async function refreshFolder() {
		try {
			await invoke('watch_path', { path })
		} catch (error) {
			console.error('Failed to refresh folder:', error)
		}
	}

	async function folderSelected() {
		if (!root) {
			toggle()
			activeDirectory.set(path)
			
			try {
				await invoke('watch_path', { path })
			} catch (error) {
				console.error('Failed to watch directory:', error)
			}
		}
	}

	function toggle() {
		expanded = !expanded
	}

	function handleFileSelected(event: CustomEvent<FileSelectedEvent>) {
		console.log('Folder received fileSelected event:', event.detail);
		console.log('Folder forwarding event to Explorer');
		dispatch('fileSelected', event.detail);
		
		console.log('Folder dispatching editorFileSelected event');
		window.dispatchEvent(new CustomEvent('editorFileSelected', {
			detail: event.detail,
			bubbles: true,
			composed: true
		}));
	}

	function isDirectory(node: FileNode): boolean {
		return node.type === 'directory' || node.is_dir || !!node.children
	}

	function startEditing() {
		isEditing = true
		editValue = name
		setTimeout(() => {
			inputElement?.focus()
			inputElement?.select()
		}, 0)
	}

	async function handleRename() {
		if (editValue && editValue !== name) {
			try {
				const parentPath = path.substring(0, path.lastIndexOf('/'))
				const newPath = `${parentPath}/${editValue}`
				await invoke('rename_path', { from: path, to: newPath })
				await refreshFolder()
			} catch (error) {
				console.error('Failed to rename:', error)
				alert(`Failed to rename: ${error}`)
				editValue = name
			}
		} else {
			editValue = name
		}
		isEditing = false
	}

	function startNewFile() {
		expanded = true
		newFileEditing = true
		newFileValue = ''
		newItemIsFolder = false
		setTimeout(() => {
			newFileInputElement?.focus()
		}, 0)
	}

	function startNewFolder() {
		expanded = true
		newFileEditing = true
		newFileValue = ''
		newItemIsFolder = true
		setTimeout(() => {
			newFileInputElement?.focus()
		}, 0)
	}

	async function handleNewItem(isFolder: boolean) {
		if (newFileValue) {
			try {
				const newPath = `${path}/${newFileValue}`
				if (isFolder) {
					await invoke('create_directory', { path: newPath })
				} else {
					await invoke('create_file', { path: newPath })
				}
				await refreshFolder()
			} catch (error) {
				console.error(`Failed to create ${isFolder ? 'folder' : 'file'}:`, error)
				alert(`Failed to create ${isFolder ? 'folder' : 'file'}: ${error}`)
			}
		}
		newFileEditing = false
		newFileValue = ''
	}

	function handleKeyDown(event: KeyboardEvent, isNewItem = false, isFolder = false) {
		if (event.key === 'Enter') {
			event.preventDefault()
			if (isNewItem) {
				handleNewItem(isFolder)
			} else {
				handleRename()
			}
		} else if (event.key === 'Escape') {
			event.preventDefault()
			if (isNewItem) {
				newFileEditing = false
				newFileValue = ''
			} else {
				editValue = name
				isEditing = false
			}
		}
	}
</script>

<div 
	class="folder-item"
	class:root
	role="treeitem"
	aria-expanded={expanded}
	tabindex="0"
	on:click={folderSelected}
	on:keydown={e => {
		if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			folderSelected();
		} else if (e.key === 'ContextMenu') {
			handleKeyboardContextMenu(e);
		} else if (e.key === 'F2') {
			e.preventDefault();
			startEditing();
		}
	}}
	on:contextmenu={handleContextMenu}
	aria-label={`Folder: ${name}`}
	class:expanded={expanded}
>
	<div class="folder-content">
		{#if !root}
			<div class="expand-icon">
				<ChevronRight size={14} />
			</div>
		{/if}
		<div class="icon-wrapper">
			{#if expanded}
				<FolderOpen size={16} />
			{:else}
				<FolderIcon size={16} />
			{/if}
		</div>
		{#if isEditing}
			<input
				bind:this={inputElement}
				bind:value={editValue}
				class="folder-name-input"
				on:blur={handleRename}
				on:keydown={e => handleKeyDown(e)}
			/>
		{:else}
			<span class="folder-name">{name}</span>
		{/if}
	</div>
</div>

{#if expanded || (root && children?.length > 0)}
	<ul transition:slide={{ duration: expanded ? 150 : 300 }} role="group">
		{#if newFileEditing}
			<li>
				<div class="new-item">
					<div class="icon-wrapper">
						{#if newItemIsFolder}
							<FolderIcon size={16} />
						{:else}
							<FileIcon size={16} />
						{/if}
					</div>
					<input
						bind:this={newFileInputElement}
						bind:value={newFileValue}
						class="new-item-input"
						placeholder="Enter name..."
						on:blur={() => handleNewItem(newItemIsFolder)}
						on:keydown={e => handleKeyDown(e, true, newItemIsFolder)}
					/>
				</div>
			</li>
		{/if}
		{#each children as file}
			<li>
				{#if isDirectory(file)}
					<svelte:self 
						name={file.name} 
						path={file.path} 
						children={file.children || []} 
						on:fileSelected={handleFileSelected} 
					/>
				{:else}
					<File 
						name={file.name} 
						path={file.path} 
						on:fileSelected={handleFileSelected} 
					/>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<ContextMenu
	bind:visible={contextMenu.visible}
	x={contextMenu.x}
	y={contextMenu.y}
	isDirectory={true}
	on:newFile={handleMenuAction}
	on:newFolder={handleMenuAction}
	on:rename={handleMenuAction}
	on:delete={handleMenuAction}
	on:copy={handleMenuAction}
	on:cut={handleMenuAction}
	on:paste={handleMenuAction}
/>

<style>
	.folder-name-input,
	.new-item-input {
		flex: 1;
		background-color: var(--warp-bg-panel);
		border: 1px solid var(--warp-border);
		color: var(--warp-text-primary);
		font-size: 13px;
		padding: var(--warp-space-xs) var(--warp-space-sm);
		margin: 0;
		outline: none;
		height: 19px;
		border-radius: 3px;
		transition: border-color 0.2s ease;
	}

	.folder-name-input:focus,
	.new-item-input:focus {
		border-color: var(--warp-accent);
	}

	.new-item {
		display: flex;
		align-items: center;
		padding: 0 var(--warp-space-md) 0 calc(var(--warp-space-md) + var(--warp-explorer-indent));
		position: relative;
		height: 22px;
	}

	.icon-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		margin-right: var(--warp-space-sm);
		color: var(--warp-text-secondary);
		flex-shrink: 0;
	}

	.icon-wrapper :global(svg) {
		transition: color 0.2s ease;
	}

	.folder-item {
		position: relative;
		cursor: pointer;
		color: var(--warp-text-primary);
		transition: background-color 0.1s ease;
		height: 22px;
		display: flex;
		align-items: center;
	}

	.folder-item:not(.root):hover {
		background-color: var(--warp-hover);
	}

	.folder-item:focus {
		outline: 1px solid var(--warp-accent);
		outline-offset: -1px;
	}

	.folder-content {
		display: flex;
		align-items: center;
		padding-left: var(--warp-explorer-indent);
		width: 100%;
		height: 100%;
	}

	.expand-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		color: var(--warp-text-secondary);
		transition: transform 0.15s ease;
		margin-right: var(--warp-space-xs);
		flex-shrink: 0;
	}

	.expand-icon :global(svg) {
		width: 14px;
		height: 14px;
		transition: color 0.2s ease;
	}

	.folder-item.expanded > .folder-content .expand-icon {
		transform: rotate(90deg);
	}

	.folder-item:hover .expand-icon :global(svg),
	.folder-item:hover .icon-wrapper :global(svg) {
		color: var(--warp-text-primary);
	}

	.folder-name {
		font-size: 13px;
		margin-left: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--warp-text-primary);
		transition: color 0.2s ease;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		position: relative;
		padding: 0;
		margin: 0;
		padding-left: var(--warp-explorer-indent);
	}

	li::before {
		content: "";
		position: absolute;
		left: calc(var(--warp-explorer-indent) / 2);
		top: 0;
		bottom: 0;
		width: 1px;
		background-color: var(--warp-border);
		opacity: 0.5;
	}

	li:last-child::before {
		height: 11px;
	}

	li::after {
		content: "";
		position: absolute;
		left: calc(var(--warp-explorer-indent) / 2);
		top: 11px;
		width: calc(var(--warp-explorer-indent) / 2);
		height: 1px;
		background-color: var(--warp-border);
		opacity: 0.5;
	}

	.root > ul > li::before,
	.root > ul > li::after {
		display: none;
	}
</style>
