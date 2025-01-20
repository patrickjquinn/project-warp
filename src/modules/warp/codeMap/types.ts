export interface BaseNode {
    type: string;
    start: number;
    end: number;
}

export interface Attribute {
    type: 'Attribute';
    name: string;
    value: Array<Text | Expression>;
}

export interface Text {
    type: 'Text';
    data: string;
    start: number;
    end: number;
}

export interface Expression {
    type: 'Expression';
    expression: any;
}

export interface Element extends BaseNode {
    type: 'Element';
    name: string;
    attributes?: Array<Attribute>;
    children: Array<Element | Text>;
}

export interface Script extends BaseNode {
    type: 'Script';
    context: 'module' | 'default' | 'instance';
    content: {
        type: 'Program';
        body: any[];
    };
}

export interface Style extends BaseNode {
    type: 'Style';
    content: {
        type: 'Program';
        body: any[];
    };
}

export interface SvelteAST extends BaseNode {
    html: {
        type: 'Fragment';
        children: Array<Element | Text>;
    };
    instance?: Script;
    module?: Script;
    css?: Style;
}

export interface ParsedComponent {
    ast: SvelteAST;
    script: string;
    style: string;
    template: string;
    styleDeclarations?: Record<string, StyleDeclaration[]>;
}

export interface StyleDeclaration {
    property: string;
    value: string;
}

export interface ElementStyle {
    declarations: StyleDeclaration[];
    important: boolean;
}

export interface ElementAttributes {
    style?: ElementStyle;
    class?: string[];
    src?: string;
    alt?: string;
    [key: string]: any;
}

export interface ParsedElement {
    type: string;
    name: string;
    attributes: ElementAttributes;
    children: ParsedElement[];
    content: string;
    start: number;
    end: number;
}
