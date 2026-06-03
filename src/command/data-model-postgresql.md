---
description: Generate a normalized PostgreSQL schema
---

Generate a normalized PostgreSQL schema from the current context.

Include:

1. `CREATE SCHEMA` and `CREATE TABLE` DDL where appropriate
2. Primary keys, foreign keys, unique constraints, check constraints, and indexes
3. Relationship notes with cardinality and deletion behavior
4. Assumptions, extension notes, migration notes, and review checklist

Prefer normalized relational structures, clear enum/jsonb tradeoffs, and explicit
constraints.
