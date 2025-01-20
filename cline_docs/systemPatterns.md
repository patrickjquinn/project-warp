# System Patterns

## Architecture Overview
- Desktop application built with Tauri (Rust) and Svelte (TypeScript)
- Component-based architecture with clear separation of concerns
- Store-based state management using Svelte stores
- File system integration through Tauri's native capabilities

## Key Technical Decisions
1. Editor Integration
   - Monaco Editor for code editing capabilities
   - Custom wrapper component for Svelte integration
   - Two-way binding pattern for content synchronization
   - Focus-aware updates to prevent editing conflicts

2. UI Component System
   - Canvas-based UI builder
   - Component palette for drag-and-drop functionality
   - Property panel for component configuration
   - Nested content support for complex layouts

3. File System Handling
   - Explorer component for file system navigation
   - Directory store for file system state management
   - File watching capabilities
   - Active file tracking

4. Terminal Integration
   - Native terminal capabilities through Tauri
   - Custom terminal component for UI integration
   - Command execution support

## Design Patterns

1. Store Pattern
   - Centralized state management through Svelte stores
   - Clear ownership of store updates:
     * Editor component manages file state
     * Explorer component handles file selection events
     * Terminal component manages session state
   - Unidirectional data flow
   - Event-driven updates

2. Component Composition
   - Clear separation of concerns:
     * Explorer: File system navigation and selection
     * Editor: File content and state management
     * Terminal: Command execution and output
   - Event-based communication between components
   - Hierarchical component structure
   - Reusable UI components

3. Native Integration
   - Tauri commands for native functionality:
     * File system operations with proper error handling
     * Window management with state persistence
     * Process management for terminal sessions
     * Event system for file watching
   - Cross-platform compatibility
   - Asynchronous operation handling

4. File System Handling
   - Real-time file watching
   - Debounced updates
   - File type detection
   - Sorting and filtering
   - Important file handling

5. Window Management
   - Single instance per project
   - Window state persistence
   - Proper window transitions
   - Cross-platform window handling

6. Terminal Integration
   - Bidirectional communication
   - Command queuing
   - Output buffering
   - Session management
   - Proper cleanup
