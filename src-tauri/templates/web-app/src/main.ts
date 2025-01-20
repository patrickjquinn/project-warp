import App from './App.svelte'
import { navigate } from 'svelte-routing'

const app = new App({
  target: document.getElementById('app') as HTMLElement,
  props: {
    url: window.location.pathname
  }
})

// Handle client-side routing
window.addEventListener('click', (event) => {
  const target = event.target as HTMLElement
  if (target.tagName === 'A' && target.hasAttribute('href')) {
    const href = target.getAttribute('href')
    if (href && href.startsWith('/')) {
      event.preventDefault()
      navigate(href)
    }
  }
})

export default app
