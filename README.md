# opencode-data-model

[![PR checks](https://github.com/keyvanarasteh/opencode-data-model/actions/workflows/pr.yml/badge.svg)](https://github.com/keyvanarasteh/opencode-data-model/actions/workflows/pr.yml)
[![Publish](https://github.com/keyvanarasteh/opencode-data-model/actions/workflows/publish.yml/badge.svg)](https://github.com/keyvanarasteh/opencode-data-model/actions/workflows/publish.yml)
[![npm](https://img.shields.io/npm/v/opencode-data-model.svg)](https://www.npmjs.com/package/opencode-data-model)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub](https://img.shields.io/github/stars/keyvanarasteh/opencode-data-model?style=flat)](https://github.com/keyvanarasteh/opencode-data-model)

OpenCode plugin for generating data model documentation, normalized database
schemas, and TypeScript or JavaScript model definitions from project context.

## Install

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-data-model"]
}
```

## Commands

| Command | Output |
| --- | --- |
| `/data-model` | Complete database, service, and UI data model documentation |
| `/data-model-mysql` | Normalized MySQL 8 schema |
| `/data-model-postgresql` | Normalized PostgreSQL schema |
| `/data-model-typescript` | TypeScript interfaces, DTOs, and UI data structures |
| `/data-model-javascript` | JavaScript object shapes with JSDoc typedefs |
| `/data-model-roadmap` | Data model generator implementation roadmap |
| `/data-model-validate` | Forced validation report with optional AI double-check |

## Tools

- `generate_data_model_documentation`
- `generate_mysql_schema`
- `generate_postgresql_schema`
- `generate_typescript_types`
- `generate_javascript_types`
- `create_data_model_roadmap`
- `validate_data_model_output`

## Development

```bash
mise trust
bun install
mise run build
mise run lint
mise run test
mise run typecheck
```

Validation uses Bun snapshots, Zod contract checks, SQL DDL parsing, and TypeScript
syntax checks. Update snapshots with `mise run test:update`.

Local OpenCode link:

```bash
mise run link
```

## Publishing

```bash
npm login
mise run publish --tag latest
```

## Contributing

Contributions are welcome. Fork the repository, create a feature branch, commit
your changes, push the branch, and open a pull request. Please update tests as
appropriate and follow the existing code style.

## License

MIT License. See [LICENSE](LICENSE).
