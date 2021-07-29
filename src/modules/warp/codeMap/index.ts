import { parse } from 'himalaya'

import cssbeautify from 'cssbeautify'
import * as Css from 'json-to-css'
import { toCSS, toJSON } from 'cssjson'
import css2json from 'css2json'
export class CodeMap {
	lang: string
	constructor(lang: string) {
		this.lang = lang
	}

	private static capFirstLetter(input: string): string {
		return input.charAt(0).toUpperCase() + input.slice(1)
	}

	public mapToCode(canvas: Record<string, unknown>, current: string): string {
		const items: Array<Record<string, unknown>> = canvas.items as Array<Record<string, unknown>>
		let scriptItems = ``
		let mainItems = ``
		let cssItems = ``
		for (const item of items) {
			const widgetType: any = item.widget as string
			const widgetID: any = item.id as string
			let widgetValue: any = item.value as string
			let contentType: any = item.contentsType as string
			if (!widgetValue) {
				widgetValue = ''
			}
			if (!contentType) {
				contentType = 'slot'
			}

			cssItems = cssItems + this.convertJSONToCSS(item.style)

			scriptItems =
				scriptItems + `import {${CodeMap.capFirstLetter(widgetType)}} from "@components/warp/"\n`

			const widget = this.transformTemplateToWidget({ type: contentType, widget: widgetType, value: widgetValue, id: widgetID })

			if (item === items[items.length - 1]) {
				mainItems =
					mainItems + `${widget}`
			} else {
				mainItems =
					mainItems +
					`${widget}
            `
			}
		}

		// cssItems = cssItems + current.split('<style>').pop().split('</style>')[0];

		return `
        <script lang="${this.lang}">
            ${scriptItems.trim()}
        </script>

        <main>
            ${mainItems}
        </main>

		<style>
			${cssItems}
		</style>
        `
	}

	public mapToCanvas(code: string): void {
		let mainObject: string = code.split('<main>')[0]
		mainObject = mainObject.split('</main>')[0]

		const components: Array<unknown> = mainObject.split(/\n/)
		console.log(components)
	}

	public convertCodeToCanvas(code: string): any {
		const json = parse(code)

		const canvas = []
		const cssItems = []


		for (const item of json) {
			if (item.tagName === 'main') {
				for (const inner of item.children) {
					if (inner.type === 'element') {
						canvas.push(this.transformCodeToCanvas(inner))
					}
				}
			} else if (item.tagName === 'style') {
				for (const style of item.children) {
					if (style.type === 'text') {
						const formatted = this.convertCSSToJSON(style.content)

						if (formatted) {
							cssItems.push(formatted)
						}
					}
				}
			}
		}


		console.log(`👉 ${JSON.stringify(canvas)}`)


		if (canvas?.length > 0 && cssItems?.length > 0) {
			for (const [index, item] of canvas.entries()) {
				const id = `#${item.widget}${item.id}`
	
				for (const style of cssItems) {
					if (style[id]) {
						canvas[index].style = style
						break
					}
				}
			}
		}
		

		console.log(`👉👉 ${JSON.stringify(canvas)}`)

		return canvas
	}

	private transformTemplateToWidget({ type, widget, value, id }): string {
		if (type === 'slot') {
			return `<${CodeMap.capFirstLetter(widget)} id="${widget + id}">${value}</${CodeMap.capFirstLetter(widget)}>`
		}
		return `<${CodeMap.capFirstLetter(widget)} ${type}="${value}" id="${widget + id}"/>`
	}

	private transformCodeToCanvas(item) {
		let id
		const widget = item.tagName
		let contentsType = ""
		let value = ""

		for (const obj of item.attributes) {
			if (obj.key === "src" || obj.key === "value") {
				contentsType = obj.key
				value = obj.value
			}

			if (obj.key === "id") {
				id = parseInt(obj.value.split(item.tagName)[1])
			}
		}

		if (contentsType.length === 0) {
			contentsType = 'slot'
		}

		if (value.length === 0 && item.children.length > 0) {
			for (const child of item.children) {
				value += child['content'] as string
			}
		}

		return {
			id,
			name: widget,
			widget,
			value,
			contentsType: 'slot'
		}
	}

	private convertCSSToJSON(css: string) {
		css = css.replaceAll('\t', '').trim()

		if (css.length > 0) {
			const beautified = cssbeautify(css, {
				autosemicolon: true
			})

			return css2json(beautified)
		}

		return null
	}

	public convertJSONToCSS(json: Record<string,unknown>): string {
		if (json) {
			const r = Css.of(json)

			const beautified = cssbeautify(r, {
				autosemicolon: true
			})

			return beautified
		}
		return ``

	}
}
