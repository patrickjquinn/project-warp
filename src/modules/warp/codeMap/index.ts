import type { CanvasItem } from '../../../components/canvas/types';
import type { SvelteAST, Element } from './types';
import { SvelteParser } from './parser';
import { parse } from 'svelte/compiler';
import cssbeautify from 'cssbeautify';

interface CodeMapping {
    code: string;
    lineStart: number;
    lineEnd: number;
    item: CanvasItem;
}

export class CodeMap {
    constructor(private language: string) {}

    validateCssString(css: string): boolean {
        try {
            // Simple validation - try parsing as style object
            const styleEl = document.createElement('style');
            styleEl.textContent = css;
            document.head.appendChild(styleEl);
            document.head.removeChild(styleEl);
            return true;
        } catch (e) {
            console.error('Invalid CSS:', e);
            return false;
        }
    }

    convertJSONToCSS(styleObj: Record<string, Record<string, string>>): string {
        const cssStrings: string[] = [];
        
        for (const [selector, styles] of Object.entries(styleObj)) {
            const styleString = Object.entries(styles)
                .map(([prop, value]) => `${prop}: ${value};`)
                .join(' ');
            
            cssStrings.push(`${selector} { ${styleString} }`);
        }

        return cssbeautify(cssStrings.join('\n'), {
            indent: '  ',
            autosemicolon: true
        });
    }

    convertCSSToJSON(css: string): Record<string, Record<string, string>> {
        const result: Record<string, Record<string, string>> = {};
        
        // Simple CSS parser
        const rules = css.split('}').filter(rule => rule.trim());
        
        for (const rule of rules) {
            const [selector, styles] = rule.split('{').map(s => s.trim());
            if (!selector || !styles) continue;
            
            const styleObj: Record<string, string> = {};
            styles.split(';').forEach(style => {
                const [prop, value] = style.split(':').map(s => s.trim());
                if (prop && value) {
                    styleObj[prop] = value;
                }
            });
            
            result[selector] = styleObj;
        }
        
        return result;
    }
}

export class CodeGenerator {
    private static indentLevel = 0;
    private static indent() {
        return '  '.repeat(this.indentLevel);
    }

    static generateComponentCode(item: CanvasItem): string {
        const styleKey = Object.keys(item.style)[0];
        const styles = item.style[styleKey];
        const styleString = Object.entries(styles)
            .map(([key, value]) => `${key}: ${value}`)
            .join('; ');

        switch (item.widget) {
            case 'container':
                return `
${this.indent()}<div class="container" style="${styleString}">
${this.indent()}  ${item.value || ''}
${this.indent()}</div>`;

            case 'label':
                return `${this.indent()}<div class="label" style="${styleString}">${item.value || ''}</div>`;

            case 'button':
                return `${this.indent()}<button class="button" style="${styleString}">${item.value || ''}</button>`;

            case 'image':
                return `${this.indent()}<img src="${item.value}" alt="Canvas Image" style="${styleString}" />`;

            case 'scrollContainer':
                return `
${this.indent()}<div class="scroll-container" style="${styleString}">
${this.indent()}  ${item.value || ''}
${this.indent()}</div>`;

            case 'videoPlayer':
                return `${this.indent()}<video src="${item.value}" controls style="${styleString}" />`;

            default:
                return '';
        }
    }

    static generateFullComponent(items: CanvasItem[]): string {
        return `<script lang="ts">
  // Component logic here
</script>

<div class="canvas-content">
${items.map(item => this.generateComponentCode(item)).join('\n')}
</div>

<style>
  .canvas-content {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .container {
    position: absolute;
    display: flex;
    flex-direction: column;
  }

  .label {
    position: absolute;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .button {
    position: absolute;
    cursor: pointer;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .scroll-container {
    position: absolute;
    overflow: auto;
  }
</style>`;
    }

    static parseComponentCode(code: string): CanvasItem[] {
        try {
            const parsed = SvelteParser.parseCode(code);
            const mainElement = parsed.ast.html.children[0] as Element;
            if (!mainElement) return [];

            const parsedElement = SvelteParser.parseElement(mainElement, code);
            return SvelteParser.convertToCanvasItems(parsedElement);
        } catch (error) {
            console.error('Failed to parse component code:', error);
            return [];
        }
    }

    static updateComponentCode(code: string, items: CanvasItem[]): string {
        try {
            const parsed = SvelteParser.parseCode(code);
            
            // Preserve script content
            const scriptContent = parsed.script || '// Component logic';
            
            // Generate new template content
            const templateContent = items.map(item => this.generateComponentCode(item)).join('\n');
            
            // Preserve custom styles by merging with generated ones
            const existingStyles = parsed.style || '';
            const generatedStyles = this.generateBaseStyles();
            
            return `<script lang="ts">
${scriptContent}
</script>

<div class="canvas-content">
${templateContent}
</div>

<style>
${this.mergeStyles(existingStyles, generatedStyles)}
</style>`;
        } catch (error) {
            console.error('Failed to update component code:', error);
            return code;
        }
    }

    static generateAST(items: CanvasItem[]): SvelteAST {
        const template = items.map(item => this.generateComponentCode(item)).join('\n');
        const fullCode = `
<script lang="ts">
// Component logic
</script>

<div class="canvas-content">
${template}
</div>

<style>
${this.generateBaseStyles()}
</style>`;

        try {
            return parse(fullCode) as unknown as SvelteAST;
        } catch (error) {
            console.error('Failed to generate AST:', error);
            return {
                type: 'Root',
                start: 0,
                end: fullCode.length,
                html: {
                    type: 'Fragment',
                    children: []
                }
            };
        }
    }

    static getMappings(code: string): CodeMapping[] {
        const mappings: CodeMapping[] = [];
        try {
            const parsed = SvelteParser.parseCode(code);
            const lines = code.split('\n');
            let currentLine = 0;

            // Track script block
            if (parsed.script) {
                const scriptLines = parsed.script.split('\n').length;
                currentLine += scriptLines;
            }

            // Track template items
            parsed.ast.html.children.forEach(child => {
                if (child.type === 'Element') {
                    const element = SvelteParser.parseElement(child, code);
                    const parsedItems = SvelteParser.convertToCanvasItems(element);
                    
                    parsedItems.forEach(item => {
                        const elementLines = code.slice(child.start, child.end).split('\n');
                        mappings.push({
                            code: code.slice(child.start, child.end),
                            lineStart: currentLine,
                            lineEnd: currentLine + elementLines.length - 1,
                            item
                        });
                        currentLine += elementLines.length;
                    });
                }
            });

            return mappings;
        } catch (error) {
            console.error('Failed to generate mappings:', error);
            return [];
        }
    }

    private static generateBaseStyles(): string {
        return `
  .canvas-content {
    position: relative;
    width: 100%;
    height: 100%;
  }

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
  }`;
    }

    private static mergeStyles(existing: string, generated: string): string {
        // Remove any duplicate base styles from existing
        const existingStyles = existing.replace(/.canvas-content\s*{[^}]*}/, '')
            .replace(/.container\s*{[^}]*}/, '')
            .replace(/.label\s*{[^}]*}/, '')
            .replace(/.button\s*{[^}]*}/, '')
            .replace(/.scroll-container\s*{[^}]*}/, '')
            .trim();

        return `${generated}

  /* Custom styles */
${existingStyles}`;
    }
}

export class CodeSynchronizer {
    private mappings: CodeMapping[] = [];
    private lastCode = '';
    private lastCanvasState: CanvasItem[] = [];

    constructor(private onCodeUpdate: (code: string) => void) {}

    syncCanvasToCode(items: CanvasItem[]) {
        const newCode = CodeGenerator.generateFullComponent(items);
        if (newCode !== this.lastCode) {
            this.lastCode = newCode;
            this.onCodeUpdate(newCode);
        }
    }

    syncCodeToCanvas(code: string): CanvasItem[] {
        if (code === this.lastCode) {
            return this.lastCanvasState;
        }

        const items = CodeGenerator.parseComponentCode(code);
        this.lastCanvasState = items;
        this.lastCode = code;
        return items;
    }

    updateMapping(code: string) {
        this.mappings = CodeGenerator.getMappings(code);
    }

    getItemForCodePosition(line: number): CanvasItem | null {
        const mapping = this.mappings.find(m => 
            line >= m.lineStart && line <= m.lineEnd
        );
        return mapping?.item || null;
    }

    getCodePositionForItem(itemId: number): { start: number; end: number } | null {
        const mapping = this.mappings.find(m => m.item.id === itemId);
        return mapping ? { start: mapping.lineStart, end: mapping.lineEnd } : null;
    }
}
