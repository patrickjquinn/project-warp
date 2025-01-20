<script lang="ts">
	import AppBuilder from './views/AppBuilder.svelte'
	import Launcher from './views/Launcher.svelte'
	import Router from 'svelte-spa-router'

	const routes = {
		'/': Launcher,
		'/editor': AppBuilder,
		'*': Launcher // Catch-all route
	}
</script>

<Router {routes} />

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
			'Open Sans', 'Helvetica Neue', sans-serif;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}

	:global(#routify-app) {
		width: 100%;
		height: 100%;
	}
</style>
