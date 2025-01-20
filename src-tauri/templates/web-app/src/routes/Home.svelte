<script lang="ts">
  let greeting = "Welcome to MyApp";
</script>

<div class="home">
  <section class="hero glass">
    <h1>{greeting}</h1>
    <p>A modern web application template with a clean, minimal design.</p>
    <button class="btn btn-primary">Get Started</button>
  </section>

  <section class="features">
    <div class="feature-grid">
      <div class="feature glass">
        <h3>Simple</h3>
        <p>Clean, minimal design with vanilla CSS.</p>
      </div>
      <div class="feature glass">
        <h3>Fast</h3>
        <p>Built with Svelte for optimal performance.</p>
      </div>
      <div class="feature glass">
        <h3>Modern</h3>
        <p>Using the latest web technologies.</p>
      </div>
      <div class="feature glass">
        <h3>Responsive</h3>
        <p>Looks great on all devices.</p>
      </div>
    </div>
  </section>
</div>

<style>
  .home {
    padding: 2rem 0;
  }

  .hero {
    text-align: center;
    padding: 4rem 2rem;
    margin-bottom: 4rem;
  }

  .hero h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .hero p {
    font-size: 1.2rem;
    color: var(--text-secondary);
    margin-bottom: 2rem;
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
  }

  .feature {
    padding: 2rem;
    text-align: center;
    transition: transform 0.2s ease;
  }

  .feature:hover {
    transform: translateY(-5px);
  }

  .feature h3 {
    color: var(--primary-color);
    margin-bottom: 1rem;
  }

  .feature p {
    color: var(--text-secondary);
  }

  @media (max-width: 768px) {
    .hero h1 {
      font-size: 2rem;
    }

    .hero p {
      font-size: 1rem;
    }
  }
</style>
