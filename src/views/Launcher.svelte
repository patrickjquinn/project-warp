<script lang="ts">
	import { onMount } from 'svelte'
	import { invoke } from '@tauri-apps/api/core'
	import { listen } from '@tauri-apps/api/event'
	import { open } from '@tauri-apps/plugin-dialog'
	import type { RecentProject, Template } from '../types/launcher'

	let recentProjects: RecentProject[] = []
	let templates: Template[] = [
		{
			name: 'Web Application',
			description: 'Modern web app with Svelte and TailwindCSS',
			icon: '🌐',
			template: 'web-app'
		}
	]
	let isCreating = false
	let projectName = ''
	let selectedTemplate: Template | null = null
	let projectPath = ''
	let loadingMessage = ''

	async function loadRecentProjects() {
		try {
			const projects = await invoke<RecentProject[]>('get_recent_projects')
			recentProjects = projects
		} catch (error) {
			console.error('Failed to load recent projects:', error)
		}
	}

	async function createProject() {
		if (!projectName || !selectedTemplate || !projectPath) return

		isCreating = true
		loadingMessage = 'Creating project...'

		try {
			await invoke('create_project', {
				name: projectName,
				template: selectedTemplate.template,
				path: projectPath
			})

			loadingMessage = 'Opening project...'
			const fullPath = `${projectPath}/${projectName}`
			await invoke('open_project', { path: fullPath })
		} catch (error) {
			console.error('Failed to create project:', error)
			loadingMessage = `Error: ${error instanceof Error ? error.message : String(error)}`
		} finally {
			isCreating = false
		}
	}

	async function openProject(path: string) {
		try {
			loadingMessage = 'Opening project...'
			await invoke('open_project', { path })
		} catch (error) {
			console.error('Failed to open project:', error)
			loadingMessage = `Error: ${error instanceof Error ? error.message : String(error)}`
		}
	}

	async function selectProjectPath() {
		try {
			const selected = await open({
				directory: true,
				multiple: false,
				defaultPath: projectPath || undefined
			})
			if (selected) {
				projectPath = selected as string
			}
		} catch (error) {
			console.error('Failed to select path:', error)
		}
	}

	onMount(loadRecentProjects)
</script>

<main>
	<div class="launcher">
		<header>
			<h1>WarpCode</h1>
			<p>Build beautiful applications with ease</p>
		</header>

		<div class="content">
			<section class="recent-projects">
				<h2>Recent Projects</h2>
				{#if recentProjects.length > 0}
					<div class="project-list">
						{#each recentProjects as project}
							<div class="project-item-container">
								<button
									class="project-item"
									on:click={() => openProject(project.path)}
								>
									<span class="project-icon">📁</span>
									<div class="project-info">
										<h3>{project.name}</h3>
										<p>{project.path}</p>
									</div>
									<span class="project-time">{new Date(project.last_opened).toLocaleDateString()}</span>
								</button>
								<button
									class="remove-button"
									on:click|stopPropagation={async () => {
										try {
											await invoke('remove_recent_project', { path: project.path });
											await loadRecentProjects();
										} catch (error) {
											console.error('Failed to remove project:', error);
										}
									}}
								>
									✕
								</button>
							</div>
						{/each}
					</div>
				{:else}
					<p class="no-projects">No recent projects</p>
				{/if}
			</section>

			<section class="create-project">
				<h2>Create New Project</h2>
				<div class="templates">
					{#each templates as template}
						<button
							class="template-item"
							class:selected={selectedTemplate === template}
							on:click={() => selectedTemplate = template}
						>
							<span class="template-icon">{template.icon}</span>
							<div class="template-info">
								<h3>{template.name}</h3>
								<p>{template.description}</p>
							</div>
						</button>
					{/each}
				</div>

				{#if selectedTemplate}
					<div class="project-form">
						<div class="form-group">
							<label for="projectName">Project Name</label>
							<input
								type="text"
								id="projectName"
								bind:value={projectName}
								placeholder="my-awesome-project"
							/>
						</div>

						<div class="form-group">
							<label for="projectPath">Location</label>
							<div class="path-input">
								<input
									type="text"
									id="projectPath"
									bind:value={projectPath}
									placeholder="Select project location"
									readonly
								/>
								<button on:click={selectProjectPath}>Browse</button>
							</div>
						</div>

						<button
							class="create-button"
							disabled={!projectName || !projectPath || isCreating}
							on:click={createProject}
						>
							{#if isCreating}
								<span class="loading"></span>
								{loadingMessage}
							{:else}
								Create Project
							{/if}
						</button>
					</div>
				{/if}
			</section>
		</div>
	</div>
</main>

<style>
	main {
		height: 100vh;
		background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
		color: #ffffff;
		padding: 2rem;
		overflow-y: auto;
	}

	.launcher {
		max-width: 1200px;
		margin: 0 auto;
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		background-clip: padding-box;
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	header {
		text-align: center;
		margin-bottom: 3rem;
	}

	h1 {
		font-size: 2.5rem;
		margin: 0;
		background: linear-gradient(45deg, #64b5f6, #81c784);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	header p {
		color: #aaaaaa;
		margin: 0.5rem 0 0;
	}

	.content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}

	section {
		background: rgba(255, 255, 255, 0.03);
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	h2 {
		margin: 0 0 1.5rem;
		font-size: 1.2rem;
		color: #cccccc;
	}

	.project-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.project-item-container {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.project-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
		flex: 1;
		color: inherit;
		text-align: left;
	}

	.project-item:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: translateY(-2px);
	}

	.remove-button {
		padding: 0.5rem;
		background: rgba(255, 0, 0, 0.2);
		border: 1px solid rgba(255, 0, 0, 0.3);
		border-radius: 0.25rem;
		color: #ff6b6b;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.8rem;
		line-height: 1;
	}

	.remove-button:hover {
		background: rgba(255, 0, 0, 0.3);
		transform: scale(1.1);
	}

	.project-info {
		flex: 1;
	}

	.project-info h3 {
		margin: 0;
		font-size: 1rem;
	}

	.project-info p {
		margin: 0.2rem 0 0;
		font-size: 0.8rem;
		color: #888888;
	}

	.templates {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.template-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
		width: 100%;
		color: inherit;
		text-align: left;
	}

	.template-item:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.template-item.selected {
		background: rgba(100, 181, 246, 0.2);
		border-color: #64b5f6;
	}

	.template-icon {
		font-size: 1.5rem;
	}

	.template-info h3 {
		margin: 0;
		font-size: 1rem;
	}

	.template-info p {
		margin: 0.2rem 0 0;
		font-size: 0.8rem;
		color: #888888;
	}

	.project-form {
		margin-top: 2rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: #cccccc;
	}

	input {
		width: 100%;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.25rem;
		color: #ffffff;
	}

	.path-input {
		display: flex;
		gap: 0.5rem;
	}

	.path-input button {
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.25rem;
		color: #ffffff;
		cursor: pointer;
	}

	.create-button {
		width: 100%;
		padding: 0.75rem;
		background: linear-gradient(45deg, #64b5f6, #81c784);
		border: none;
		border-radius: 0.25rem;
		color: #ffffff;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
	}

	.create-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.loading {
		display: inline-block;
		width: 1rem;
		height: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		border-top-color: #ffffff;
		animation: spin 1s linear infinite;
		margin-right: 0.5rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.no-projects {
		text-align: center;
		color: #888888;
		padding: 2rem;
	}
</style>
