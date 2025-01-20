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

	// Auto-save delay in milliseconds
	const AUTO_SAVE_DELAY = 1000

	interface LanguageConfig {
		name: string;
		extensions: string[];
		aliases: string[];
	}

	const languageConfig: Record<string, LanguageConfig> = {
		svelte: {
			name: 'html', // Using HTML mode for Svelte until we add proper Svelte support
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
			// Check if the editor is focused
			if (editor.hasWidgetFocus()) {
				// Let the user edit with no interference
			} else {
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
		// First check if it's a direct match
		if (languageConfig[lang]) {
			return languageConfig[lang].name
		}

		// Then check aliases
		for (const [key, config] of Object.entries(languageConfig)) {
			if (config.aliases.includes(lang.toLowerCase())) {
				return config.name
			}
		}

		// Default to plaintext if no match found
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
		// Setup code update listener
		codeUpdateHandler = (event: Event) => {
			const customEvent = event as CustomEvent;
			if (customEvent.detail.content !== code) {
				code = customEvent.detail.content;
				updateEditorValue();
			}
		};
		window.addEventListener('codeUpdated', codeUpdateHandler);

		// Setup Monaco workers
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

		const editorOptions: monacoEditor.editor.IStandaloneEditorConstructionOptions = {
			value: code,
			language: lang,
			theme: 'vs-dark',
			automaticLayout: true,
			formatOnPaste: true,
			formatOnType: true,
			tabSize: 2,
			minimap: {
				enabled: false
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
			bracketPairColorization: {
				enabled: true
			},
			guides: {
				bracketPairs: 'active',
				indentation: true,
				highlightActiveIndentation: true
			},
			fontFamily: 'Fira Code, monospace',
			fontSize: 14,
			lineHeight: 1.5,
			padding: {
				top: 10,
				bottom: 10
			}
		}

		// Configure Monaco editor
		editor = Monaco.editor.create(divEl, editorOptions)

		// Setup keyboard shortcuts
		editor.addCommand(Monaco.KeyMod.CtrlCmd | Monaco.KeyCode.KeyS, () => {
			const currentValue = editor.getValue()
			if (currentValue !== code) {
				code = currentValue
				dispatch('save')
			}
		})

		// Setup content change handler
		editor.onDidChangeModelContent((e) => {
			if (e.isFlush) {
				// true if setValue call
				/* editor.setValue(code); */
			} else {
				// User input
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
		background-color: #1e1e1e !important;
	}

	:global(.monaco-editor .monaco-scrollable-element) {
		box-shadow: none !important;
	}

	:global(.monaco-editor) {
		padding: 0.5rem;
	}
</style>
