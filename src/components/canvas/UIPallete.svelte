<script land="ts">
	import { flip } from 'svelte/animate'
	import { dndzone, TRIGGERS, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action'
import Icon from 'svelte-awesome/components/Icon.svelte'
import image from 'svelte-awesome/icons/image'
import square from 'svelte-awesome/icons/square'
import videoCamera from 'svelte-awesome/icons/videoCamera'
import textHeight from 'svelte-awesome/icons/textHeight'

	let items = [
		{
			id: 1,
			name: 'label',
			icon: textHeight,
			widget: 'label',
			value: 'text',
			contentsType: 'slot',
			style: {
				'#label1': {
					height: '0.2rem',
					color: 'black',
					'line-height': '0.2rem'
				}
			},
			meta: {
				container: false
			}
		},
		{
			id: 2,
			name: 'container',
			icon: square,
			widget: 'container',
			contentsType: 'slot',
			style: {
				'#container2': {
					width: '100%',
					color: 'white',
					'background-color': 'lightgray',
					border: 'none'
				}
			},
			meta: {
				container: true
			},
			items: []
		},
		{
			id: 3,
			name: 'scrollContainer',
			icon: square,
			widget: 'scrollContainer',
			contentsType: 'slot',
			style: {
				'#scrollContainer3': {
					width: '100%',
					height: '5rem',
					color: 'white'
				}
			},
			meta: {
				container: true
			},
			items: []
		},
		{
			id: 4,
			name: 'image',
			icon: image,
			widget: 'image',
			value:
				'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQMAAADCCAMAAAB6zFdcAAAAQlBMVEX///+hoaGenp6ampr39/fHx8fOzs7j4+P8/Pyvr6/d3d3FxcX29va6urqYmJjs7OzU1NSlpaW1tbWtra3n5+e/v78TS0zBAAACkUlEQVR4nO3b63KCMBCGYUwUUVEO6v3fagWVY4LYZMbZnff51xaZ5jON7CZNEgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQb5tvI8qzX4/nH84XG5Upfj2ir2V2E5fZ/XpIX9saMnhkYLIkiyRJjdgMoiEDMmiQgfwM8rSu77ew2wnPoLTmwdZBs0J2BuXrYckcQm4nOoP+WcmWAbcTnUHZPy9eA24nOoN7n0HI54ToDM5k8PjluwyqgNuJzqDoaugPg8gWZ4noDAYLwuIg75fLeeHHsjNIzrZJwWwW+0DNsmEWPjiEZ5AcD8ZUu8VZ8HyQMifvBdIz+PS33i8adu+7Qn4Gn1Tdupl7rlCfQb9seosK7RkcBy1o30iVZ5CPOtDW3WhQnsF13IV3v0p3BqfJRoSpXVepzmA/24+yqeMyzRm4tqOs44lSUwa3yfgOri25av5CPRnklR33VlPnrqSZV09qMsiqSWV082xOz1uPajJ49pTM/f115k6guWa6JGjJ4N1lt8fXN2rv/vysjFaSQdFXBc/KKF04ptFPliclGVR9Bu27XCyeVOkmy5OODAZN9rYyyip/AIPJ8qIig+PoXbf7YdPdncFoSdCQQT4ZceV+MhiFMBy0hgyu0yGvOLI17KwpyGBaHK5jtt0N5GcwLw7XZdB31sRn8O+ziqYro8Vn4CwOV+k6a9Iz+PwRsKC7h+gMfMXhKu/OmuwM/MXhKq8yWnYG/uJw5Uxoy2jRGZTBZ/jboxuSM1guDtdNhKazJjiDbNMe0AxzKUVnkO+jEJxBxNtJzWCTxlNLzSB8KehJ/H+mJGYAjaDjzj9SnHZRuXZiAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAECXP1XDHv7U4SNFAAAAAElFTkSuQmCC',
			contentsType: 'src',
			style: {
				'#image4': {
					width: '100%',
					height: '5rem',
					color: 'white'
				}
			},
			meta: {
				container: false
			}
		},
		{
			id: 5,
			name: 'button',
			icon: square,
			widget: 'button',
			value: 'Button',
			contentsType: 'slot',
			style: {
				'#button5': {
					width: '80%',
					'margin-left': 'auto',
					'margin-right': 'auto',
					height: '2rem',
					color: 'black',
					border: 'none',
					'border-radius': '4px',
					'background-color': 'lightgray'
				}
			},
			meta: {
				container: false
			}
		},
		{
			id: 6,
			name: 'videoPlayer',
			icon: videoCamera,
			widget: 'videoPlayer',
			value: 'https://www.youtube.com/embed/jAaxVuz0uKk',
			contentsType: 'src',
			style: {
				'#video6': {
					width: '100%',
					height: '5rem',
					color: 'white'
				}
			},
			meta: {
				container: false
			}
		}
	]

	// for (const [index, item] of items.entries()) {
	// 		const styleObj = {}
	// 		styleObj[`#${item.widget}${index+1}`] = item.style[`#${item.widget}${item.id}`]
	// 		items[index].style = styleObj
	// 		items[index].id = index + 1
	// }

	// $: {
	// for (const [index, item] of items.entries()) {
	// 	const styleObj = {}
	// 	styleObj[`#${item.widget}${index+1}`] = item.style[`#${item.widget}${item.id}`]
	// 	items[index].style = styleObj
	// 	items[index].id = index + 1
	// }
	// }
	const flipDurationMs = 100
	let shouldIgnoreDndEvents = true
	function handleDndConsider(e) {
		const { trigger, id } = e.detail.info
		if (trigger === TRIGGERS.DRAG_STARTED) {
			const idx = items.findIndex((item) => item.id === id)
			const item = items[idx]
			const newId = id + Math.round(Math.random() * 100)
			const style = {}
			style[`#${item.widget}${newId}`] = item.style[`#${item.widget}${id}`]
			e.detail.items = e.detail.items.filter((item) => !item[SHADOW_ITEM_MARKER_PROPERTY_NAME])
			e.detail.items.splice(idx, 0, { ...items[idx], id: newId, style })
			items = e.detail.items
			shouldIgnoreDndEvents = true
		} else if (!shouldIgnoreDndEvents) {
			items = e.detail.items
		} else {
			items = [...items]
		}
	}
	function handleDndFinalize() {
		items = [...items]
		// if (!shouldIgnoreDndEvents) {
		//     items = e.detail.items;
		// }
		// else {
		//     items = [...items];
		//     shouldIgnoreDndEvents = false;
		// }
	}
</script>

<section
	id="ui_controls"
	use:dndzone="{{ items, flipDurationMs }}"
	on:consider="{handleDndConsider}"
	on:finalize="{handleDndFinalize}"
>
	{#each items as item (item.id)}
		<div animate:flip="{{ duration: flipDurationMs }}">
			<Icon data="{item.icon}" />
			{item.name}
		</div>
	{/each}
</section>

<style>
	#ui_controls {
		position: relative;
		margin-top: 0;
		height: 100%;
		width: 100%;
		color: white;
		background-color: #1e1e1e;
	}
	#ui_controls div {
		width: 95%;
		border-radius: 0.2rem;
		border: 1px solid white;
		height: 20px;
		padding: 10px;
		padding-right: 0;
	}
</style>
