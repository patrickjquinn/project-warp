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
	let currentPid: number | null = null
	let unlisten: (() => void) | null = null
	let isReady = false
	let pendingCommands: string[] = []

	const MODERN_DARK: xterm.ITheme = {
		foreground: '#fffff',
		background: '#1e1e1e',
		black: '#073642',
		blue: '#268bd2',
		cyan: '#2aa198',
		green: '#859900',
		magenta: '#d33682',
		red: '#dc322f',
		white: '#eee8d5',
		yellow: '#b58900',
		brightBlack: '#002b36',
		brightBlue: '#839496',
		brightCyan: '#93a1a1',
		brightGreen: '#586e75',
		brightMagenta: '#6c71c4',
		brightRed: '#cb4b16',
		brightWhite: '#fdf6e3',
		brightYellow: '#657b83'
	}

	let theme: xterm.ITheme = MODERN_DARK
	let bgColor = '#1e1e1e'

	$: {
		if (terminalController) {
			bgColor = theme.background
			handleTermResize()
		}
	}

	async function setupTerminalOutput() {
		try {
			// Listen for terminal output events
			unlisten = await listen('terminal-output', (event) => {
				const { pid, data } = event.payload as { pid: number; data: string }
				if (pid === currentPid) {
					terminalController.write(data)
				}
			})
		} catch (error) {
			console.error('Failed to setup terminal output:', error)
			terminalController.write('\x1b[31mFailed to setup terminal output\x1b[m\r\n')
		}
	}

	async function writeToTerminal(data: string) {
		if (!currentPid) {
			pendingCommands.push(data)
			return
		}

		try {
			await invoke('write_to_terminal', {
				pid: currentPid,
				data
			})
		} catch (error) {
			console.error('Failed to write to terminal:', error)
			terminalController.write('\x1b[31mError writing to terminal\x1b[m\r\n')
		}
	}

	async function initializeTerminal() {
		try {
			terminalController = new xterm.Terminal({
				fontFamily: 'Fira Code, Iosevka, monospace',
				fontSize: 12,
				logLevel: 'debug',
				theme,
				allowProposedApi: true,
				scrollback: 5000,
				cursorBlink: true,
				cursorStyle: 'block',
				windowsMode: false,
				convertEol: true,
			})

			termFit = new fit.FitAddon()
			terminalController.loadAddon(termFit)
			terminalController.open(terminalElement)
			termFit.fit()

			terminalController.write('\x1b[32mWelcome to Warp Code!\x1b[m\r\n')

			// Create terminal session
			currentPid = await invoke('create_terminal_session')
			await setupTerminalOutput()
			
			// Handle terminal input
			terminalController.onData(writeToTerminal)
			
			// Process any pending commands
			isReady = true
			while (pendingCommands.length > 0) {
				const cmd = pendingCommands.shift()
				if (cmd) await writeToTerminal(cmd)
			}
		} catch (error) {
			console.error('Failed to initialize terminal:', error)
			if (terminalController) {
				terminalController.write('\x1b[31mFailed to initialize terminal\x1b[m\r\n')
			}
		}
	}

	function handleTermResize() {
		if (termFit && terminalController) {
			try {
				const dimensions = termFit.proposeDimensions()
				if (dimensions) {
					terminalController.resize(dimensions.cols, dimensions.rows)
					// TODO: Send new dimensions to backend when implemented
				}
			} catch (error) {
				console.error('Failed to resize terminal:', error)
			}
		}
	}

	onMount(async () => {
		await initializeTerminal()
	})

	onDestroy(async () => {
		if (unlisten) {
			unlisten()
		}
		if (currentPid) {
			try {
				await invoke('kill_terminal_session', { pid: currentPid })
			} catch (error) {
				console.error('Failed to kill terminal session:', error)
			}
		}
		if (terminalController) {
			terminalController.dispose()
		}
	})
</script>

<div id="terminal" bind:this={terminalElement} use:watchResize={handleTermResize} />

<svelte:window on:resize={handleTermResize} />

<style>
	:global(.terminal) {
		height: 100%;
		width: 100%;
	}

	:global(.terminal .xterm-viewport) {
		height: 100% !important;
		padding: 10px;
	}

	#terminal {
		margin: 0;
		height: 100%;
		width: 100%;
	}
</style>
