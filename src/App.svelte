<script lang="ts">
	import './styles/app.css'
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
	:global(#routify-app) {
		width: 100%;
		height: 100%;
	}
</style>
