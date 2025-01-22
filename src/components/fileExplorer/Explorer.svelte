<script lang="ts">
	type MenuAction = 'newFile' | 'newFolder' | 'paste';
	import { onMount, onDestroy } from 'svelte'
	import { invoke } from '@tauri-apps/api/core'
	import { listen } from '@tauri-apps/api/event'
	import activeFile, { type ActiveFile } from '../../stores/activeFile'
	import Folder from './Folder.svelte'
	import type { FileNode } from './types'
	import ContextMenu from './ContextMenu.svelte'
	import { File, FolderOpen, Folder as FolderIcon } from 'lucide-svelte'

	export let projectPath: string

	const exclusionList = ['node_modules', '.routify']
	const importantFiles = ['package.json', 'tsconfig.json', '.gitignore', 'README.md', 'vite.config.js', 'svelte.config.js']

	let files: FileNode
	let contextMenu = {
		x: 0,
		y: 0,
		visible: false
	}

	let unlistenFsEvents: (() => void) | null = null
	let refreshTimeout: NodeJS.Timeout | null = null

	async function handleContextMenu(event: MouseEvent) {
		contextMenu = {
			x: event.clientX,
			y: event.clientY,
			visible: true
		}
	}

	let newItemEditing = false
	let newItemValue = ''
	let newItemIsFolder = false
	let newItemInputElement: HTMLInputElement

	async function handleMenuAction(event: CustomEvent<{ action: MenuAction }>) {
		const { action } = event.detail
		try {
			switch (action) {
				case 'newFile':
					startNewItem(false)
					break
				case 'newFolder':
					startNewItem(true)
					break
				case 'paste':
					await invoke('paste_path', { destination: projectPath })
					break
			}
			contextMenu.visible = false
		} catch (error) {
			console.error(`Failed to ${action}:`, error)
		}
	}

	function startNewItem(isFolder: boolean) {
		newItemEditing = true
		newItemValue = ''
		newItemIsFolder = isFolder
		setTimeout(() => {
			newItemInputElement?.focus()
		}, 0)
	}

	async function handleNewItem() {
		if (newItemValue) {
			try {
				const newPath = `${projectPath}/${newItemValue}`
				if (newItemIsFolder) {
					await invoke('create_directory', { path: newPath })
				} else {
					await invoke('create_file', { path: newPath })
				}
				await loadProjectStructure()
			} catch (error) {
				console.error(`Failed to create ${newItemIsFolder ? 'folder' : 'file'}:`, error)
				alert(`Failed to create ${newItemIsFolder ? 'folder' : 'file'}: ${error}`)
			}
		}
		newItemEditing = false
		newItemValue = ''
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault()
			handleNewItem()
		} else if (event.key === 'Escape') {
			event.preventDefault()
			newItemEditing = false
			newItemValue = ''
		}
	}

	const getLanguageFromPath = (path: string): string => {
		const ext = path.split('.').pop()?.toLowerCase() || ''
		const fileName = path.split('/').pop()?.toLowerCase() || ''

		// Check for specific files first
		if (fileName === 'package.json' || fileName === 'tsconfig.json') return 'json'
		if (fileName === '.gitignore') return 'git'
		if (fileName === 'dockerfile') return 'dockerfile'
		if (fileName === 'makefile') return 'makefile'

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

	const filterAndSortFiles = (arg: FileNode): FileNode => {
		if (!arg?.children) return arg;
		
		const filtered = []
		for (let file of arg.children) {
			// Include if it's:
			// 1. An important file
			// 2. Not in exclusion list
			// 3. Not a hidden file (unless it's an important hidden file)
			if (importantFiles.includes(file.name) || 
				(!exclusionList.includes(file.name) && 
				(importantFiles.includes(file.name) || !file.name.startsWith('.')))) {
				
				if (file?.children?.length > 0) {
					file = filterAndSortFiles(file)
				}
				filtered.push(file)
			}
		}

		// Sort: directories first, then files alphabetically
		filtered.sort((a, b) => {
			// If both are directories or both are files, sort alphabetically
			if ((a.children && b.children) || (!a.children && !b.children)) {
				// Put important files first if they're both files
				if (!a.children && !b.children) {
					const aImportant = importantFiles.includes(a.name)
					const bImportant = importantFiles.includes(b.name)
					if (aImportant && !bImportant) return -1
					if (!aImportant && bImportant) return 1
				}
				return a.name.localeCompare(b.name)
			}
			// Put directories before files
			return a.children ? -1 : 1
		})

		arg.children = filtered
		return arg
	}

	async function setupFileSystemEvents() {
		try {
			// Watch the project directory for changes
			await invoke('watch_path', { path: projectPath })
			
			// Listen for file system events
			unlistenFsEvents = await listen<{ kind: string; paths: string[] }>('fs-event', async (event) => {
				const { kind, paths } = event.payload
				console.log('File system event:', { kind, paths })

				// Debounce the refresh to avoid multiple rapid updates
				if (refreshTimeout) {
					clearTimeout(refreshTimeout)
				}

				refreshTimeout = setTimeout(async () => {
					try {
						await loadProjectStructure()
					} catch (error) {
						console.error('Failed to refresh project structure:', error)
					}
				}, 100) // Wait 100ms before refreshing
			})
		} catch (error) {
			console.error('Failed to setup file system events:', error)
		}
	}

	async function loadProjectStructure() {
		try {
			console.log('Loading project structure for:', projectPath)
			const projectStruct = await invoke<FileNode>('get_project_structure', { path: projectPath })
			files = filterAndSortFiles(projectStruct)
			console.log('Project structure loaded:', files)
		} catch (error) {
			console.error('Failed to load project structure:', error)
		}
	}

	function handleFileSelected(event: CustomEvent) {
		// Log the received event
		console.log('Explorer received fileSelected event:', event.detail);
		
		// Forward the event from File component
		const editorEvent = event.detail;
		console.log('Explorer forwarding event:', editorEvent);
		
		// Dispatch the event to the window
		window.dispatchEvent(new CustomEvent('editorFileSelected', {
			detail: editorEvent,
			bubbles: true,
			composed: true
		}));
	}

	onMount(async () => {
		if (projectPath) {
			await loadProjectStructure()
			await setupFileSystemEvents()
		}
	})

	onDestroy(async () => {
		if (unlistenFsEvents) {
			await unlistenFsEvents()
		}
		if (refreshTimeout) {
			clearTimeout(refreshTimeout)
		}
	})
</script>

<main>
	<div class="explorer-container">
		{#if files}
			<div class="explorer-header">
				<span>EXPLORER</span>
			</div>
			<div 
				class="explorer-content"
				on:contextmenu|preventDefault={handleContextMenu}
				on:keydown={e => {
					if (e.key === 'ContextMenu') {
						e.preventDefault();
						const rect = e.currentTarget.getBoundingClientRect();
						contextMenu = {
							x: rect.left,
							y: rect.bottom,
							visible: true
						};
					}
				}}
				tabindex="0"
			>
				{#if newItemEditing}
					<div class="new-item">
						<div class="icon-wrapper">
							{#if newItemIsFolder}
								<FolderIcon size={16} />
							{:else}
								<File size={16} />
							{/if}
						</div>
						<input
							bind:this={newItemInputElement}
							bind:value={newItemValue}
							class="new-item-input"
							placeholder="Enter name..."
							on:blur={handleNewItem}
							on:keydown={handleKeyDown}
						/>
					</div>
				{/if}
				<Folder
					name={files.name}
					children={files.children || []}
					expanded={true}
					root={true}
					path={files.path}
					on:fileSelected={handleFileSelected}
				/>
			</div>
		{/if}
	</div>
</main>

<ContextMenu
	bind:visible={contextMenu.visible}
	x={contextMenu.x}
	y={contextMenu.y}
	isDirectory={true}
	on:newFile={handleMenuAction}
	on:newFolder={handleMenuAction}
	on:paste={handleMenuAction}
/>

<style>
	main {
		height: 100%;
		width: 100%;
		background-color: var(--warp-bg-sidebar);
		display: flex;
		flex-direction: column;
		color: var(--warp-text-primary);
	}

	.explorer-container {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.explorer-header {
		padding: 0 var(--warp-space-md);
		height: var(--warp-header-height);
		line-height: var(--warp-header-height);
		font-size: 11px;
		font-weight: 500;
		text-transform: uppercase;
		color: var(--warp-text-secondary);
		background-color: var(--warp-bg-sidebar);
		letter-spacing: 0.1em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.explorer-content {
		flex: 1;
		overflow-y: auto;
		padding: var(--warp-space-xs) 0;
		background-color: var(--warp-bg-sidebar);
	}

	.explorer-content :global(*) {
		font-size: 13px;
	}

	.new-item {
		display: flex;
		align-items: center;
		padding: 0 var(--warp-space-md) 0 calc(var(--warp-space-md) + var(--warp-explorer-indent));
		position: relative;
		height: 22px;
		margin: 0;
	}

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

	.new-item-input:focus {
		border-color: var(--warp-accent);
	}

	.new-item-input::placeholder {
		color: var(--warp-text-disabled);
	}

	.icon-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		margin-right: var(--warp-space-sm);
		color: var(--warp-text-secondary);
	}

	.icon-wrapper :global(svg) {
		transition: color 0.2s ease;
	}

	.icon-wrapper:hover :global(svg) {
		color: var(--warp-text-primary);
	}
</style>
