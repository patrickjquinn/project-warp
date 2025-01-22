<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import { invoke } from '@tauri-apps/api/core'
	import type { FileNode, FileSelectedEvent } from './types'
	import ContextMenu from './ContextMenu.svelte'
	import activeFile, { type ActiveFile } from '../../stores/activeFile'
	import {
		File as FileIcon,
		FileJson,
		FileText,
		FileCode,
		FileType,
		FileImage,
		FileSpreadsheet,
		FileVideo,
		FileAudio,
		Terminal,
		Cog,
		GitBranch
	} from 'lucide-svelte'

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
	let isSelected = false

	// Subscribe to activeFile store to track selection state
	activeFile.subscribe(file => {
		isSelected = file?.path === path;
	});

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
			const content = await invoke<string>('read_file_content', { path })
			if (content === undefined || content === null) {
				throw new Error('Failed to read file content')
			}

			const ext = name.split('.').pop()?.toLowerCase() || ''
			const fileLanguage = getLanguageFromPath(name, ext)
			
			const fileInfo: FileSelectedEvent = {
				name,
				type: 'file' as const,
				path,
				content,
				language: fileLanguage
			}

			console.log('File clicked:', {
				name,
				path,
				content: content.slice(0, 100) + '...',
				language: fileLanguage
			});

			const activeFileInfo: ActiveFile = {
				...fileInfo,
				modified: false
			}
			
			activeFile.set(activeFileInfo)

			const editorEvent = new CustomEvent('editorFileSelected', {
				detail: fileInfo,
				bubbles: true,
				composed: true
			})
			console.log('Dispatching editorFileSelected event:', fileInfo);
			window.dispatchEvent(editorEvent)

			console.log('Dispatching fileSelected event:', fileInfo);
			dispatch('fileSelected', fileInfo)
		} catch (error) {
			console.error('Failed to read file:', error)
			alert(`Failed to open file: ${error}`)
		}
	}

	$: {
		extension = name.slice(name.lastIndexOf('.') + 1).toLowerCase()
		language = getLanguageFromPath(name, extension)
	}

	function getFileIcon(fileName: string, ext: string) {
		// Check specific files first
		if (fileName === 'package.json' || fileName === 'tsconfig.json') return FileJson
		if (fileName === '.gitignore' || fileName.startsWith('.git')) return GitBranch
		if (fileName === 'dockerfile') return FileCode
		if (fileName === 'makefile') return Terminal
		if (fileName.includes('config') || fileName.endsWith('rc')) return Cog

		// Then check extensions
		const codeExts = ['js', 'jsx', 'ts', 'tsx', 'svelte', 'vue', 'php', 'py', 'rb', 'rs', 'go', 'java', 'c', 'cpp', 'h', 'hpp']
		const configExts = ['json', 'yaml', 'yml', 'toml', 'ini']
		const docExts = ['md', 'txt', 'doc', 'docx', 'pdf', 'rtf']
		const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp']
		const styleExts = ['css', 'scss', 'sass', 'less', 'styl']
		const dataExts = ['csv', 'xls', 'xlsx', 'xml']
		const videoExts = ['mp4', 'webm', 'mov', 'avi']
		const audioExts = ['mp3', 'wav', 'ogg', 'flac']

		if (codeExts.includes(ext)) return FileCode
		if (configExts.includes(ext)) return FileJson
		if (docExts.includes(ext)) return FileText
		if (imageExts.includes(ext)) return FileImage
		if (styleExts.includes(ext)) return FileType
		if (dataExts.includes(ext)) return FileSpreadsheet
		if (videoExts.includes(ext)) return FileVideo
		if (audioExts.includes(ext)) return FileAudio

		return FileIcon
	}
</script>

<div 
	class="file-item"
	class:selected={isSelected}
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
	<div class="file-content">
		<div class="icon-wrapper">
			<svelte:component this={getFileIcon(name, extension)} size={16} />
		</div>
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
	.file-item {
		position: relative;
		height: 22px;
		color: var(--warp-text-primary);
		cursor: pointer;
		user-select: none;
		display: flex;
		align-items: center;
		transition: background-color 0.1s ease;
	}

	.file-item:hover {
		background-color: var(--warp-hover);
	}

	.file-item:focus {
		outline: 1px solid var(--warp-accent);
		outline-offset: -1px;
	}

	.file-item.selected {
		background-color: var(--warp-accent-transparent);
	}

	.file-item.selected:focus {
		background-color: var(--warp-accent-transparent);
	}

	.file-content {
		display: flex;
		align-items: center;
		padding-left: var(--warp-explorer-indent);
		width: 100%;
		height: 100%;
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

	.file-item:hover .icon-wrapper :global(svg) {
		color: var(--warp-text-primary);
	}

	.file-name {
		font-size: 13px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--warp-text-primary);
		transition: color 0.2s ease;
	}

	.file-name-input {
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

	.file-name-input:focus {
		border-color: var(--warp-accent);
	}

	.file-name-input::placeholder {
		color: var(--warp-text-disabled);
	}
</style>
