# Technical Context

## Technologies Used

### Frontend
- Svelte 5 (with TypeScript)
- Monaco Editor for code editing
- Custom UI components
- Svelte stores for state management

### Backend/Native
- Tauri (Rust-based desktop framework)
- Native file system integration
- Terminal integration
- Window management capabilities

### Development Tools
- TypeScript for type safety
- Vite for development and building
- ESLint/Prettier for code formatting
- NPM/Bun for package management

## Development Setup
1. Core Dependencies
   - Node.js/Bun runtime
   - Rust toolchain for Tauri
   - TypeScript compiler
   - Monaco editor packages
   - Svelte compiler and runtime

2. Project Structure
   - /src: Frontend Svelte application
   - /src-tauri: Rust/Tauri backend
   - /public: Static assets
   - /src/components: Reusable UI components
   - /src/stores: State management
   - /src/modules: Core functionality modules

## Technical Constraints

1. Editor Integration
   - Monaco editor must be lazy-loaded
   - Editor state must be properly cleaned up
   - Store updates must be centralized in Editor component
   - File content synchronization must handle:
     * Focus states
     * External changes
     * Unsaved modifications
     * Large files
   - Memory management for long sessions

2. File System Integration
   - All operations must be asynchronous
   - File watching must be efficient:
     * Debounced updates
     * Memory-efficient watchers
     * Proper cleanup
   - Path handling must be cross-platform
   - Important files must be preserved
   - File type detection must be comprehensive

3. Window Management
   - Single instance per project
   - Proper window cleanup
   - State persistence between sessions
   - Cross-platform window handling
   - Proper window transitions

4. Terminal Integration
   - Bidirectional communication must be reliable
   - Command queuing must prevent race conditions
   - Output handling must be efficient
   - Session cleanup must be thorough
   - Cross-platform shell support

5. Performance Considerations
   - Efficient file system watching
   - Optimized store updates
   - Memory management in long sessions
   - Large file handling
   - Terminal output buffering

6. Cross-Platform Support
   - Windows/macOS/Linux compatibility
   - Path handling differences
   - Shell differences
   - File system differences
   - Window management differences
