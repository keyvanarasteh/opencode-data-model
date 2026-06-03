# opencode-data-model

Data Model Generator Command is an OpenCode plugin for producing high-quality data
model documentation from product notes, source files, API descriptions, database
fragments, or UI requirements.

It adds slash commands to the OpenCode command menu and exposes custom tools the
assistant can call while working through a data-modeling task.

## What It Generates

- Complete data model documentation across database, service, and UI layers
- Normalized MySQL 8 schemas
- Normalized PostgreSQL schemas
- TypeScript interfaces, types, DTOs, and UI data structures
- JavaScript object shapes with JSDoc typedefs
- Roadmaps for improving data model generation quality

## Commands

After installation, these commands are available from OpenCode's command menu:

| Command | Purpose |
| --- | --- |
| `/data-model` | Generate complete data model documentation |
| `/data-model-mysql` | Generate a normalized MySQL schema |
| `/data-model-postgresql` | Generate a normalized PostgreSQL schema |
| `/data-model-typescript` | Generate TypeScript interfaces and types |
| `/data-model-javascript` | Generate JavaScript object shapes and JSDoc types |
| `/data-model-roadmap` | Generate an implementation roadmap for data model work |

Use a command with context in the prompt, selected files, attached files, or the
current conversation. The command output is designed to include assumptions,
generated artifacts, relationships, constraints, implementation notes, and a review
checklist.

## Custom Tools

The plugin also registers these tools for OpenCode:

| Tool | Purpose |
| --- | --- |
| `generate_data_model_documentation` | Builds a generation contract for complete documentation |
| `generate_mysql_schema` | Builds a generation contract for a normalized MySQL schema |
| `generate_postgresql_schema` | Builds a generation contract for a normalized PostgreSQL schema |
| `generate_typescript_types` | Builds a generation contract for TypeScript models |
| `generate_javascript_types` | Builds a generation contract for JavaScript/JSDoc models |
| `create_data_model_roadmap` | Builds a roadmap contract for data-model generator work |

The tools return strict generation contracts. OpenCode can use those contracts to
produce the final schema, type definitions, documentation, or roadmap with a
consistent quality bar.

## Installation

### From npm

Add the package to your OpenCode config:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-data-model"]
}
```

### From local files

Build and link the plugin into your global OpenCode plugin directory:

```bash
mise trust
bun install
mise run build
mise run link
```

OpenCode also supports project-level plugins in `.opencode/plugins/` and global
plugins in `~/.config/opencode/plugins/`.

## Development

```bash
mise trust
bun install
mise run build
mise run typecheck
mise run lint
mise run test
```

Useful tasks:

| Task | Description |
| --- | --- |
| `mise run build` | Build `dist/index.js`, emit declarations, and copy command assets |
| `mise run dev` | Development build with sourcemaps |
| `mise run typecheck` | Type-check without emitting |
| `mise run lint` | Run ESLint |
| `mise run format` | Format TypeScript files |
| `mise run link` | Symlink the built plugin into the global OpenCode plugins directory |

## Output Standards

Generated data models should:

- Preserve domain language from the supplied context
- Prefer normalized relational models unless denormalization is justified
- Name assumptions that change structure or constraints
- Include relationships, cardinality, ownership, and lifecycle states
- Separate storage models, service DTOs, domain models, and UI view state
- Represent nullability, optionality, dates, decimals, enums, and IDs explicitly
- Include a review checklist for missing requirements and risky assumptions

## Roadmap

### 1. First Usable Release

- Register stable slash commands for full documentation, MySQL, PostgreSQL,
  TypeScript, JavaScript, and roadmap generation.
- Expose matching custom tools with strict generation contracts.
- Document local and npm installation paths.
- Acceptance criteria: `mise run build` succeeds and commands appear in OpenCode's
  command list after installation.

### 2. Generation Quality Fixtures

- Add representative fixture contexts for SaaS, marketplace, workflow, content,
  billing, and operational systems.
- Capture expected output shapes for MySQL, PostgreSQL, TypeScript, JavaScript,
  and full documentation.
- Acceptance criteria: fixture reviews catch missing entities, weak constraints,
  inconsistent naming, and unclear assumptions.

### 3. Dialect-Specific Schema Depth

- Add rubric coverage for MySQL indexes, generated columns, JSON tradeoffs, and
  InnoDB behaviors.
- Add rubric coverage for PostgreSQL schemas, enums, jsonb, extensions, partial
  indexes, generated columns, and check constraints.
- Acceptance criteria: generated DDL is executable after minor project-specific
  naming adjustments.

### 4. Service and UI Modeling Depth

- Expand command contracts for DTO boundaries, validation ownership, API payloads,
  component props, view models, cache state, optimistic updates, and data flows.
- Acceptance criteria: generated models trace each domain concept from persistence
  through service logic to UI state.

### 5. Validation and Release Readiness

- Add tests for command registration, tool output contracts, and package exports.
- Add example prompts and generated examples to the README or docs folder.
- Prepare public package metadata, release automation, and provenance settings.
- Acceptance criteria: build, typecheck, lint, and tests pass before publishing.

## Package Metadata

- Package: `opencode-data-model`
- Version: `0.1.0`
- Author: Keyvan Arasteh <keyvan.arasteh@live.com>
- Repository: <https://github.com/keyvanarasteh/opencode-data-model>

## Contributing

Contributions are welcome. Here's how you can contribute:

1. Fork the repository
2. Create a feature branch with `git checkout -b feature/amazing-feature`
3. Commit your changes with `git commit -m 'Add some amazing feature'`
4. Push to the branch with `git push origin feature/amazing-feature`
5. Open a pull request

Please update tests as appropriate and follow the existing code style.

## License

This plugin is licensed under the MIT License. OpenCode is also licensed under the
MIT License. See [LICENSE](LICENSE) for details.
