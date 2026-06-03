---
description: Generate a normalized MySQL schema
---

Generate a normalized MySQL 8 schema from the current context.

Include:

1. InnoDB `CREATE TABLE` DDL
2. Primary keys, foreign keys, unique constraints, checks where supported, and indexes
3. Relationship notes with cardinality and deletion behavior
4. Assumptions, migration notes, and review checklist

Use `utf8mb4`, consistent snake_case table and column names, and at least third normal
form unless a documented denormalization is justified.
