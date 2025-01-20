<script lang="ts">
	import { HSplitPane, VSplitPane } from 'svelte-split-pane'
	import { onMount, onDestroy } from 'svelte'
	import Editor from '../components/Editor.svelte'
	import UIPallete from '../components/canvas/UIPallete.svelte'
	import UICanvas from '../components/canvas/UICanvas.svelte'
	import LayoutEditor from '../components/canvas/LayoutEditor.svelte'
	import StyleEditor from '../components/canvas/StyleEditor.svelte'
	import { Explorer } from '../components/fileExplorer'
	import Terminal from '../components/Terminal.svelte'
	import Warp from '../assets/warpwhite.png'
	import OnlyTabs from '../components/tabs/OnlyTabs.svelte'
	import activeFile from '../stores/activeFile'
	import { invoke } from '@tauri-apps/api/core'
	import { listen } from '@tauri-apps/api/event'
	import { syncManager } from '../modules/warp/codeMap/sync'
	import { canvasStore } from '../components/canvas/stores/canvasStore'
	import type { CanvasItem } from '../components/canvas/types'

	// Get project path from URL
	let projectPath: string = ''
	onMount(() => {
		const hash = window.location.hash // e.g. "#/editor?path=..."
		const queryString = hash.split('?')[1] // Get everything after the ?
		if (queryString) {
			const params = new URLSearchParams(queryString)
			const path = params.get('path')
			if (path) {
				projectPath = decodeURIComponent(path)
				console.log('Project path:', projectPath)
			}
		}
	})

	let editorItems: CanvasItem[] = [];
	
	// Subscribe to canvas store to keep editorItems in sync
	$: if (shouldShowCanvas && $canvasStore.items) {
		console.log('Canvas store updated:', $canvasStore.items);
		editorItems = $canvasStore.items;
	}

	let consoleTabs: Array<Record<string, unknown>> = [
		{ label: 'TERMINAL', value: 1 },
		{ label: 'PROBLEMS', value: 2 },
		{ label: 'OUTPUT', value: 3 }
	]

	let activeConsoleTab = 1
	let shouldShowCanvas = false
	let activeEditorTab = 1
	let lang = 'html'

	const onEditorTabUpdate = (event: CustomEvent) => {
		activeEditorTab = event.detail
	}

	const onConsoleTabUpdate = (event: CustomEvent) => {
		activeConsoleTab = event.detail
	}

	let currentCode = '/** Code Will Appear Here **/'
	let editorTabs: Array<Record<string, unknown>> = []

	const upControlTabs: Array<Record<string, unknown>> = [
		{ label: 'Widgets', value: 1 },
		{ label: 'Layout', value: 2 },
		{ label: 'Style', value: 3 }
	]

	const updateCanvas = async (code?: string) => {
		console.log('updateCanvas called with:', { code, shouldShowCanvas });
		
		if (code) {
			currentCode = code;
		}
		
		// Always try to sync code to canvas
		if (shouldShowCanvas) {
			console.log('Updating canvas with code:', currentCode);
			await syncManager.updateCanvasFromCode(currentCode);
		}
	}

	const shouldCanvasShowByFile = (file: any) => {
		// Log file info for debugging
		console.log('Checking file:', file);
		
		if (!file?.path) {
			console.log('No file path provided');
			return false;
		}

		// Normalize path to use forward slashes
		const normalizedPath = file.path.replace(/\\/g, '/');
		console.log('Normalized path:', normalizedPath);
		
		const isSvelteFile = file?.name?.toLowerCase().includes('.svelte');
		const pathParts = normalizedPath.split('/');
		const srcIndex = pathParts.indexOf('src');
		
		// Check if file is in src directory
		if (srcIndex === -1) {
			console.log('File not in src directory');
			return false;
		}

		// Get the path parts after src/
		const pathAfterSrc = pathParts.slice(srcIndex + 1);
		console.log('Path after src:', pathAfterSrc);
		
		const isInSpecialDir = pathAfterSrc.some(part => 
			['components', 'pages', 'lib', 'routes'].includes(part)
		);
		const isRootSvelte = pathAfterSrc.length === 1;
		
		console.log('Path checks:', {
			isSvelteFile,
			isInSpecialDir,
			isRootSvelte,
			pathAfterSrc
		});
		
		if (isSvelteFile && (isInSpecialDir || isRootSvelte)) {
			console.log('Setting shouldShowCanvas to true');
			shouldShowCanvas = true;
			// Update canvas immediately and again after a delay
			updateCanvas();
			setTimeout(() => {
				updateCanvas();
			}, 300);
			return
		}
		shouldShowCanvas = false
	}

	let fileSelectedDirectHandler: ((event: Event) => void) | null = null
	let fileSelectedHandler: ((event: Event) => void) | null = null

	onMount(async () => {
		fileSelectedDirectHandler = async (event: Event) => {
			const customEvent = event as CustomEvent;
			console.log('AppBuilder received editorFileSelected event:', customEvent.detail);
			
			// Ensure we have a valid file object
			if (!customEvent.detail?.path) {
				console.error('Invalid file object received:', customEvent.detail);
				return;
			}
			
			shouldCanvasShowByFile(customEvent.detail);
			activeFile.set(customEvent.detail);
			
			// Update editor tabs
			const existingTabIndex = editorTabs.findIndex(tab => tab.path === customEvent.detail.path)
			if (existingTabIndex !== -1) {
				editorTabs.splice(existingTabIndex, 1)
			}
			
			editorTabs.unshift({
				label: customEvent.detail.name,
				value: 1,
				path: customEvent.detail.path,
				type: customEvent.detail.type
			})
			incrementTabs(customEvent.detail)

			lang = fileExtension(customEvent.detail.name)
			try {
				const content = await invoke<string>('read_file_content', { path: customEvent.detail.path });
				currentCode = content;
				if (shouldShowCanvas) {
					console.log('Setting active file in sync manager:', customEvent.detail.path);
					await syncManager.setActiveFile(customEvent.detail.path);
				}
				updateCanvas(content);
			} catch (error) {
				console.error('Failed to read file:', error);
			}
		}

		fileSelectedHandler = async (event: Event) => {
			const customEvent = event as CustomEvent;
			console.log('AppBuilder received fileSelected event:', customEvent.detail);
			
			// Ensure we have a valid file object
			if (!customEvent.detail?.path) {
				console.error('Invalid file object received:', customEvent.detail);
				return;
			}
			
			activeFile.set(customEvent.detail);
			shouldCanvasShowByFile(customEvent.detail);

			// Update editor tabs
			const existingTabIndex = editorTabs.findIndex(tab => tab.path === customEvent.detail.path)
			if (existingTabIndex !== -1) {
				editorTabs.splice(existingTabIndex, 1)
			}

			editorTabs.unshift({
				label: customEvent.detail.name,
				value: 1,
				path: customEvent.detail.path,
				type: customEvent.detail.type
			})

			incrementTabs(customEvent.detail)

			lang = fileExtension(customEvent.detail.name)
			try {
				const content = await invoke<string>('read_file_content', { path: customEvent.detail.path })
				currentCode = content
				updateCanvas(content)
			} catch (error) {
				console.error('Failed to read file:', error)
			}
		}

		// Log when event listeners are added
		console.log('Adding event listeners');
		window.addEventListener('editorFileSelected', fileSelectedDirectHandler);
		window.addEventListener('fileSelected', fileSelectedHandler);

		// Read README if it exists in the project
		if (projectPath) {
			try {
				const readmePath = `${projectPath}/README.md`
				const content = await invoke<string>('read_file_content', { path: readmePath })
				currentCode = content
				lang = 'markdown'
			} catch (error) {
				console.error('Failed to read README:', error)
			}
		}
	})

	onDestroy(() => {
		if (fileSelectedDirectHandler) {
			window.removeEventListener('editorFileSelected', fileSelectedDirectHandler)
		}
		if (fileSelectedHandler) {
			window.removeEventListener('fileSelected', fileSelectedHandler)
		}
	})

	const fileExtension = (name: string | string[]) => {
		if (!name) return 'html'
		const extension = name.toString().slice(name.toString().lastIndexOf('.') + 1)

		switch (extension) {
			case 'svelte':
				return 'svelte'
			case 'js':
				return 'javascript'
			case 'ts':
				return 'typescript'
			case 'json':
				return 'json'
			case 'xml':
				return 'html'
			case 'html':
				return 'svelte'
			case 'md':
				return 'markdown'
			case 'css':
				return 'css'
			default:
				return 'plaintext'
		}
	}

	const incrementTabs = (file: any) => {
		editorTabs = editorTabs.map((tab, index) => ({
			...tab,
			value: index + 1
		}))
	}

	function handleCanvasAction(event: CustomEvent<CanvasItem[]>) {
		console.log('Canvas action:', event.detail);
		canvasStore.setItems(event.detail);
	}
</script>

<main>
	<div id="header"></div>
	<div id="contents_wrapper">
		<div class="sidenav">
			<div class="icon-bar">
				<a class="active first-nav" href="/#"><img width="20" height="20" src="{Warp}" alt="" /></a>
			</div>
		</div>
		<div class="wrapper">
			<HSplitPane
				leftPaneSize="{shouldShowCanvas ? '60%' : '100%'}"
				rightPaneSize="{shouldShowCanvas ? '40%' : '0%'}"
				minLeftPaneSize="250px"
				minRightPaneSize="0"
				updateCallback="{() => {
					console.log('HSplitPane Updated!')
				}}"
			>
				<!-- Files explorer and editor -->
				<left slot="left">
					<HSplitPane
						leftPaneSize="20%"
						rightPaneSize="80%"
						minLeftPaneSize="150px"
						minRightPaneSize="300px"
						updateCallback="{() => {
							console.log('HSplitPane Updated!')
						}}"
					>
						<left slot="left">
							{#if projectPath}
								<Explorer {projectPath} />
							{/if}
						</left>
						<right slot="right">
							<VSplitPane
								topPanelSize="75%"
								downPanelSize="25%"
								minTopPaneSize="200px"
								minDownPaneSize="100px"
							>
								<top slot="top">
									<Editor bind:lang="{lang}" bind:code="{currentCode}" onAction="{updateCanvas}" />
								</top>
								<down slot="down">
									<!-- Terminal, console, output -->
									<div class="console-container">
										<OnlyTabs items="{consoleTabs}" add="{false}" on:message="{onConsoleTabUpdate}" />
										{#if activeConsoleTab === 1}
											<Terminal />
										{:else if activeConsoleTab === 2}
											<div class="console-panel">No problems found</div>
										{:else}
											<div class="console-panel">No output</div>
										{/if}
									</div>
								</down>
							</VSplitPane>
						</right>
					</HSplitPane>
				</left>
				<!-- Canvas and palette -->
				<right slot="right">
					{#if shouldShowCanvas}
						<HSplitPane
							leftPaneSize="60%"
							rightPaneSize="40%"
							minLeftPaneSize="300px"
							minRightPaneSize="200px"
							updateCallback="{() => {
								console.log('HSplitPane Updated!')
							}}"
						>
							<left slot="left">
								<!-- UI canvas -->
								<UICanvas bind:items={editorItems} on:action={handleCanvasAction} />
							</left>
							<right slot="right">
								<!-- Widget, style, layout tabs for the active item -->
								<OnlyTabs on:message="{onEditorTabUpdate}" items="{upControlTabs}" add="{false}" />
								<div class="control-panel">
									{#if activeEditorTab === 1}
										<UIPallete />
									{:else if activeEditorTab === 2}
										<LayoutEditor />
									{:else}
										<StyleEditor />
									{/if}
								</div>
							</right>
						</HSplitPane>
					{/if}
				</right>
			</HSplitPane>
		</div>
	</div>
</main>

<style>
	#contents_wrapper {
		width: 100vw;
		height: 95vh;
		background-color: #1e1e1e;
	}
	.wrapper {
		height: 100%;
		margin-left: 3vw;
	}
	#header {
		width: 100%;
		height: 5vh;
		line-height: 5vh;
		background-color: #2f4f4f;
		-webkit-app-region: drag;
	}
	.sidenav {
		height: 95vh;
		width: 3vw;
		z-index: 1;
		float: left;
		top: 0;
		left: 0;
		background-color: #282828;
		overflow-x: hidden;
		padding-top: 0px;
		color: white !important;
	}
	.icon-bar {
		height: 100%;
		width: 100%;
		text-align: center;
	}

	.first-nav {
		margin-top: 0 !important;
	}

	.icon-bar a {
		padding: 15px;
		opacity: 70%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 20px;
	}

	.icon-bar a:hover {
		background-color: #555;
	}

	.active {
		background-color: black;
		opacity: 100% !important;
	}

	.console-container {
		height: 100%;
		background-color: #1e1e1e;
		color: #cccccc;
	}

	.console-panel {
		padding: 1rem;
		height: calc(100% - 30px);
		overflow: auto;
		font-family: monospace;
		font-size: 12px;
	}

	.control-panel {
		height: calc(100% - 30px);
		overflow: auto;
		background-color: #1e1e1e;
	}
</style>
