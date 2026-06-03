# AGENTS.md

## Installation & Usage

This plugin (`opencode-data-model`) is published to npm and can be loaded by
OpenCode in two ways.

### From npm (recommended)

Add the package to the `plugin` array in your OpenCode config. npm plugins are
installed automatically with Bun at startup and cached under
`~/.cache/opencode/node_modules/`.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-data-model"]
}
```

Both regular and scoped npm packages are supported. The same artifact resolves
under npm or Bun (`bun add opencode-data-model`) — npmjs.com is the only
registry; there is no separate Bun registry.

### From local files

Place built JavaScript/TypeScript files in a plugin directory; they load
automatically at startup:

- `.opencode/plugins/` — project-level plugins
- `~/.config/opencode/plugins/` — global plugins

```bash
mise run build
mise run link   # symlinks dist/index.js into ~/.config/opencode/plugins/
```

To use external packages from a local plugin, create a `package.json` in your
config directory, or publish to npm and reference it from config instead.

### Load order

Plugins load from all sources and every hook runs in sequence:

1. Global config (`~/.config/opencode/opencode.json`)
2. Project config (`opencode.json`)
3. Global plugin directory (`~/.config/opencode/plugins/`)
4. Project plugin directory (`.opencode/plugins/`)

Duplicate npm packages with the same name and version load once. A local plugin
and an npm plugin with similar names load separately.

## Build & Test Commands

- **Build**: `mise run build`
- **Test**: `mise run test` or `bun test`
- **Single Test**: `bun test BackgroundTask.test.ts` (use file glob pattern)
- **Watch Mode**: `bun test --watch`
- **Lint**: `mise run lint` (eslint)
- **Fix Lint**: `mise run lint:fix` (eslint --fix)
- **Format**: `mise run format` (prettier)

## Code Style Guidelines

### Imports & Module System

- Use ES6 `import`/`export` syntax (module: "ESNext", type: "module")
- Group imports: external libraries first, then internal modules
- Use explicit file extensions (`.ts`) for internal imports

### Formatting (Prettier)

- **Single quotes** (`singleQuote: true`)
- **Line width**: 100 characters
- **Tab width**: 2 spaces
- **Trailing commas**: ES5 (no trailing commas in function parameters)
- **Semicolons**: enabled

### TypeScript & Naming

- **NeverNesters**: avoid deeply nested structures. Always exit early.
- **Strict mode**: enforced (`"strict": true`)
- **Classes**: PascalCase (e.g., `BackgroundTask`, `BackgroundTaskManager`)
- **Methods/properties**: camelCase
- **Status strings**: use union types (e.g., `'pending' | 'running' | 'completed' | 'failed' | 'cancelled'`)
- **Explicit types**: prefer explicit type annotations over inference
- **Return types**: optional (not required but recommended for public methods)

### Error Handling

- Check error type before accessing error properties: `error instanceof Error ? error.toString() : String(error)`
- Log errors with `[ERROR]` prefix for consistency
- Always provide error context when recording output

### Linting Rules

- `@typescript-eslint/no-explicit-any`: warn (avoid `any` type)
- `no-console`: error (minimize console logs)
- `prettier/prettier`: error (formatting violations are errors)

## Testing

- Framework: **vitest** with `describe` & `it` blocks
- Style: Descriptive nested test cases with clear expectations
- Assertion library: `expect()` (vitest)

## Memory

- Store temporary data in `.memory/` directory (gitignored)

## Project Context

- **Type**: ES Module package for OpenCode plugin system
- **Target**: Bun runtime, ES2021+
- **Purpose**: Data model generation commands and tools for OpenCode
- **Primary surfaces**: OpenCode slash commands, command menu entries, and custom tools
