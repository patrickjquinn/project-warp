import { parse } from 'svelte/compiler';
import type { CanvasItem } from '../../../components/canvas/types';
import type {
    SvelteAST,
    Element,
    Text,
    Attribute,
    ParsedComponent,
    ParsedElement,
    StyleDeclaration
} from './types';

export class SvelteParser {
    private static currentX = 20;
    private static currentY = 20;
    private static lastRowHeight = 0;

    static parseCode(code: string): ParsedComponent {
        // Reset layout tracking variables
        this.currentX = 20;
        this.currentY = 20;
        this.lastRowHeight = 0;

        try {
            const ast = parse(code) as unknown as SvelteAST;
            const scriptContent = ast.instance ? code.slice(ast.instance.start, ast.instance.end) : '';
            const styleContent = ast.css ? code.slice(ast.css.start, ast.css.end) : '';
            const templateContent = this.extractTemplate(ast, code);

            const styleDeclarations = this.parseStyleBlock(styleContent);
            console.log('Parsed style declarations:', styleDeclarations);

            return {
                ast,
                script: scriptContent,
                style: styleContent,
                template: templateContent,
                styleDeclarations
            };
        } catch (error) {
            console.error('Failed to parse Svelte code:', error);
            return {
                ast: this.createEmptyAST(),
                script: '',
                style: '',
                template: '',
                styleDeclarations: {}
            };
        }
    }

    private static createEmptyAST(): SvelteAST {
        return {
            type: 'Root',
            start: 0,
            end: 0,
            html: {
                type: 'Fragment',
                children: []
            }
        };
    }

    private static extractTemplate(ast: SvelteAST, code: string): string {
        const scriptEnd = ast.instance?.end || 0;
        const styleStart = ast.css?.start || code.length;
        return code.slice(scriptEnd, styleStart).trim();
    }

    static parseElement(element: Element, code: string): ParsedElement {
        const attributes = this.parseAttributes(element);
        const children = element.children
            .filter((child): child is Element => child.type === 'Element')
            .map(child => this.parseElement(child, code));
        
        const content = element.children
            .filter((child): child is Text => child.type === 'Text')
            .map(text => code.slice(text.start, text.end))
            .join('').trim();

        return {
            type: element.type,
            name: element.name,
            attributes,
            children,
            content,
            start: element.start,
            end: element.end
        };
    }

    private static parseAttributes(element: Element) {
        const result: Record<string, any> = {};

        if (!element.attributes) {
            return result;
        }

        element.attributes.forEach(attr => {
            if (attr.type === 'Attribute') {
                if (attr.name === 'style') {
                    result.style = this.parseStyle(attr);
                } else if (attr.name === 'class') {
                    result.class = this.parseClasses(attr);
                } else {
                    result[attr.name] = this.parseAttributeValue(attr);
                }
            }
        });

        return result;
    }

    private static parseStyle(attr: Attribute): { declarations: StyleDeclaration[], important: boolean } {
        const styleText = attr.value[0]?.type === 'Text' ? attr.value[0].data : '';
        const declarations: StyleDeclaration[] = [];
        let important = false;

        styleText.split(';').forEach(declaration => {
            const [property, value] = declaration.split(':').map(s => s.trim());
            if (property && value) {
                if (value.endsWith('!important')) {
                    important = true;
                    declarations.push({
                        property,
                        value: value.replace('!important', '').trim()
                    });
                } else {
                    declarations.push({ property, value });
                }
            }
        });

        return { declarations, important };
    }

    private static parseClasses(attr: Attribute): string[] {
        const classText = attr.value[0]?.type === 'Text' ? attr.value[0].data : '';
        return classText.split(/\s+/).filter(Boolean);
    }

    private static parseAttributeValue(attr: Attribute): string {
        if (attr.value.length === 0) return '';
        if (attr.value[0].type === 'Text') return attr.value[0].data;
        return '';
    }

    static convertToCanvasItems(parsedElement: ParsedElement, parsedComponent?: ParsedComponent): CanvasItem[] {
        const items: CanvasItem[] = [];
        this.processElement(parsedElement, items, undefined, parsedComponent?.styleDeclarations);
        console.log('Converted canvas items:', items);
        return items;
    }

    private static parseStyleBlock(styleContent: string): Record<string, StyleDeclaration[]> {
        const declarations: Record<string, StyleDeclaration[]> = {};
        const ruleRegex = /([^{]+)\{([^}]+)\}/g;
        let match;
        
        console.log('Parsing style content:', styleContent);
        
        while ((match = ruleRegex.exec(styleContent)) !== null) {
            const selector = match[1].trim();
            const styles = match[2].trim();
            
            console.log('Found style rule:', { selector, styles });
            
            const styleDeclarations: StyleDeclaration[] = [];
            styles.split(';').forEach(style => {
                const [property, value] = style.split(':').map(s => s.trim());
                if (property && value) {
                    styleDeclarations.push({ property, value });
                }
            });
            
            selector.split(',').forEach(sel => {
                let cleanSelector = sel.trim();
                cleanSelector = cleanSelector.replace(/:global\((.*?)\)/, '$1');
                
                if (cleanSelector.includes(' ')) {
                    const parts = cleanSelector.split(' ');
                    parts.forEach(part => {
                        const partialSelector = part.trim();
                        if (partialSelector && !partialSelector.startsWith(':')) {
                            console.log('Adding styles for nested selector part:', partialSelector, styleDeclarations);
                            declarations[partialSelector] = [
                                ...(declarations[partialSelector] || []),
                                ...styleDeclarations
                            ];
                        }
                    });
                } else {
                    console.log('Adding styles for selector:', cleanSelector, styleDeclarations);
                    declarations[cleanSelector] = [
                        ...(declarations[cleanSelector] || []),
                        ...styleDeclarations
                    ];
                }
            });
        }
        
        return declarations;
    }

    private static processElement(
        element: ParsedElement, 
        items: CanvasItem[], 
        parentId?: number,
        parsedStyles?: Record<string, StyleDeclaration[]>
    ) {
        // Extract classes from the element
        const elementClasses = element.attributes?.class || [];
        console.log('Processing element:', {
            name: element.name,
            attributes: element.attributes,
            content: element.content,
            childrenCount: element.children.length
        });

        const widget = this.determineWidgetType(element);
        if (widget) {
            const inlineStyles = element.attributes?.style?.declarations || [];
            const cssStyles = this.getCssStyles(element, parsedStyles || {});
            const combinedStyles = [...cssStyles, ...inlineStyles];
            
            // Get layout information
            const layout = this.getLayoutInfo(combinedStyles);
            
            // Calculate position
            const position = this.calculatePosition(layout, element.content || '');
            
            // Convert styles with absolute positioning
            const style = this.convertStyle(combinedStyles, position);
            
            // Build the value string including classes for containers
            let value = '';
            if (widget === 'container') {
                // Preserve original classes for containers
                if (elementClasses.length > 0) {
                    value = elementClasses.join(' ') + ' ';
                }
                value += element.content;
            } else {
                value = element.content;
            }

            const item: CanvasItem = {
                id: Math.floor(Math.random() * 10000),
                widget,
                value,
                parentId,
                style: {
                    [`#${widget}`]: style
                },
                isContainer: widget === 'container'
            };

            console.log('Created canvas item:', item);
            items.push(item);

            // Process children with the current item as parent
            element.children.forEach(child => {
                this.processElement(child, items, item.id, parsedStyles);
            });

            // Update layout tracking
            this.updateLayoutTracking(position, layout);
        } else {
            console.log('No widget type determined for element:', element.name);
            // Still process children even if parent isn't a widget
            element.children.forEach(child => {
                this.processElement(child, items, parentId, parsedStyles);
            });
        }
    }

    private static getLayoutInfo(styles: StyleDeclaration[]) {
        const layout = {
            display: 'block',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'stretch',
            gap: 0,
            width: '100%',  // Default to full width
            height: 40
        };

        let hasExplicitWidth = false;

        styles.forEach(({ property, value }) => {
            switch (property) {
                case 'display':
                    layout.display = value;
                    break;
                case 'flex-direction':
                    layout.flexDirection = value;
                    break;
                case 'justify-content':
                    layout.justifyContent = value;
                    break;
                case 'align-items':
                    layout.alignItems = value;
                    break;
                case 'gap':
                    layout.gap = parseInt(value) || 0;
                    break;
                case 'width':
                    hasExplicitWidth = true;
                    layout.width = value;
                    break;
                case 'max-width':
                    if (!hasExplicitWidth) {
                        layout.width = '100%';  // If max-width is set without width, use full width
                    }
                    break;
                case 'height':
                    layout.height = parseInt(value) || 40;
                    break;
            }
        });

        return layout;
    }

    private static calculatePosition(layout: any, content: string) {
        const position = {
            x: this.currentX,
            y: this.currentY,
            width: layout.width === '100%' ? 1200 : Math.max(parseInt(layout.width) || 100, content.length * 8),
            height: layout.height
        };

        // For flex containers, calculate width based on content and flex properties
        if (layout.display === 'flex') {
            position.width = Math.max(position.width, content.length * 12); // Increase text multiplier for flex items
            if (layout.justifyContent === 'space-between') {
                position.width = Math.min(position.width, 1200); // Limit width for space-between
            }
        }

        return position;
    }

    private static updateLayoutTracking(position: any, layout: any) {
        // For full-width containers, always start at top
        if (layout.width === '100%') {
            this.currentY = 0;
            return;
        }

        // For flex containers, maintain horizontal layout
        if (layout.display === 'flex' && layout.flexDirection === 'row') {
            this.currentX += position.width + (layout.gap || 20);
            this.lastRowHeight = Math.max(this.lastRowHeight, position.height);
        } else {
            // For block elements, stack vertically
            this.currentX = 0;
            this.currentY += position.height + (layout.gap || 20);
            this.lastRowHeight = 0;
        }

        // Wrap to next row if exceeding canvas width
        if (this.currentX > 1200) {
            this.currentX = 0;
            this.currentY += this.lastRowHeight + 20;
            this.lastRowHeight = 0;
        }
    }

    private static getCssStyles(element: ParsedElement, parsedStyles: Record<string, StyleDeclaration[]>): StyleDeclaration[] {
        const styles: StyleDeclaration[] = [];
        const classes = element.attributes?.class || [];
        
        if (parsedStyles[element.name.toLowerCase()]) {
            styles.push(...parsedStyles[element.name.toLowerCase()]);
        }
        
        classes.forEach(className => {
            if (parsedStyles[`.${className}`]) {
                styles.push(...parsedStyles[`.${className}`]);
            }
        });
        
        return styles;
    }

    private static determineWidgetType(element: ParsedElement): string | null {
        const classes = element.attributes?.class || [];
        const name = element.name;
        const lowerName = name.toLowerCase();
        
        switch (lowerName) {
            case 'div':
            case 'nav':
                if (classes.includes('container')) return 'container';
                if (classes.includes('scroll-container')) return 'scrollContainer';
                if (classes.includes('label')) return 'label';
                return 'container';
            case 'button':
                return 'button';
            case 'img':
                return 'image';
            case 'video':
                return 'videoPlayer';
            case 'a':
                return 'button';
            default:
                if (name === 'Link') {
                    return 'button';
                }
                if (name[0] === name[0].toUpperCase()) {
                    return 'container';
                }
                return null;
        }
    }

    private static convertStyle(declarations: StyleDeclaration[], position: any): Record<string, string> {
        const style: Record<string, string> = {
            position: 'absolute',
            left: '0',
            top: `${position.y}px`,
            width: '100%',
            minHeight: `${position.height}px`
        };
        
        // First pass: collect layout properties
        let maxWidth;
        declarations.forEach(({ property, value }) => {
            if (property === 'max-width') {
                maxWidth = value;
            }
            if (!['position', 'left', 'top', 'width', 'height'].includes(property)) {
                style[property] = value;
            }
        });

        // If max-width is specified, create a centered container
        if (maxWidth) {
            style.maxWidth = maxWidth;
            style.marginLeft = 'auto';
            style.marginRight = 'auto';
        }

        return style;
    }

    static generateCode(items: CanvasItem[]): string {
        const elements = items.map(item => this.generateElement(item)).join('\n  ');
        
        return `<script lang="ts">
  // Component logic
</script>

<div class="canvas-content">
  ${elements}
</div>

<style>
  .canvas-content {
    position: relative;
    width: 100%;
    height: 100%;
  }

  /* Widget base styles */
  .container, .label, .button, .scroll-container {
    position: absolute;
    transition: all 0.2s ease;
  }

  .container {
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    box-sizing: border-box;
    padding: 1rem;
  }

  .container.glass {
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.1);
  }

  .label {
    color: #ffffff;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .button {
    cursor: pointer;
    border: none;
    background: rgba(100, 181, 246, 0.2);
    color: #ffffff;
    padding: 8px 16px;
    border-radius: 4px;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .scroll-container {
    overflow: auto;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
</style>`;
    }

    private static generateElement(item: CanvasItem): string {
        const styleKey = Object.keys(item.style)[0];
        const styles = item.style[styleKey];
        const styleString = Object.entries(styles)
            .map(([key, value]) => `${key}: ${value}`)
            .join('; ');

        switch (item.widget) {
            case 'container':
                const classes = ['container'];
                if (styleString.includes('backdrop-filter') || styleString.includes('glass')) {
                    classes.push('glass');
                }
                return `<div class="${classes.join(' ')}" style="${styleString}">${item.value || ''}</div>`;
            case 'label':
                return `<div class="label" style="${styleString}">${item.value || ''}</div>`;
            case 'button':
                return `<button class="button" style="${styleString}">${item.value || ''}</button>`;
            case 'image':
                return `<img src="${item.value}" alt="Canvas Image" style="${styleString}" />`;
            case 'scrollContainer':
                return `<div class="scroll-container" style="${styleString}">${item.value || ''}</div>`;
            case 'videoPlayer':
                return `<video src="${item.value}" controls style="${styleString}"></video>`;
            default:
                return '';
        }
    }
}
