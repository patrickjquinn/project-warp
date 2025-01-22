<script lang="ts">
	import Monaco from './Monaco.svelte'
	import { onMount, onDestroy } from 'svelte'
	import { openTabs } from '../stores/directoryStore'
	import { invoke } from '@tauri-apps/api/core'
	import { basename } from '@tauri-apps/api/path'
	import { confirm } from '@tauri-apps/plugin-dialog'
	import { listen } from '@tauri-apps/api/event'
	import activeFile, { type ActiveFile } from '../stores/activeFile'
	import OnlyTabs from './tabs/OnlyTabs.svelte'
	import {
		FileJson,
		FileCode,
		FileText,
		FileType,
		File as FileIcon,
		Settings,
		GitBranch,
		Terminal,
		FileImage,
		FileSpreadsheet,
		FileVideo,
		FileAudio
	} from 'lucide-svelte'

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

	function getFileIcon(fileName: string, ext: string) {
		// Check specific files first
		if (fileName === 'package.json' || fileName === 'tsconfig.json') return FileJson
		if (fileName === '.gitignore' || fileName.startsWith('.git')) return GitBranch
		if (fileName === 'dockerfile') return FileCode
		if (fileName === 'makefile') return Terminal
		if (fileName.includes('config') || fileName.endsWith('rc')) return Settings

		// Then check extensions
		const codeExts = ['ts', 'tsx', 'js', 'jsx', 'mjs', 'svelte', 'vue', 'php', 'py', 'rb', 'rs', 'go', 'java', 'c', 'cpp', 'h', 'hpp']
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

	let fileWatcherUnlisten: (() => void) | null = null

	async function setupFileWatcher() {
		try {
			fileWatcherUnlisten = await listen<{ kind: string; paths: string[] }>('fs-event', async (event) => {
				const { paths } = event.payload
				const activeTab = $openTabs.find(obj => obj.tabId === activeTabValue)
				
				if (activeTab && paths.includes(activeTab.filePath)) {
					try {
						const content = await invoke<string>('read_file_content', { 
							path: activeTab.filePath 
						})
						
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

			const existingTab = $openTabs.find(tab => tab.filePath === newTab.filePath)
			if (existingTab) {
				activeTabValue = existingTab.tabId
				activeEditor = existingTab.tabId
				return
			}

			$openTabs = [...$openTabs, newTab]
			count = count + 1
			activeTabValue = newTab.tabId
			activeEditor = newTab.tabId
			
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

	function handleTabClose(event: CustomEvent) {
		deleteTab(event.detail.value)
	}

	$: tabItems = $openTabs.map(tab => ({
		label: tab.fileName,
		value: tab.tabId,
		path: tab.filePath,
		modified: tab.modified,
		icon: getFileIcon(tab.fileName, tab.ext)
	}))

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

<div class="editor-container">
	{#if $openTabs.length > 0}
		<div class="editor-tabs">
			<OnlyTabs 
				items={tabItems} 
				bind:activeTabValue 
				on:close={handleTabClose}
			/>
		</div>
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
			<div class="empty-content">
				<h2>Welcome to WarpCode</h2>
				<p>Open a file from the explorer to start editing</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.editor-container {
		height: 100%;
		width: 100%;
		display: flex;
		flex-direction: column;
		background-color: var(--warp-bg-main);
	}

	.editor-tabs {
		flex-shrink: 0;
	}

	.editor-body {
		flex: 1;
		overflow: hidden;
		border-top: 1px solid var(--warp-border);
	}

	.empty-state {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--warp-text-secondary);
		background-color: var(--warp-bg-main);
		user-select: none;
		padding: var(--warp-space-xl);
	}

	.empty-content {
		text-align: center;
		max-width: 400px;
	}

	.empty-content h2 {
		font-size: 24px;
		font-weight: 300;
		margin: 0 0 var(--warp-space-md);
		color: var(--warp-text-primary);
		letter-spacing: -0.5px;
	}

	.empty-content p {
		font-size: 14px;
		margin: 0;
		line-height: 1.6;
		color: var(--warp-text-secondary);
	}
</style>
