# System Patterns - Warp Code IDE

## Architecture Overview

### Frontend Architecture
1. **Framework & UI**
   - Built with Svelte for reactive UI components
   - Uses svelte-spa-router for navigation
   - Implements a component-based architecture
   - Follows a store-based state management pattern

2. **Key Components**
   - AppBuilder: Main IDE interface
   - Launcher: Project selection/creation interface
   - Explorer: File system navigation
   - Terminal: Integrated command-line interface
   - Canvas: Visual component editor
   - PropertyPanel: Component property editor

3. **State Management**
   - Uses Svelte stores for reactive state
   - Separate stores for different concerns:
     - searchStore: Search functionality
     - panelStore: Panel visibility/state
     - settingsStore: Application settings
     - canvasStore: Visual editor state
     - layoutStore: UI layout management

### Backend Architecture
1. **Core Framework**
   - Built on Tauri 2.0
   - Rust-based backend for performance
   - Plugin-based architecture for extensibility

2. **File System Operations**
   - Secure file system access via tauri-plugin-fs
   - File watching capabilities
   - Project structure management
   - File operation commands (create, rename, delete)

3. **Terminal Integration**
   - Integrated shell support via tauri-plugin-shell
   - Cross-platform terminal emulation
   - Process management and I/O handling

4. **Project Management**
   - Template-based project creation
   - Recent projects tracking
   - Project configuration management

## Technical Decisions

### 1. Framework Selection
- **Tauri 2.0**
  - Chosen for native performance
  - Better security model than Electron
  - Smaller bundle size
  - Built-in mobile support

- **Svelte**
  - Minimal runtime overhead
  - Reactive by default
  - Excellent component composition
  - Clean, maintainable code

### 2. Security Patterns
- Capability-based security model
- Scoped file system access
- Secure IPC communication
- Plugin-based permission system

### 3. State Management
- Decentralized store pattern
- Component-local state when possible
- Global stores for shared state
- Event-based communication

### 4. Code Organization
```
src/
├── components/     # Reusable UI components
├── views/         # Page-level components
├── stores/        # State management
├── styles/        # Global styles
└── modules/       # Business logic modules

src-tauri/
├── src/           # Rust backend code
└── templates/     # Project templates
```

### 5. Plugin Architecture
- Core plugins:
  - fs: File system operations
  - shell: Terminal and process management
  - process: Application lifecycle
  - dialog: Native dialogs

## Design Patterns

1. **Component Patterns**
   - Smart/Dumb component separation
   - Higher-order components for reusability
   - Slot-based composition
   - Event delegation

2. **Store Patterns**
   - Single source of truth
   - Immutable state updates
   - Derived stores for computed values
   - Action creators for complex operations

3. **Communication Patterns**
   - Event-based communication
   - Message passing via IPC
   - Reactive data flow
   - Command pattern for operations

4. **UI Patterns**
   - Responsive design
   - Glassmorphic styling
   - Drag and drop interfaces
   - Context menus
   - Split panels

## Performance Considerations

1. **Frontend**
   - Lazy loading of components
   - Virtual scrolling for large lists
   - Debounced operations
   - Efficient state updates

2. **Backend**
   - Asynchronous file operations
   - Buffered terminal I/O
   - Efficient process management
   - Memory-conscious data structures

## Testing Strategy

1. **Unit Testing**
   - Component testing
   - Store testing
   - Utility function testing
   - Backend service testing

2. **Integration Testing**
   - Cross-component interaction
   - Store integration
   - IPC communication
   - File system operations

3. **End-to-End Testing**
   - User flow testing
   - Cross-platform verification
   - Performance testing
   - Security testing
