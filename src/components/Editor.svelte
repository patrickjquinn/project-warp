<script lang="ts">
	import Monaco from './Monaco.svelte'
	import { onMount, onDestroy } from 'svelte'
	import { openTabs } from '../stores/directoryStore'
	import { invoke } from '@tauri-apps/api/core'
	import { basename } from '@tauri-apps/api/path'
	import { confirm } from '@tauri-apps/plugin-dialog'
	import { listen } from '@tauri-apps/api/event'
	import activeFile, { type ActiveFile } from '../stores/activeFile'

	export let activeTabValue = 0
	export let lang = 'html'
	export let code = ''
	export let onAction: ((code: string) => void) | undefined = undefined
	let activeEditor = 0

	let title = 'WarpCode'
	let count = 0

	interface EditorTab {
		editorValue: string;
		ext: string;
		editorLang: {
			name: string;
			json?: boolean;
			highlightFormatting?: boolean;
			fencedCodeBlockHighlighting?: boolean;
			base?: string;
		};
		filePath: string;
		fileName: string;
		tabId: number;
		modified: boolean;
	}

	function getFileIcon(fileName: string, ext: string): string {
		// Check specific files first
		if (fileName === 'package.json' || fileName === 'tsconfig.json') return '/static/assets/json.svg'
		if (fileName === '.gitignore') return '/static/assets/git.svg'
		if (fileName.toLowerCase() === 'dockerfile') return '/static/assets/docker.svg'
		if (fileName.toLowerCase() === 'makefile') return '/static/assets/make.svg'

		// Then check extensions
		const iconMap: Record<string, string> = {
			'ts': 'ts',
			'tsx': 'ts',
			'js': 'js',
			'jsx': 'js',
			'mjs': 'js',
			'svelte': 'svelte',
			'vue': 'vue',
			'css': 'css',
			'scss': 'css',
			'sass': 'css',
			'less': 'css',
			'json': 'json',
			'jsonc': 'json',
			'html': 'html',
			'htm': 'html',
			'md': 'markdown',
			'markdown': 'markdown',
			'yml': 'yaml',
			'yaml': 'yaml',
			'rs': 'rust',
			'py': 'python',
			'go': 'go',
			'java': 'java',
			'php': 'php',
			'rb': 'ruby',
			'sh': 'shell',
			'bash': 'shell',
			'sql': 'sql',
			'xml': 'xml',
			'toml': 'toml',
			'cpp': 'cpp',
			'cc': 'cpp',
			'h': 'cpp',
			'hpp': 'cpp',
			'c': 'c'
		}
		return `/static/assets/${iconMap[ext] || 'file'}.svg`
	}

	let fileWatcherUnlisten: (() => void) | null = null

	async function setupFileWatcher() {
		try {
			fileWatcherUnlisten = await listen<{ kind: string; paths: string[] }>('fs-event', async (event) => {
				const { paths } = event.payload
				const activeTab = $openTabs.find(obj => obj.tabId === activeTabValue)
				
				if (activeTab && paths.includes(activeTab.filePath)) {
					try {
						// Refresh file content
						const content = await invoke<string>('read_file_content', { 
							path: activeTab.filePath 
						})
						
						// Only update if content has changed and file isn't modified locally
						if (!activeTab.modified && content !== activeTab.editorValue) {
							code = content
							activeTab.editorValue = content
							$openTabs = [...$openTabs]
							
							activeFile.set({
								name: activeTab.fileName,
								path: activeTab.filePath,
								content,
								type: 'file',
								language: activeTab.editorLang.name,
								modified: false
							})
						}
					} catch (error) {
						console.error('Failed to refresh file content:', error)
					}
				}
			})
		} catch (error) {
			console.error('Failed to setup file watcher:', error)
		}
	}

	async function addTab(file: ActiveFile) {
		if (!file || !file.path || !file.name || !file.content || !file.language) {
			console.error('Invalid file info:', file)
			return
		}

		try {
			const newTab: EditorTab = {
				editorValue: file.content,
				ext: file.name.split('.').pop() || '',
				editorLang: {
					name: file.language
				},
				filePath: file.path,
				fileName: file.name,
				tabId: count,
				modified: false
			}

			// Check for duplicates
			const existingTab = $openTabs.find(tab => tab.filePath === newTab.filePath)
			if (existingTab) {
				activeTabValue = existingTab.tabId
				activeEditor = existingTab.tabId
				return
			}

			// Add new tab
			$openTabs = [...$openTabs, newTab]
			count = count + 1
			activeTabValue = newTab.tabId
			activeEditor = newTab.tabId
			
			// Start watching this file
			await invoke('watch_path', { path: file.path })
		} catch (error) {
			console.error('Failed to add tab:', error)
		}
	}

	onMount(async () => {
		await setupFileWatcher()
	})

	onDestroy(() => {
		if (fileWatcherUnlisten) {
			fileWatcherUnlisten()
		}
	})

	async function deleteTab(targetId: number) {
		const tab = $openTabs.find(t => t.tabId === targetId)
		if (tab?.modified) {
			const confirmed = await confirm(
				'Do you want to save the changes?',
				{
					title: 'Save Changes',
					kind: 'warning'
				}
			)
			if (confirmed) {
				await saveTab(tab)
			}
		}

		$openTabs = $openTabs
			.filter((t) => t.tabId != targetId)
			.map((t, i) => ({
				...t,
				tabId: i
			}))
		
		count = count - 1
		activeTabValue = Math.max(0, $openTabs.length - 1)
		activeEditor = activeTabValue

		const active = $openTabs.find(obj => obj.tabId === activeTabValue)
		if (active) {
			code = active.editorValue
			activeFile.set({
				name: active.fileName,
				path: active.filePath,
				content: active.editorValue,
				type: 'file',
				language: active.editorLang.name,
				modified: active.modified
			})
		} else {
			activeFile.clear()
		}
	}

	const handleClick = (tabId: number) => async () => {
		activeTabValue = tabId
		activeEditor = activeTabValue
		
		const active = $openTabs.find(obj => obj.tabId === tabId)

		if (active) {
			try {
				// Refresh file content when switching tabs
				const content = await invoke<string>('read_file_content', { 
					path: active.filePath 
				})
				code = content
				active.editorValue = content
				active.modified = false

				activeFile.set({
					name: active.fileName,
					path: active.filePath,
					content,
					type: 'file',
					language: active.editorLang.name,
					modified: false
				})
			} catch (error) {
				console.error('Failed to read file:', error)
			}
		}
	}

	async function saveTab(tab: EditorTab) {
		if (code !== tab.editorValue) {
			try {
				await invoke('write_file_content', {
					path: tab.filePath,
					content: code
				})
				tab.editorValue = code
				tab.modified = false
				$openTabs = [...$openTabs]
				
				activeFile.markSaved()

				if (onAction) {
					onAction(code)
				}
			} catch (error) {
				console.error('Failed to save file:', error)
			}
		}
	}

	async function handleSave(event: CustomEvent) {
		const active = $openTabs.find(obj => obj.tabId === activeTabValue)
		if (active) {
			await saveTab(active)
		}
	}

	function handleCodeChange(event: CustomEvent<string>) {
		const newCode = event.detail
		if (newCode !== code) {
			code = newCode
			const active = $openTabs.find(obj => obj.tabId === activeTabValue)
			if (active) {
				active.modified = true
				$openTabs = [...$openTabs]
				activeFile.markModified()
			}
		}
	}

	// Listen for file selection events from the explorer
	window.addEventListener('editorFileSelected', ((event: CustomEvent<ActiveFile>) => {
		const fileInfo = event.detail
		if (!fileInfo || !fileInfo.content || !fileInfo.language) {
			console.error('Invalid file info received:', fileInfo)
			return
		}
		code = fileInfo.content
		lang = fileInfo.language
		addTab(fileInfo)
		title = `${fileInfo.name} - ${title}`
	}) as EventListener)

	// Listen for save keyboard shortcut
	window.addEventListener('keydown', async (e) => {
		if ((e.metaKey || e.ctrlKey) && e.key === 's') {
			e.preventDefault()
			const active = $openTabs.find(obj => obj.tabId === activeTabValue)
			if (active) {
				await saveTab(active)
			}
		}
	})
</script>

<div class="tabs-container">
	<ul>
		{#each $openTabs as tab}
			<li
				class:active={activeTabValue === tab.tabId}
			>
				<span class="tab-span" on:click={handleClick(tab.tabId)}>
					<img src={getFileIcon(tab.fileName, tab.ext)} alt={tab.ext} />
					<span class="tab-name">
						{tab.fileName}
						{#if tab.modified}
							<span class="modified-indicator" title="File has unsaved changes">●</span>
						{/if}
					</span>
					<button 
						class="delete-button" 
						on:click|stopPropagation={() => deleteTab(tab.tabId)}
						title="Close"
					>
						×
					</button>
				</span>
			</li>
		{/each}
	</ul>
</div>

{#if $openTabs.length > 0}
	<div class="editor-body">
		<Monaco 
			bind:code 
			bind:lang 
			on:save={handleSave}
			on:change={handleCodeChange}
		/>
	</div>
{:else}
	<div class="empty-state">
		<p>No files open</p>
	</div>
{/if}

<style>
	.tabs-container {
		background-color: rgb(27, 27, 26);
		border-bottom: 1px solid #dee2e6;
	}

	.editor-body {
		width: 100%;
		height: 98%;
		overflow: hidden;
		padding: 0;
	}

	.empty-state {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		color: #666;
		font-style: italic;
	}

	ul {
		font-size: 10px;
		display: flex;
		flex-direction: row;
		overflow: auto;
		white-space: nowrap;
		scrollbar-width: thin;
		padding-left: 0;
		margin: 0;
		list-style: none;
		border-bottom: 1px solid #dee2e6;
		background-color: rgb(27, 27, 26);
	}

	li {
		margin-bottom: -1px;
		background-color: rgb(37, 37, 37);
		color: #fff;
	}

	.tab-span {
		border: 1px solid transparent;
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 0.3rem 0.8rem;
		cursor: pointer;
		font-size: 12px;
		gap: 0.5rem;
	}

	.tab-name {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.modified-indicator {
		color: #ffd700;
		font-size: 0.8em;
		margin-left: 0.3rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 0.8em;
		height: 0.8em;
	}

	.tab-span:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}

	li.active > .tab-span {
		color: #ffffff;
		background-color: rgb(53, 50, 50);
		border-color: #dee2e6 #dee2e6 #fff;
	}

	img {
		height: 1em;
		width: 1em;
		object-fit: contain;
	}

	.delete-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		margin-left: 4px;
		font-size: 14px;
		opacity: 0.7;
		transition: opacity 0.2s;
		background: none;
		border: none;
		color: inherit;
		padding: 0;
		cursor: pointer;
	}

	.delete-button:hover {
		opacity: 1;
		background-color: rgba(255, 255, 255, 0.1);
	}
</style>
