<script lang="ts">
  import { Router, Link, Route } from "svelte-routing";
  import Home from "./routes/Home.svelte";
  import About from "./routes/About.svelte";
  import Navbar from "./components/Navbar.svelte";

  export let url = "";
</script>

<Router {url}>
  <main>
    <Navbar />
    <div class="container">
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
    </div>
  </main>
</Router>

<style>
  :global(:root) {
    --primary-color: #64b5f6;
    --secondary-color: #81c784;
    --background-color: #1a1a1a;
    --surface-color: #2d2d2d;
    --text-color: #ffffff;
    --text-secondary: #aaaaaa;
    --border-color: rgba(255, 255, 255, 0.1);
    --glass-background: rgba(255, 255, 255, 0.05);
    --glass-border: rgba(255, 255, 255, 0.1);
  }

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: var(--background-color);
    color: var(--text-color);
    line-height: 1.5;
  }

  main {
    min-height: 100vh;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  :global(.glass) {
    background: var(--glass-background);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid var(--glass-border);
    border-radius: 0.5rem;
  }

  :global(.btn) {
    display: inline-block;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.25rem;
    font-size: 1rem;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  :global(.btn-primary) {
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
    color: white;
  }

  :global(.btn-primary:hover) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  :global(.card) {
    padding: 1.5rem;
    margin: 1rem 0;
  }

  :global(h1, h2, h3, h4, h5, h6) {
    margin: 0 0 1rem 0;
    font-weight: 600;
    line-height: 1.2;
  }

  :global(a) {
    color: var(--primary-color);
    text-decoration: none;
  }

  :global(a:hover) {
    text-decoration: underline;
  }
</style>
