import { canvasStore } from '../../../components/canvas/stores/canvasStore';
import type { CanvasItem } from '../../../components/canvas/types';
import { SvelteParser } from './parser';
import type { Element } from './types';
import { invoke } from '@tauri-apps/api/core';
import { get } from 'svelte/store';

export class SyncManager {
    private currentFilePath: string | null = null;
    private isUpdating = false;
    private lastCanvasState: CanvasItem[] = [];
    private lastCodeContent = '';
    private unsubscribeCanvas: (() => void) | null = null;

    constructor() {
        this.setupCanvasListener();
    }

    private setupCanvasListener() {
        this.unsubscribeCanvas = canvasStore.subscribe(state => {
            if (this.isUpdating || !this.currentFilePath) return;

            const items = state.items;
            if (this.hasCanvasChanged(items)) {
                this.lastCanvasState = JSON.parse(JSON.stringify(items));
                this.updateCodeFromCanvas(items);
            }
        });
    }

    private hasCanvasChanged(items: CanvasItem[]): boolean {
        return JSON.stringify(items) !== JSON.stringify(this.lastCanvasState);
    }

    async setActiveFile(filePath: string) {
        this.currentFilePath = filePath;
        await this.loadFile(filePath);
    }

    private async loadFile(filePath: string) {
        try {
            const content = await invoke<string>('read_file_content', { path: filePath });
            this.lastCodeContent = content;
            await this.updateCanvasFromCode(content);
        } catch (error) {
            console.error('Failed to load file:', error);
        }
    }

    async updateCanvasFromCode(code: string) {
        if (this.isUpdating) return;
        this.isUpdating = true;

        try {
            const parsed = SvelteParser.parseCode(code);
            
            // Debug: Log all children to understand the AST structure
            console.log('AST children:', parsed.ast.html.children.map(child => ({
                type: child.type,
                name: 'name' in child ? child.name : undefined,
                start: child.start,
                end: child.end
            })));

            // Find the first element node (skipping script and style nodes)
            // Filter out non-Element nodes and script/style elements
            const firstElement = parsed.ast.html.children.find(child => 
                child.type === 'Element' && 
                'name' in child && 
                !['Script', 'Style'].includes(child.name)
            ) as Element | undefined;
            
            if (!firstElement) {
                console.warn('No valid root element found in Svelte code');
                return;
            }

            console.log('Found root element:', {
                type: firstElement.type,
                name: firstElement.name,
                attributes: firstElement.attributes
            });

            const element = SvelteParser.parseElement(firstElement, code);
            console.log('Parsed element:', element);
            const items = SvelteParser.convertToCanvasItems(element, parsed);

            this.lastCanvasState = items;
            const state = get(canvasStore);
            canvasStore.setItems(items);
        } catch (error) {
            console.error('Failed to update canvas from code:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    private async updateCodeFromCanvas(items: CanvasItem[]) {
        if (!this.currentFilePath || this.isUpdating) return;
        this.isUpdating = true;

        try {
            const newCode = SvelteParser.generateCode(items);
            if (newCode !== this.lastCodeContent) {
                this.lastCodeContent = newCode;
                await this.saveToFile(newCode);
                await this.notifyEditor(newCode);
            }
        } catch (error) {
            console.error('Failed to update code from canvas:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    private async saveToFile(content: string) {
        if (!this.currentFilePath) return;

        try {
            await invoke('write_file_content', {
                path: this.currentFilePath,
                content
            });
        } catch (error) {
            console.error('Failed to save file:', error);
        }
    }

    private async notifyEditor(content: string) {
        window.dispatchEvent(new CustomEvent('codeUpdated', {
            detail: {
                content,
                path: this.currentFilePath
            }
        }));
    }

    async handlePropertyChange(itemId: number, changes: Record<string, any>) {
        const state = get(canvasStore);
        const updatedItems = state.items.map(item => {
            if (item.id !== itemId) return item;

            const styleKey = Object.keys(item.style)[0];
            return {
                ...item,
                style: {
                    [styleKey]: {
                        ...item.style[styleKey],
                        ...changes
                    }
                }
            };
        });

        canvasStore.setItems(updatedItems);
    }

    async handleValueChange(itemId: number, value: string) {
        const state = get(canvasStore);
        const updatedItems = state.items.map(item => 
            item.id === itemId ? { ...item, value } : item
        );

        canvasStore.setItems(updatedItems);
    }

    async handlePositionChange(itemId: number, x: number, y: number) {
        const state = get(canvasStore);
        const updatedItems = state.items.map(item => {
            if (item.id !== itemId) return item;

            const styleKey = Object.keys(item.style)[0];
            return {
                ...item,
                style: {
                    [styleKey]: {
                        ...item.style[styleKey],
                        left: `${x}px`,
                        top: `${y}px`
                    }
                }
            };
        });

        canvasStore.setItems(updatedItems);
    }

    destroy() {
        if (this.unsubscribeCanvas) {
            this.unsubscribeCanvas();
        }
    }
}

// Create a singleton instance
export const syncManager = new SyncManager();
