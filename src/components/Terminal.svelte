<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import 'xterm/css/xterm.css'
	import * as xterm from 'xterm'
	import './xterm.css'
	import * as fit from 'xterm-addon-fit'
	import { watchResize } from 'svelte-watch-resize'
	import { invoke } from '@tauri-apps/api/core'
	import { listen } from '@tauri-apps/api/event'

	let terminalElement: HTMLElement
	let terminalController: xterm.Terminal
	let termFit: fit.FitAddon
	let unlisten: (() => void) | null = null

	const WARP_THEME: xterm.ITheme = {
		foreground: '#E1E1E6', // warp-text-primary
		background: '#1A1A1D', // warp-bg-main
		cursor: '#6E44FF',    // warp-accent
		cursorAccent: '#1A1A1D',
		black: '#1A1A1D',
		red: '#FF6B6B',
		green: '#4CD964',
		yellow: '#FFD93D',
		blue: '#6E44FF',
		magenta: '#FF44B4',
		cyan: '#44DDFF',
		white: '#E1E1E6',
		brightBlack: '#666668', // warp-text-disabled
		brightRed: '#FF8585',
		brightGreen: '#66FF7F',
		brightYellow: '#FFE156',
		brightBlue: '#7E5AFF',
		brightMagenta: '#FF5AC8',
		brightCyan: '#5AE6FF',
		brightWhite: '#FFFFFF'
	}

	let theme: xterm.ITheme = WARP_THEME
	let bgColor = theme.background

	$: {
		if (terminalController) {
			bgColor = theme.background
			handleTermResize()
		}
	}

	// Write data from the terminal to the pty
	async function writeToPty(data: string) {
		try {
			await invoke('async_write_to_pty', { data })
		} catch (error) {
			console.error('Failed to write to pty:', error)
			terminalController.write('\x1b[31mError writing to terminal\x1b[m\r\n')
		}
	}

	// Write data from pty to the terminal
	async function writeToTerminal(data: string) {
		return new Promise<void>((resolve) => {
			terminalController.write(data, () => resolve())
		})
	}

	async function initializeTerminal() {
		try {
			terminalController = new xterm.Terminal({
				fontFamily: 'Consolas, "Courier New", monospace',
				fontSize: 13,
				lineHeight: 1.2,
				letterSpacing: 0,
				theme,
				allowProposedApi: true,
				scrollback: 1000,
				cursorBlink: true,
				cursorStyle: 'block',
				windowsMode: false,
				convertEol: true,
				minimumContrastRatio: 4.5,
				drawBoldTextInBrightColors: true
			})

			termFit = new fit.FitAddon()
			terminalController.loadAddon(termFit)
			terminalController.open(terminalElement)
			termFit.fit()

			terminalController.write('\x1b[32mWelcome to WarpCode Terminal\x1b[m\r\n\r\n')

			// Initialize shell and handle terminal data
			await invoke('async_create_shell').catch((error) => {
				console.error('Error creating shell:', error)
			})

			terminalController.onData(writeToPty)
			
			// Set up continuous reading from PTY
			async function readFromPty() {
				try {
					const data = await invoke<string>('async_read_from_pty')
					if (data) {
						await writeToTerminal(data)
					}
					window.requestAnimationFrame(readFromPty)
				} catch (error) {
					console.error('Failed to read from pty:', error)
					window.requestAnimationFrame(readFromPty)
				}
			}
			window.requestAnimationFrame(readFromPty)

		} catch (error) {
			console.error('Failed to initialize terminal:', error)
			if (terminalController) {
				terminalController.write('\x1b[31mFailed to initialize terminal\x1b[m\r\n')
			}
		}
	}

	async function handleTermResize() {
		if (termFit && terminalController) {
			try {
				termFit.fit()
				await invoke('async_resize_pty', {
					rows: terminalController.rows,
					cols: terminalController.cols,
				})
			} catch (error) {
				console.error('Failed to resize terminal:', error)
			}
		}
	}

	onMount(async () => {
		await initializeTerminal()
	})

	onDestroy(() => {
		if (terminalController) {
			terminalController.dispose()
		}
	})
</script>

<div class="terminal-container">
	<div id="terminal" bind:this={terminalElement} use:watchResize={handleTermResize} />
</div>

<svelte:window on:resize={handleTermResize} />

<style>
	.terminal-container {
		height: 100%;
		width: 100%;
		background-color: var(--warp-bg-main);
		padding: var(--warp-space-xs) 0;
	}

	#terminal {
		height: 100%;
		width: 100%;
	}

	:global(.terminal) {
		padding: 0 var(--warp-space-md);
	}

	:global(.terminal .xterm-viewport) {
		scrollbar-width: thin;
		scrollbar-color: var(--warp-border) transparent;
	}

	:global(.terminal .xterm-viewport::-webkit-scrollbar) {
		width: 10px;
	}

	:global(.terminal .xterm-viewport::-webkit-scrollbar-track) {
		background: transparent;
	}

	:global(.terminal .xterm-viewport::-webkit-scrollbar-thumb) {
		background-color: var(--warp-border);
		border: 2px solid var(--warp-bg-main);
		border-radius: 5px;
	}

	:global(.terminal .xterm-viewport::-webkit-scrollbar-thumb:hover) {
		background-color: var(--warp-border-light);
	}

	:global(.terminal .xterm-viewport::-webkit-scrollbar-thumb:active) {
		background-color: var(--warp-text-secondary);
	}

	:global(.terminal .xterm-screen) {
		padding: 0;
	}

	:global(.terminal .xterm-rows) {
		padding: var(--warp-space-xs) 0;
	}

	:global(.terminal .xterm-selection div) {
		background-color: var(--warp-accent-transparent) !important;
		opacity: 1 !important;
		position: absolute;
	}

	:global(.terminal:focus .xterm-cursor) {
		background-color: var(--warp-accent) !important;
		color: var(--warp-bg-main) !important;
	}
</style>
