<script lang="ts">
	import File from './File.svelte'
	import { slide } from 'svelte/transition'
	import { createEventDispatcher } from 'svelte'
	import activeDirectory from '../../stores/activeDirectory'
	import { invoke } from '@tauri-apps/api/core'
	import ContextMenu from './ContextMenu.svelte'
	import type { FileNode, FileSelectedEvent } from './types'

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
			// Re-watch the directory after operations
			await invoke('watch_path', { path })
		} catch (error) {
			console.error('Failed to refresh folder:', error)
		}
	}

	async function folderSelected() {
		if (!root) {
			toggle()
			activeDirectory.set(path)
			
			// Start watching this directory for changes
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
		// Log the received event
		console.log('Folder received fileSelected event:', event.detail);
		
		// Forward the file selection event up
		console.log('Folder forwarding event to Explorer');
		dispatch('fileSelected', event.detail);
		
		// Also dispatch the editor event directly to ensure it reaches AppBuilder
		console.log('Folder dispatching editorFileSelected event');
		window.dispatchEvent(new CustomEvent('editorFileSelected', {
			detail: event.detail,
			bubbles: true,
			composed: true
		}));
	}

	// Determine if a node is a directory
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
		<div class="folder-icon"></div>
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
					<div class={newItemIsFolder ? "folder-icon" : "file-icon"}></div>
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
		background: #3c3c3c;
		border: 1px solid #007fd4;
		color: #cccccc;
		font-size: 0.9rem;
		padding: 0 0.3rem;
		margin-right: 0.5rem;
		outline: none;
		height: 1.2rem;
	}

	.new-item {
		display: flex;
		align-items: center;
		padding-left: 1.5rem;
		position: relative;
		height: 1.5rem;
	}

	.file-icon,
	.folder-icon {
		position: absolute;
		left: 0.2rem;
		width: 1rem;
		height: 1rem;
		background-size: contain;
		background-repeat: no-repeat;
		background-position: center;
	}

	.file-icon {
		background-image: url(/static/assets/file.svg);
	}

	.folder-icon {
		background-image: url(/static/assets/folder.svg);
	}

	.folder-item {
		padding: 0.2rem 0;
		font-weight: bold;
		cursor: pointer;
		color: white;
		transition: background-color 0.2s;
	}

	.folder-content {
		display: flex;
		align-items: center;
		padding-left: 1.5rem;
		position: relative;
		height: 1.5rem;
	}

	.folder-icon {
		position: absolute;
		left: 0.2rem;
		width: 1rem;
		height: 1rem;
		background: url(/static/assets/folder.svg) center/contain no-repeat;
	}

	.folder-item.expanded .folder-icon {
		background-image: url(/static/assets/folder-open.svg);
	}

	.folder-name {
		margin-left: 0.3rem;
	}

	.folder-item:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}

	.root {
		cursor: default;
	}

	ul {
		padding: 0.2em 0 0 1rem;
		margin: 0;
		list-style: none;
		border-left: 1px solid rgba(255, 255, 255, 0.1);
	}

	li {
		padding: 0.2em 0;
		color: white;
		list-style: none;
	}
</style>
