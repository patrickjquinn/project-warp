<script lang="ts">
	import type * as monacoEditor from 'monaco-editor'
	import { onMount, onDestroy, createEventDispatcher } from 'svelte'
	import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
	import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
	import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
	import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
	import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
	import activeFile from '../stores/activeFile'

	const dispatch = createEventDispatcher()

	let divEl: HTMLDivElement
	let editor: monacoEditor.editor.IStandaloneCodeEditor
	let Monaco: typeof monacoEditor
	let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

	export let code: string
	export let lang: string

	const AUTO_SAVE_DELAY = 1000

	interface LanguageConfig {
		name: string;
		extensions: string[];
		aliases: string[];
	}

	const languageConfig: Record<string, LanguageConfig> = {
		svelte: {
			name: 'html',
			extensions: ['.svelte'],
			aliases: ['Svelte', 'svelte']
		},
		typescript: {
			name: 'typescript',
			extensions: ['.ts', '.tsx'],
			aliases: ['TypeScript', 'ts', 'typescript']
		},
		javascript: {
			name: 'javascript',
			extensions: ['.js', '.jsx'],
			aliases: ['JavaScript', 'js', 'javascript']
		},
		html: {
			name: 'html',
			extensions: ['.html', '.htm'],
			aliases: ['HTML', 'html']
		},
		css: {
			name: 'css',
			extensions: ['.css', '.scss', '.sass', '.less'],
			aliases: ['CSS', 'css', 'scss', 'sass', 'less']
		},
		json: {
			name: 'json',
			extensions: ['.json'],
			aliases: ['JSON', 'json']
		},
		markdown: {
			name: 'markdown',
			extensions: ['.md', '.markdown'],
			aliases: ['Markdown', 'md', 'markdown']
		},
		yaml: {
			name: 'yaml',
			extensions: ['.yml', '.yaml'],
			aliases: ['YAML', 'yaml', 'yml']
		},
		rust: {
			name: 'rust',
			extensions: ['.rs'],
			aliases: ['Rust', 'rust']
		},
		python: {
			name: 'python',
			extensions: ['.py'],
			aliases: ['Python', 'python', 'py']
		},
		xml: {
			name: 'xml',
			extensions: ['.xml'],
			aliases: ['XML', 'xml']
		},
		shell: {
			name: 'shell',
			extensions: ['.sh', '.bash'],
			aliases: ['Shell', 'shell', 'bash']
		},
		plaintext: {
			name: 'plaintext',
			extensions: [],
			aliases: ['Plain Text', 'text', 'txt', 'plaintext']
		}
	}

	function setupAutoSave() {
		if (autoSaveTimer) {
			clearTimeout(autoSaveTimer)
		}

		autoSaveTimer = setTimeout(() => {
			const currentValue = editor?.getValue()
			if (currentValue && currentValue !== code) {
				code = currentValue
				dispatch('save')
			}
		}, AUTO_SAVE_DELAY)
	}

	function updateEditorValue() {
		if (editor) {
			if (!editor.hasWidgetFocus()) {
				if (editor.getValue() !== code) {
					const position = editor.getPosition()
					editor.setValue(code)
					editor.setPosition(position || { lineNumber: 1, column: 1 })
					editor.trigger('anyString', 'editor.action.formatDocument', null)
				}
			}
		}
	}

	function getMonacoLanguage(lang: string): string {
		if (languageConfig[lang]) {
			return languageConfig[lang].name
		}

		for (const [key, config] of Object.entries(languageConfig)) {
			if (config.aliases.includes(lang.toLowerCase())) {
				return config.name
			}
		}

		return 'plaintext'
	}

	$: {
		if (code) {
			updateEditorValue()
		}
		if (code === '') {
			editor?.setValue(' ')
		}
	}

	$: {
		if (editor && lang) {
			const monacoLang = getMonacoLanguage(lang)
			Monaco?.editor.setModelLanguage(editor.getModel()!, monacoLang)
		}
	}

	let codeUpdateHandler: ((event: Event) => void) | null = null;

	onMount(async () => {
		codeUpdateHandler = (event: Event) => {
			const customEvent = event as CustomEvent;
			if (customEvent.detail.content !== code) {
				code = customEvent.detail.content;
				updateEditorValue();
			}
		};
		window.addEventListener('codeUpdated', codeUpdateHandler);

		self.MonacoEnvironment = {
			getWorker(_: any, label: string) {
				if (label === 'json') {
					return new jsonWorker()
				}
				if (label === 'css' || label === 'scss' || label === 'less') {
					return new cssWorker()
				}
				if (label === 'html' || label === 'svelte' || label === 'handlebars') {
					return new htmlWorker()
				}
				if (label === 'typescript' || label === 'javascript') {
					return new tsWorker()
				}
				return new editorWorker()
			}
		}

		const monaco = await import('monaco-editor')
		Monaco = monaco

		// Define WarpCode theme
		Monaco.editor.defineTheme('warpcode-dark', {
			base: 'vs-dark',
			inherit: true,
			rules: [
				{ token: 'comment', foreground: '666668', fontStyle: 'italic' },
				{ token: 'string', foreground: '4CD964' },
				{ token: 'keyword', foreground: '6E44FF' },
				{ token: 'number', foreground: 'FFD93D' },
				{ token: 'operator', foreground: 'E1E1E6' },
				{ token: 'type', foreground: '44DDFF' },
				{ token: 'class', foreground: '44DDFF' },
				{ token: 'function', foreground: 'FF44B4' },
				{ token: 'variable', foreground: 'E1E1E6' },
				{ token: 'parameter', foreground: 'E1E1E6' }
			],
			colors: {
				'editor.background': '#1A1A1D',
				'editor.foreground': '#E1E1E6',
				'editor.lineHighlightBackground': '#242428',
				'editor.selectionBackground': '#6E44FF33',
				'editor.inactiveSelectionBackground': '#6E44FF19',
				'editorLineNumber.foreground': '#666668',
				'editorLineNumber.activeForeground': '#E1E1E6',
				'editorCursor.foreground': '#6E44FF',
				'editorWhitespace.foreground': '#2A2A2E',
				'editorIndentGuide.background': '#2A2A2E',
				'editorIndentGuide.activeBackground': '#333337',
				'editor.selectionHighlightBackground': '#6E44FF19',
				'editor.wordHighlightBackground': '#6E44FF19',
				'editor.wordHighlightStrongBackground': '#6E44FF33',
				'editorBracketMatch.background': '#6E44FF19',
				'editorBracketMatch.border': '#6E44FF'
			}
		})

		const editorOptions: monacoEditor.editor.IStandaloneEditorConstructionOptions = {
			value: code,
			language: lang,
			theme: 'warpcode-dark',
			automaticLayout: true,
			formatOnPaste: true,
			formatOnType: true,
			tabSize: 2,
			minimap: {
				enabled: true,
				scale: 2,
				showSlider: 'mouseover',
				renderCharacters: false,
				maxColumn: 120
			},
			scrollBeyondLastLine: false,
			smoothScrolling: true,
			cursorBlinking: 'smooth',
			cursorSmoothCaretAnimation: 'on',
			mouseWheelZoom: true,
			quickSuggestions: {
				other: true,
				comments: true,
				strings: true
			},
			snippetSuggestions: 'top',
			suggestOnTriggerCharacters: true,
			wordBasedSuggestions: 'allDocuments',
			lineNumbers: 'on',
			renderWhitespace: 'selection',
			guides: {
				bracketPairs: 'active',
				indentation: true,
				highlightActiveIndentation: true,
				bracketPairsHorizontal: 'active'
			},
			fontFamily: 'Consolas, "Courier New", monospace',
			fontSize: 13,
			lineHeight: 1.5,
			padding: {
				top: 4,
				bottom: 4
			},
			scrollbar: {
				vertical: 'visible',
				horizontal: 'visible',
				verticalScrollbarSize: 14,
				horizontalScrollbarSize: 14,
				verticalHasArrows: false,
				horizontalHasArrows: false,
				useShadows: true
			},
			overviewRulerBorder: false,
			overviewRulerLanes: 0,
			hideCursorInOverviewRuler: true,
			renderLineHighlight: 'line',
			roundedSelection: true,
			selectOnLineNumbers: true,
			selectionHighlight: true,
			occurrencesHighlight: 'singleFile',
			colorDecorators: true,
			folding: true,
			foldingStrategy: 'auto',
			showFoldingControls: 'mouseover',
			matchBrackets: 'always',
			find: {
				addExtraSpaceOnTop: false,
				autoFindInSelection: 'never',
				seedSearchStringFromSelection: 'always'
			},
			links: true,
			mouseWheelScrollSensitivity: 1,
			multiCursorModifier: 'alt',
			accessibilitySupport: 'off',
			dragAndDrop: false,
			gotoLocation: {
				multipleDeclarations: 'peek',
				multipleDefinitions: 'peek',
				multipleImplementations: 'peek',
				multipleReferences: 'peek',
				multipleTypeDefinitions: 'peek'
			}
		}

		editor = Monaco.editor.create(divEl, editorOptions)

		editor.addCommand(Monaco.KeyMod.CtrlCmd | Monaco.KeyCode.KeyS, () => {
			const currentValue = editor.getValue()
			if (currentValue !== code) {
				code = currentValue
				dispatch('save')
			}
		})

		editor.onDidChangeModelContent((e) => {
			if (!e.isFlush) {
				const updatedValue = editor?.getValue() ?? ' '
				if (updatedValue !== code) {
					code = updatedValue
					setupAutoSave()
				}
			}
		})
	})

	onDestroy(() => {
		if (autoSaveTimer) {
			clearTimeout(autoSaveTimer)
		}
		if (editor) {
			editor.dispose()
		}
		if (codeUpdateHandler) {
			window.removeEventListener('codeUpdated', codeUpdateHandler)
		}
	})
</script>

<div bind:this={divEl} class="monaco-container" />

<style>
	.monaco-container {
		width: 100%;
		height: 100%;
		min-height: 50px;
		overflow: hidden;
	}

	:global(.monaco-editor .margin) {
		background-color: var(--warp-bg-main) !important;
	}

	:global(.monaco-editor .monaco-scrollable-element) {
		box-shadow: none !important;
	}

	:global(.monaco-editor .scrollbar) {
		background-color: transparent !important;
	}

	:global(.monaco-editor .scrollbar .slider) {
		background-color: var(--warp-border) !important;
		border-radius: 5px !important;
		transition: background-color 0.2s ease !important;
	}

	:global(.monaco-editor .scrollbar .slider:hover) {
		background-color: var(--warp-border-light) !important;
	}

	:global(.monaco-editor .scrollbar .slider:active) {
		background-color: var(--warp-text-secondary) !important;
	}

	:global(.monaco-editor .minimap) {
		box-shadow: -1px 0 0 var(--warp-border) !important;
	}

	:global(.monaco-editor .minimap-slider) {
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	:global(.monaco-editor:hover .minimap-slider) {
		opacity: 1;
	}

	:global(.monaco-editor .cursors-layer .cursor) {
		transition: all 80ms ease;
	}

	:global(.monaco-editor .line-numbers) {
		font-family: Consolas, "Courier New", monospace !important;
		font-size: 13px !important;
		line-height: 1.5 !important;
		color: var(--warp-text-secondary) !important;
	}

	:global(.monaco-editor .current-line) {
		border: none !important;
		background-color: var(--warp-hover) !important;
	}

	:global(.monaco-editor .view-overlays .current-line) {
		border: none !important;
	}

	:global(.monaco-editor .margin-view-overlays .current-line-margin) {
		border: none !important;
	}

	:global(.monaco-editor .suggest-widget) {
		background-color: var(--warp-bg-panel) !important;
		border: 1px solid var(--warp-border) !important;
		border-radius: 4px !important;
	}

	:global(.monaco-editor .suggest-widget .monaco-list .monaco-list-row.focused) {
		background-color: var(--warp-hover) !important;
	}

	:global(.monaco-editor .suggest-widget .monaco-list .monaco-list-row:hover) {
		background-color: var(--warp-hover) !important;
	}
</style>
