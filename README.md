# opencode-data-model

[![PR checks](https://github.com/keyvanarasteh/opencode-data-model/actions/workflows/pr.yml/badge.svg)](https://github.com/keyvanarasteh/opencode-data-model/actions/workflows/pr.yml)
[![Publish](https://github.com/keyvanarasteh/opencode-data-model/actions/workflows/publish.yml/badge.svg)](https://github.com/keyvanarasteh/opencode-data-model/actions/workflows/publish.yml)
[![npm](https://img.shields.io/npm/v/opencode-data-model.svg)](https://www.npmjs.com/package/opencode-data-model)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub](https://img.shields.io/github/stars/keyvanarasteh/opencode-data-model?style=flat)](https://github.com/keyvanarasteh/opencode-data-model)

OpenCode plugin for generating normalized, high-performance schemas and
compile-safe TypeScript or JavaScript data models.

## Why

I asked LLMs to generate schemas a million times. Too often they looked right,
then failed on relationships, constraints, nullability, indexes, SQL dialects, or
TypeScript boundaries. This plugin adds a stronger prompt contract, forced
validation, and optional AI double-checking to reduce those mistakes before the
model reaches your codebase.

## Install

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-data-model"]
}
```

Bun users can install the same npm package with `bun add opencode-data-model`.

## Objects

| Object | Command | Tool |
| --- | --- | --- |
| Blueprint | `/model` | `model_doc` |
| MySQL Forge | `/schema-mysql` | `schema_mysql` |
| Postgres Forge | `/schema-pg` | `schema_pg` |
| Type Loom | `/types-ts` | `types_ts` |
| JSDoc Loom | `/types-js` | `types_js` |
| Quality Map | `/data-model-roadmap` | `roadmap_model` |
| Gatekeeper | `/model-check` | `audit_model` |

Classic `/data-model-*` commands and `generate_*` tool names are still available
for compatibility.

## Prompt Contract

- Act as a principal data architect.
- Normalize write models first; document read-model exceptions.
- Design for correctness, query performance, maintainability, and migrations.
- Add indexes for real access patterns without over-indexing.
- Make nullability, ownership, deletion behavior, and constraints explicit.
- Keep TypeScript and JavaScript models compile-safe and boundary-aware.
- Reject the draft if validation finds hallucinated fields, missing relations,
  weak indexes, dialect errors, or type/interface drift.

## Development

```bash
mise trust
bun install
mise run build
mise run lint
mise run test
mise run typecheck
```

Validation uses Bun snapshots, Zod contract checks, SQL DDL parsing, and
TypeScript syntax checks. Update snapshots with `mise run test_update`.

## Publishing

```bash
npm login
mise run publish --tag latest
# if your npm account enforces publish 2FA:
mise run publish --tag latest --otp <one-time-code>
```

## License

MIT License. See [LICENSE](LICENSE).
