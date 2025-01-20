<script lang="ts">
  const teamMembers = [
    {
      name: "Jane Doe",
      role: "Developer",
      bio: "Full-stack developer with a passion for clean code."
    },
    {
      name: "John Smith",
      role: "Designer",
      bio: "UI/UX designer focused on creating beautiful experiences."
    }
  ];
</script>

<div class="about">
  <section class="intro glass">
    <h1>About Us</h1>
    <p>We're a team of passionate developers and designers building amazing web applications.</p>
  </section>

  <section class="team">
    <h2>Our Team</h2>
    <div class="team-grid">
      {#each teamMembers as member}
        <div class="team-member glass">
          <div class="member-avatar"></div>
          <h3>{member.name}</h3>
          <span class="role">{member.role}</span>
          <p>{member.bio}</p>
        </div>
      {/each}
    </div>
  </section>

  <section class="contact glass">
    <h2>Get in Touch</h2>
    <p>Have questions? We'd love to hear from you.</p>
    <button class="btn btn-primary">Contact Us</button>
  </section>
</div>

<style>
  .about {
    padding: 2rem 0;
  }

  .intro {
    text-align: center;
    padding: 3rem 2rem;
    margin-bottom: 4rem;
  }

  .intro h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .intro p {
    font-size: 1.2rem;
    color: var(--text-secondary);
  }

  .team {
    margin-bottom: 4rem;
  }

  .team h2 {
    text-align: center;
    margin-bottom: 2rem;
  }

  .team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }

  .team-member {
    padding: 2rem;
    text-align: center;
    transition: transform 0.2s ease;
  }

  .team-member:hover {
    transform: translateY(-5px);
  }

  .member-avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    margin: 0 auto 1rem;
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
  }

  .role {
    display: block;
    color: var(--primary-color);
    margin-bottom: 1rem;
  }

  .contact {
    text-align: center;
    padding: 3rem 2rem;
  }

  .contact h2 {
    margin-bottom: 1rem;
  }

  .contact p {
    color: var(--text-secondary);
    margin-bottom: 2rem;
  }

  @media (max-width: 768px) {
    .intro h1 {
      font-size: 2rem;
    }

    .intro p {
      font-size: 1rem;
    }

    .team-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
