<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import { invoke } from '@tauri-apps/api/core'
	import type { FileNode, FileSelectedEvent } from './types'
	import ContextMenu from './ContextMenu.svelte'
	import activeFile, { type ActiveFile } from '../../stores/activeFile'

	type MenuAction = 'newFile' | 'newFolder' | 'rename' | 'delete' | 'copy' | 'paste' | 'cut';

	export let name: string
	export let path: string

	const dispatch = createEventDispatcher<{
		fileSelected: FileSelectedEvent
	}>()

	let contextMenu: { x: number; y: number; visible: boolean } = {
		x: 0,
		y: 0,
		visible: false
	}

	let extension: string
	let icon: string
	let language: string
	let isEditing = false
	let editValue = name
	let inputElement: HTMLInputElement

	function getLanguageFromPath(fileName: string, ext: string): string {
		// Check specific files first
		if (fileName === 'package.json' || fileName === 'tsconfig.json') return 'json'
		if (fileName === '.gitignore') return 'git'
		if (fileName.toLowerCase() === 'dockerfile') return 'dockerfile'
		if (fileName.toLowerCase() === 'makefile') return 'makefile'

		// Then check extensions
		switch (ext) {
			case 'ts':
			case 'tsx':
				return 'typescript'
			case 'js':
			case 'jsx':
			case 'mjs':
				return 'javascript'
			case 'svelte':
				return 'svelte'
			case 'vue':
				return 'vue'
			case 'css':
			case 'scss':
			case 'sass':
			case 'less':
				return 'css'
			case 'json':
			case 'jsonc':
				return 'json'
			case 'html':
			case 'htm':
				return 'html'
			case 'md':
			case 'markdown':
				return 'markdown'
			case 'yml':
			case 'yaml':
				return 'yaml'
			case 'rs':
				return 'rust'
			case 'py':
				return 'python'
			case 'go':
				return 'go'
			case 'java':
				return 'java'
			case 'php':
				return 'php'
			case 'rb':
				return 'ruby'
			case 'sh':
			case 'bash':
				return 'shell'
			case 'sql':
				return 'sql'
			case 'xml':
				return 'xml'
			case 'toml':
				return 'toml'
			case 'cpp':
			case 'cc':
			case 'h':
			case 'hpp':
				return 'cpp'
			case 'c':
				return 'c'
			default:
				return 'plaintext'
		}
	}

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
				case 'rename':
					startEditing()
					break
				case 'delete':
					if (confirm(`Are you sure you want to delete ${name}?`)) {
						await invoke('delete_path', { path })
					}
					break
				case 'copy':
					await invoke('copy_path', { path, cut: false })
					break
				case 'cut':
					await invoke('copy_path', { path, cut: true })
					break
			}
			contextMenu.visible = false
		} catch (error) {
			console.error(`Failed to ${action}:`, error)
			alert(`Failed to ${action}: ${error}`)
		}
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

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault()
			handleRename()
		} else if (event.key === 'Escape') {
			event.preventDefault()
			editValue = name
			isEditing = false
		}
	}

	async function fileClicked() {
		try {
			// Read file content first
			const content = await invoke<string>('read_file_content', { path })
			if (content === undefined || content === null) {
				throw new Error('Failed to read file content')
			}

			// Get language based on file extension
			const ext = name.split('.').pop()?.toLowerCase() || ''
			const fileLanguage = getLanguageFromPath(name, ext)
			
			// Create active file info
			const fileInfo: FileSelectedEvent = {
				name,
				type: 'file' as const,
				path,
				content,
				language: fileLanguage
			}

			// Log file info for debugging
			console.log('File clicked:', {
				name,
				path,
				content: content.slice(0, 100) + '...',
				language: fileLanguage
			});

			// Create active file info with additional properties
			const activeFileInfo: ActiveFile = {
				...fileInfo,
				modified: false
			}
			
			// Update the store first
			activeFile.set(activeFileInfo)

			// Then dispatch the event for the editor
			const editorEvent = new CustomEvent('editorFileSelected', {
				detail: fileInfo,
				bubbles: true,
				composed: true
			})
			console.log('Dispatching editorFileSelected event:', fileInfo);
			window.dispatchEvent(editorEvent)

			// Also dispatch for any parent components that need to know
			console.log('Dispatching fileSelected event:', fileInfo);
			dispatch('fileSelected', fileInfo)
		} catch (error) {
			console.error('Failed to read file:', error)
			alert(`Failed to open file: ${error}`)
		}
	}

	$: {
		extension = name.slice(name.lastIndexOf('.') + 1)
		language = getLanguageFromPath(name, extension)

		// Set icon based on file type
		const iconMap: Record<string, string> = {
			'svelte': 'svelte',
			'js': 'js',
			'jsx': 'js',
			'ts': 'ts',
			'tsx': 'ts',
			'json': 'json',
			'xml': 'xml',
			'jpg': 'jpg',
			'jpeg': 'jpg',
			'svg': 'svg',
			'png': 'png',
			'html': 'html',
			'css': 'css',
			'md': 'markdown',
			'rs': 'rust',
			'py': 'python',
			'go': 'go',
			'java': 'java',
			'php': 'php',
			'rb': 'ruby',
			'sh': 'shell',
			'bash': 'shell',
			'sql': 'sql',
			'yml': 'yaml',
			'yaml': 'yaml',
			'toml': 'toml'
		}

		icon = `/static/assets/${iconMap[extension] || 'file'}.svg`
	}
</script>

<div 
	class="file-item"
	role="button"
	tabindex="0"
	on:click={fileClicked}
	on:keydown={e => {
		if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			fileClicked();
		} else if (e.key === 'ContextMenu') {
			handleKeyboardContextMenu(e);
		} else if (e.key === 'F2') {
			e.preventDefault();
			startEditing();
		}
	}}
	on:contextmenu={handleContextMenu}
	aria-label={`File: ${name}`}
>
	<img src={icon} alt={`${extension} file`} class="file-icon" />
	{#if isEditing}
		<input
			bind:this={inputElement}
			bind:value={editValue}
			class="file-name-input"
			on:blur={handleRename}
			on:keydown={handleKeyDown}
		/>
	{:else}
		<span class="file-name">{name}</span>
	{/if}
</div>

<ContextMenu
	bind:visible={contextMenu.visible}
	x={contextMenu.x}
	y={contextMenu.y}
	isFile={true}
	on:newFile={handleMenuAction}
	on:newFolder={handleMenuAction}
	on:rename={handleMenuAction}
	on:delete={handleMenuAction}
	on:copy={handleMenuAction}
	on:cut={handleMenuAction}
	on:paste={handleMenuAction}
/>

<style>
	.file-name-input {
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

	.file-item {
		padding: 0.2rem 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #cccccc;
		cursor: pointer;
		border-radius: 3px;
		padding-left: 1.5rem;
		position: relative;
		user-select: none;
	}

	.file-item:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}

	.file-icon {
		width: 1rem;
		height: 1rem;
		object-fit: contain;
		opacity: 0.8;
	}

	.file-name {
		font-size: 0.9rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Add glassmorphic effect on hover */
	.file-item:hover {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	/* Active state */
	.file-item:active {
		background: rgba(255, 255, 255, 0.15);
		transform: scale(0.98);
	}
</style>
