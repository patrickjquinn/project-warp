export interface FileNode {
    name: string;
    path: string;
    type?: 'file' | 'directory';
    children?: FileNode[];
    is_dir?: boolean;
}

export interface FolderProps {
    expanded: boolean;
    root: boolean;
    name: string;
    children: FileNode[];
    path: string;
}

export interface FileSelectedEvent {
    name: string;
    path: string;
    type: 'file' | 'directory';
    content: string;
    language: string;
}

export interface FolderEvents {
    fileSelected: CustomEvent<FileSelectedEvent>;
}
