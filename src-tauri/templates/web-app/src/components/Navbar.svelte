<script lang="ts">
  import { Link } from "svelte-routing";
</script>

<nav class="navbar glass">
  <div class="container">
    <Link to="/" class="brand">MyApp</Link>
    <div class="nav-links">
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
    </div>
  </div>
</nav>

<style>
  .navbar {
    padding: 1rem 0;
    margin-bottom: 2rem;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .brand {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--text-color);
    text-decoration: none;
  }

  .nav-links {
    display: flex;
    gap: 2rem;
  }

  .nav-links :global(a) {
    color: var(--text-color);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .nav-links :global(a:hover) {
    color: var(--primary-color);
    text-decoration: none;
  }
</style>
