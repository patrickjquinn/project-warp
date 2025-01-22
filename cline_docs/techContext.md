# Technical Context - Warp Code IDE

## Technology Stack

### Frontend
- **Framework**: Svelte
- **Router**: svelte-spa-router
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: CSS with global styles
- **Code Editor**: Monaco Editor
- **Terminal**: xterm.js

### Backend
- **Framework**: Tauri 2.0
- **Language**: Rust
- **Core Plugins**:
  - tauri-plugin-fs
  - tauri-plugin-shell
  - tauri-plugin-process
  - tauri-plugin-dialog

### Development Tools
- **Package Manager**: bun
- **Version Control**: Git
- **Code Formatting**: Prettier
- **Linting**: ESLint
- **Build System**: Rollup (for Electron components)

## Development Setup

### Prerequisites
1. **System Requirements**
   - Node.js (Latest LTS)
   - Rust (Latest stable)
   - Bun package manager
   - Git

2. **Platform-specific Requirements**
   - **Windows**: 
     - Visual Studio Build Tools
     - WebView2
   - **macOS**: 
     - Xcode Command Line Tools
   - **Linux**: 
     - webkit2gtk
     - libappindicator
     - build-essential

### Installation Steps
```bash
# Install dependencies
bun install

# Development
bun run dev:all

# If node-pty fails
bun rebuild
$(bun bin)/electron-rebuild  # Unix
.\node_modules\.bin\electron-rebuild.cmd  # Windows
```

### Development Commands
```bash
# Start development server
bun run dev

# Build project
bun run build

# Run tests
bun test

# Format code
bun run format

# Lint code
bun run lint
```

## Project Structure
```
project-warpcode/
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   ├── views/             # Page components
│   ├── stores/            # State management
│   ├── styles/            # Global styles
│   ├── modules/           # Business logic
│   └── types/             # TypeScript types
│
├── src-tauri/             # Backend source code
│   ├── src/               # Rust source files
│   ├── templates/         # Project templates
│   └── capabilities/      # Security capabilities
│
├── public/                # Static assets
│   └── static/
│       └── assets/        # Icons and images
│
└── script/               # Build scripts
```

## Configuration Files

### Frontend
- **vite.config.js**: Vite configuration
- **svelte.config.js**: Svelte configuration
- **tsconfig.json**: TypeScript configuration
- **.eslintrc.cjs**: ESLint rules
- **.prettierrc**: Prettier formatting rules

### Backend
- **Cargo.toml**: Rust dependencies
- **tauri.conf.json**: Tauri configuration
- **capabilities/**: Tauri capability definitions

## Technical Constraints

### Security
1. **File System Access**
   - Restricted to project directories
   - Capability-based permissions
   - Secure file operations

2. **Shell Access**
   - Limited command execution
   - Sandboxed environment
   - Plugin-based restrictions

3. **IPC Communication**
   - Secure message passing
   - Validated data transfer
   - Protected channels

### Performance
1. **Memory Usage**
   - Efficient state management
   - Optimized file operations
   - Memory-conscious data structures

2. **Startup Time**
   - Lazy loading of components
   - Optimized bundle size
   - Fast initial render

3. **Runtime Performance**
   - Asynchronous operations
   - Efficient UI updates
   - Optimized file watching

### Cross-Platform
1. **Desktop Support**
   - Windows
   - macOS
   - Linux

2. **Mobile Support** (Planned)
   - iOS
   - Android

3. **Web Support**
   - Modern browsers
   - Progressive enhancement

## Development Guidelines

### Code Style
1. **TypeScript**
   - Strict type checking
   - Interface-first design
   - Documented types

2. **Svelte**
   - Component composition
   - Reactive declarations
   - Props validation

3. **Rust**
   - Safe code practices
   - Error handling
   - Documentation

### Testing Requirements
1. **Unit Tests**
   - Component tests
   - Store tests
   - Utility tests

2. **Integration Tests**
   - Cross-component tests
   - API tests
   - File system tests

3. **E2E Tests**
   - User flow tests
   - Cross-platform tests
   - Performance tests

### Documentation
1. **Code Documentation**
   - JSDoc comments
   - Rust documentation
   - Type definitions

2. **API Documentation**
   - IPC commands
   - Plugin APIs
   - Public interfaces

3. **User Documentation**
   - Setup guides
   - Usage documentation
   - API references
