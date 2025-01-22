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
import SearchBar from '../components/SearchBar.svelte'
import SearchPanel from '../components/SearchPanel.svelte'
import { panelStore, type PanelType } from '../stores/panelStore'
import { layoutStore } from '../stores/layoutStore'
import {
  Files,
  Search,
  GitBranch,
  Play,
  Puzzle,
  User,
  Settings,
  Globe,
  FileText,
  Type,
  AlignJustify,
  Code,
  Bug,
  Package,
  ChevronLeft,
  ChevronRight,
  Terminal as TerminalIcon,
  Layout,
  Edit3
} from 'lucide-svelte'
import OnlyTabs from '../components/tabs/OnlyTabs.svelte'
import activeFile from '../stores/activeFile'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { syncManager } from '../modules/warp/codeMap/sync'
import { canvasStore } from '../components/canvas/stores/canvasStore'
import type { CanvasItem } from '../components/canvas/types'
import { searchStore } from '../stores/searchStore'

let projectPath: string = ''

function handleGlobalSearch(event: CustomEvent<string>) {
  const query = event.detail;
  if (query.trim()) {
    searchStore.search(projectPath, query);
    panelStore.showPanel('search');
  }
}

onMount(() => {
  const hash = window.location.hash
  const queryString = hash.split('?')[1]
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

$: if (shouldShowCanvas && $canvasStore.items) {
  console.log('Canvas store updated:', $canvasStore.items);
  editorItems = $canvasStore.items;
}

let consoleTabs = [
  { label: 'TERMINAL', value: 1 },
  { label: 'PROBLEMS', value: 2 },
  { label: 'OUTPUT', value: 3 },
  { label: 'DEBUG CONSOLE', value: 4 }
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

const upControlTabs = [
  { label: 'Widgets', value: 1 },
  { label: 'Layout', value: 2 },
  { label: 'Style', value: 3 }
]

const updateCanvas = async (code?: string) => {
  if (code) {
    currentCode = code;
  }
  
  if (shouldShowCanvas) {
    await syncManager.updateCanvasFromCode(currentCode);
  }
}

const shouldCanvasShowByFile = (file: any) => {
  if (!file?.path) {
    return false;
  }

  const normalizedPath = file.path.replace(/\\/g, '/');
  const isSvelteFile = file?.name?.toLowerCase().includes('.svelte');
  const pathParts = normalizedPath.split('/');
  const srcIndex = pathParts.indexOf('src');
  
  if (srcIndex === -1) {
    return false;
  }

  const pathAfterSrc = pathParts.slice(srcIndex + 1);
  const isInSpecialDir = pathAfterSrc.some(part => 
    ['components', 'pages', 'lib', 'routes'].includes(part)
  );
  const isRootSvelte = pathAfterSrc.length === 1;
  
  if (isSvelteFile && (isInSpecialDir || isRootSvelte)) {
    shouldShowCanvas = true;
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
    if (!customEvent.detail?.path) {
      return;
    }
    
    shouldCanvasShowByFile(customEvent.detail);
    activeFile.set(customEvent.detail);
    
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
        await syncManager.setActiveFile(customEvent.detail.path);
      }
      updateCanvas(content);
    } catch (error) {
      console.error('Failed to read file:', error);
    }
  }

  fileSelectedHandler = async (event: Event) => {
    const customEvent = event as CustomEvent;
    if (!customEvent.detail?.path) {
      return;
    }
    
    activeFile.set(customEvent.detail);
    shouldCanvasShowByFile(customEvent.detail);

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

  window.addEventListener('editorFileSelected', fileSelectedDirectHandler);
  window.addEventListener('fileSelected', fileSelectedHandler);

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

<div class="workbench">
  <div class="titlebar">
    <div class="titlebar-content">
      <div class="window-title">
        {#if projectPath}
          {projectPath.split('/').pop()} - WarpCode
        {:else}
          WarpCode
        {/if}
      </div>
      <div class="navigation">
        <button class="nav-button" title="Back">
          <ChevronLeft size={16} />
        </button>
        <button class="nav-button" title="Forward">
          <ChevronRight size={16} />
        </button>
      </div>
      <div class="global-search">
        <SearchBar on:search={handleGlobalSearch} />
      </div>
      <div class="panel-toggles">
        <button 
          class="toggle-button" 
          class:active={$layoutStore.isTerminalVisible}
          title="Toggle Terminal"
          on:click={() => layoutStore.toggleTerminal()}
        >
          <TerminalIcon size={16} />
        </button>
        {#if shouldShowCanvas}
          <button 
            class="toggle-button"
            class:active={$layoutStore.isCanvasVisible}
            title="Toggle UI Canvas"
            on:click={() => layoutStore.toggleCanvas()}
          >
            <Layout size={16} />
          </button>
        {/if}
        <button 
          class="toggle-button"
          class:active={$layoutStore.isEditorVisible}
          title="Toggle Editor"
          on:click={() => layoutStore.toggleEditor()}
        >
          <Edit3 size={16} />
        </button>
      </div>
    </div>
  </div>

  <div class="main">
    <div class="activitybar">
      <div class="top">
        <div 
          class="activity-item" 
          class:active={$panelStore.activePanel === 'explorer'}
          title="Explorer"
          on:click={() => panelStore.togglePanel('explorer')}
        >
          <Files size={24} />
        </div>
        <div 
          class="activity-item" 
          class:active={$panelStore.activePanel === 'search'}
          title="Search"
          on:click={() => panelStore.togglePanel('search')}
        >
          <Search size={24} />
        </div>
        <div 
          class="activity-item" 
          class:active={$panelStore.activePanel === 'sourceControl'}
          title="Source Control"
          on:click={() => panelStore.togglePanel('sourceControl')}
        >
          <GitBranch size={24} />
        </div>
        <div 
          class="activity-item" 
          class:active={$panelStore.activePanel === 'debug'}
          title="Run and Debug"
          on:click={() => panelStore.togglePanel('debug')}
        >
          <Bug size={24} />
        </div>
        <div 
          class="activity-item" 
          class:active={$panelStore.activePanel === 'extensions'}
          title="Extensions"
          on:click={() => panelStore.togglePanel('extensions')}
        >
          <Package size={24} />
        </div>
      </div>
      <div class="bottom">
        <div 
          class="activity-item" 
          class:active={$panelStore.activePanel === 'settings'}
          title="Settings"
          on:click={() => panelStore.togglePanel('settings')}
        >
          <Settings size={24} />
        </div>
      </div>
    </div>

    <HSplitPane
      leftPaneSize="{shouldShowCanvas ? '60%' : '100%'}"
      rightPaneSize="{shouldShowCanvas ? '40%' : '0%'}"
      minLeftPaneSize="250px"
      minRightPaneSize="0"
    >
      <left slot="left">
        <HSplitPane
          leftPaneSize="20%"
          rightPaneSize="80%"
          minLeftPaneSize="170px"
          minRightPaneSize="300px"
        >
          <left slot="left">
            {#if $panelStore.isVisible}
              {#if $panelStore.activePanel === 'explorer' && projectPath}
                <Explorer {projectPath} />
              {:else if $panelStore.activePanel === 'search'}
                <SearchPanel {projectPath} />
              {:else if $panelStore.activePanel === 'sourceControl'}
                <div class="panel-placeholder">Source Control Panel (Coming Soon)</div>
              {:else if $panelStore.activePanel === 'debug'}
                <div class="panel-placeholder">Debug Panel (Coming Soon)</div>
              {:else if $panelStore.activePanel === 'extensions'}
                <div class="panel-placeholder">Extensions Panel (Coming Soon)</div>
              {:else if $panelStore.activePanel === 'settings'}
                <div class="panel-placeholder">Settings Panel (Coming Soon)</div>
              {/if}
            {/if}
          </left>
          <right slot="right">
            <VSplitPane
              topPanelSize={$layoutStore.isEditorVisible ? "70%" : "0%"}
              downPanelSize={$layoutStore.isTerminalVisible ? "30%" : "0%"}
              minTopPaneSize={$layoutStore.isEditorVisible ? "100px" : "0"}
              minDownPaneSize={$layoutStore.isTerminalVisible ? "100px" : "0"}
            >
              <top slot="top">
                <div class="editor-container">
                  <Editor bind:lang="{lang}" bind:code="{currentCode}" onAction="{updateCanvas}" />
                </div>
              </top>
              <down slot="down">
                <div class="panel-container">
                  <OnlyTabs items="{consoleTabs}" add="{false}" on:message="{onConsoleTabUpdate}" />
                  <div class="panel-content">
                    {#if activeConsoleTab === 1}
                      <Terminal />
                    {:else if activeConsoleTab === 2}
                      <div class="panel-message">No problems found</div>
                    {:else if activeConsoleTab === 3}
                      <div class="panel-message">No output</div>
                    {:else}
                      <div class="panel-message">Debug console</div>
                    {/if}
                  </div>
                </div>
              </down>
            </VSplitPane>
          </right>
        </HSplitPane>
      </left>
      <right slot="right">
        {#if shouldShowCanvas}
          <HSplitPane
            leftPaneSize={$layoutStore.isCanvasVisible ? "60%" : "0%"}
            rightPaneSize={$layoutStore.isCanvasVisible ? "40%" : "100%"}
            minLeftPaneSize={$layoutStore.isCanvasVisible ? "300px" : "0"}
            minRightPaneSize="200px"
          >
            <left slot="left">
              <div class="canvas-container">
                <UICanvas bind:items={editorItems} on:action={handleCanvasAction} />
              </div>
            </left>
            <right slot="right">
              <div class="control-container">
                <OnlyTabs on:message="{onEditorTabUpdate}" items="{upControlTabs}" add="{false}" />
                <div class="control-content">
                  {#if activeEditorTab === 1}
                    <UIPallete />
                  {:else if activeEditorTab === 2}
                    <LayoutEditor />
                  {:else}
                    <StyleEditor />
                  {/if}
                </div>
              </div>
            </right>
          </HSplitPane>
        {/if}
      </right>
    </HSplitPane>
  </div>

  <footer class="statusbar">
    <div class="left">
      <span class="status-item">
        <Globe size={16} />
        WarpCode
      </span>
      <span class="status-item">
        <FileText size={16} />
        UTF-8
      </span>
    </div>
    <div class="right">
      <span class="status-item">
        <Code size={16} />
        {lang}
      </span>
      <span class="status-item">
        <Type size={16} />
        Spaces: 2
      </span>
      <span class="status-item">
        <AlignJustify size={16} />
        LF
      </span>
    </div>
  </footer>
</div>

<style>
  .workbench {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--warp-bg-main);
    color: var(--warp-text-primary);
  }

  .titlebar {
    height: calc(var(--warp-titlebar-height) + 16px);
    background-color: var(--warp-bg-black);
    color: var(--warp-text-primary);
    -webkit-app-region: drag;
    user-select: none;
    font-size: 12px;
    border-bottom: 1px solid var(--warp-border);
    padding: 8px 0;
  }

  .titlebar-content {
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 var(--warp-space-md);
    gap: var(--warp-space-md);
  }

  .window-title {
    font-weight: normal;
    min-width: 200px;
    color: var(--warp-text-secondary);
  }

  .navigation {
    display: flex;
    align-items: center;
    gap: var(--warp-space-sm);
    margin-right: var(--warp-space-md);
    -webkit-app-region: no-drag;
  }

  .nav-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 4px;
    border: none;
    background: none;
    color: var(--warp-text-secondary);
    cursor: pointer;
    transition: all var(--warp-transition-normal);
  }

  .nav-button:hover {
    background-color: var(--warp-hover);
    color: var(--warp-text-primary);
  }

  .global-search {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    -webkit-app-region: no-drag;
    padding: 0 200px;
  }

  .panel-toggles {
    display: flex;
    align-items: center;
    gap: var(--warp-space-sm);
    margin-left: var(--warp-space-md);
    -webkit-app-region: no-drag;
  }

  .toggle-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 4px;
    border: none;
    background: none;
    color: var(--warp-text-secondary);
    cursor: pointer;
    transition: all var(--warp-transition-normal);
  }

  .toggle-button:hover {
    background-color: var(--warp-hover);
    color: var(--warp-text-primary);
  }

  .toggle-button.active {
    color: var(--warp-accent);
  }

  .hidden {
    display: none;
  }

  .main {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .activitybar {
    width: var(--warp-activitybar-width);
    background-color: var(--warp-bg-black);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: var(--warp-space-sm) 0;
    z-index: var(--warp-z-base);
    border-right: 1px solid var(--warp-border);
  }

  .activity-item {
    width: var(--warp-activitybar-width);
    height: var(--warp-activitybar-width);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--warp-text-secondary);
    cursor: pointer;
    position: relative;
    transition: all var(--warp-transition-normal);
  }

  .activity-item:hover {
    color: var(--warp-text-primary);
    background-color: var(--warp-hover);
  }

  .activity-item.active {
    color: var(--warp-accent);
    background-color: var(--warp-bg-main);
  }

  .activity-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: var(--warp-accent);
    box-shadow: 0 0 8px var(--warp-accent);
  }

  .panel-placeholder {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--warp-text-secondary);
    font-style: italic;
    padding: var(--warp-space-md);
    background-color: var(--warp-bg-panel);
    border-right: 1px solid var(--warp-border);
  }

  .editor-container {
    height: 100%;
    background-color: var(--warp-bg-main);
  }

  .canvas-container {
    height: 100%;
    background-color: var(--warp-bg-main);
  }

  .panel-container {
    height: 100%;
    background-color: var(--warp-bg-main);
    border-top: 1px solid var(--warp-border);
  }

  .panel-content {
    height: calc(100% - var(--warp-header-height));
    overflow: auto;
  }

  .panel-message {
    padding: var(--warp-space-md);
    color: var(--warp-text-secondary);
    font-size: 13px;
  }

  .control-container {
    height: 100%;
    background-color: var(--warp-bg-panel);
    border-left: 1px solid var(--warp-border);
  }

  .control-content {
    height: calc(100% - var(--warp-header-height));
    overflow: auto;
  }

  .statusbar {
    height: 22px;
    background-color: var(--warp-bg-panel);
    color: var(--warp-text-primary);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0;
    font-size: 12px;
    border-top: 1px solid var(--warp-border);
  }

  .status-item {
    display: inline-flex;
    align-items: center;
    gap: var(--warp-space-xs);
    padding: 0 var(--warp-space-sm);
    height: 100%;
    border-right: 1px solid var(--warp-border);
    cursor: pointer;
    color: var(--warp-text-secondary);
    transition: all 0.2s ease;
  }

  .status-item:hover {
    background-color: var(--warp-hover);
    color: var(--warp-text-primary);
  }

  :global(.splitpane) {
    background-color: var(--warp-bg-main) !important;
  }

  :global(.splitpane-divider) {
    background-color: var(--warp-border) !important;
    border: none !important;
    transition: background-color 0.2s ease;
  }

  :global(.splitpane-divider:hover) {
    background-color: var(--warp-accent) !important;
  }

  :global(.splitpane-divider.horizontal) {
    height: 1px !important;
  }

  :global(.splitpane-divider.vertical) {
    width: 1px !important;
  }
</style>
