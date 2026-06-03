import { describe, expect, it } from 'bun:test';
import type { Config } from '@opencode-ai/sdk';
import type { PluginInput, ToolContext } from '@opencode-ai/plugin';
import { Parser } from 'sql-ddl-to-json-schema';
import * as ts from 'typescript';
import { z } from 'zod';
import { DataModelCommandPlugin, validateDataModelArtifact } from './index';

const pluginInput = {} as PluginInput;
const toolContext: ToolContext = {
  sessionID: 'session-test',
  messageID: 'message-test',
  agent: 'build',
  abort: new globalThis.AbortController().signal,
};

const validationReportSchema = z.object({
  target: z.enum(['complete', 'mysql', 'postgresql', 'typescript', 'javascript']),
  status: z.enum(['pass', 'fail']),
  checks: z.array(
    z.object({
      label: z.string().min(1),
      status: z.enum(['pass', 'fail']),
      detail: z.string().min(1),
    })
  ),
  targetChecks: z.array(
    z.object({
      label: z.string().min(1),
      status: z.enum(['pass', 'fail']),
      detail: z.string().min(1),
    })
  ),
  aiDoubleCheck: z.boolean(),
  summary: z.string().min(1),
});

const mysqlDdl = `
CREATE TABLE users (
  id INT(11) NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY unq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE projects (
  id INT(11) NOT NULL AUTO_INCREMENT,
  owner_id INT(11) NOT NULL,
  name VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_projects_owner FOREIGN KEY (owner_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`.trim();

const mysqlArtifact = `
## Assumptions

Users own projects.

## Generated Artifacts

\`\`\`sql
${mysqlDdl}
\`\`\`

## Relationships

projects.owner_id references users.id.

## Constraints

Email is UNIQUE and project owner_id is NOT NULL.

## Implementation Notes

Run this as an initial migration.

## Review Checklist

- [ ] Confirm ownership deletion behavior.
`.trim();

const typescriptCode = `
export interface User {
  readonly id: string;
  email: string;
}

export interface ProjectDto {
  readonly id: string;
  ownerId: User['id'];
  name: string;
}
`.trim();

const typescriptArtifact = `
## Assumptions

Users own projects.

## Generated Artifacts

\`\`\`ts
${typescriptCode}
\`\`\`

## Relationships

ProjectDto.ownerId relates to User.id.

## Constraints

IDs are readonly and email is required.

## Implementation Notes

Use ProjectDto at API boundaries and map to a domain model internally.

## Review Checklist

- [ ] Confirm ID format.
`.trim();

describe('DataModelCommandPlugin', () => {
  it('registers command menu entries including validation', async () => {
    const hooks = await DataModelCommandPlugin(pluginInput);
    const config: Config = {};

    await hooks.config?.(config);

    expect(config.command?.['data-model']).toBeDefined();
    expect(config.command?.['data-model-mysql']?.description).toContain('MySQL');
    expect(config.command?.['data-model-postgresql']?.description).toContain('PostgreSQL');
    expect(config.command?.['data-model-typescript']?.description).toContain('TypeScript');
    expect(config.command?.['data-model-javascript']?.description).toContain('JavaScript');
    expect(config.command?.['data-model-validate']?.description).toContain('Validate');
    expect(config.command?.model?.description).toContain('complete data model');
    expect(config.command?.['schema-mysql']?.description).toContain('MySQL');
    expect(config.command?.['schema-pg']?.description).toContain('PostgreSQL');
    expect(config.command?.['types-ts']?.description).toContain('TypeScript');
    expect(config.command?.['types-js']?.description).toContain('JavaScript');
    expect(config.command?.['model-check']?.description).toContain('Validate');
  });

  it('snapshots a TypeScript generation contract with forced validation and AI review', async () => {
    const hooks = await DataModelCommandPlugin(pluginInput);
    const typescriptTool = hooks.tool?.types_ts;

    if (!typescriptTool) {
      throw new Error('types_ts tool was not registered');
    }

    const output = await typescriptTool.execute(
      {
        context: 'Users create projects and assign owner permissions.',
        projectName: 'Workspace access',
        validationMode: 'forced',
        aiDoubleCheck: true,
      },
      toolContext
    );

    expect(output).toContain('Validation mode: forced');
    expect(output).toContain('AI double-check: enabled');
    expect(output).toMatchSnapshot();
  });

  it('validates report shape with Zod and forced quality signals', () => {
    const report = validateDataModelArtifact({
      artifact: mysqlArtifact,
      target: 'mysql',
      aiDoubleCheck: true,
    });

    expect(() => validationReportSchema.parse(report)).not.toThrow();
    expect(report.status).toBe('pass');
    expect(report.aiDoubleCheck).toBe(true);
  });

  it('parses MySQL DDL used in validation fixtures', () => {
    const parser = new Parser('mysql');

    expect(() => {
      parser.feed(mysqlDdl).toCompactJson(parser.results);
    }).not.toThrow();
  });

  it('checks generated TypeScript artifacts compile syntactically', () => {
    const output = ts.transpileModule(typescriptCode, {
      reportDiagnostics: true,
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        strict: true,
      },
    });
    const report = validateDataModelArtifact({
      artifact: typescriptArtifact,
      target: 'typescript',
    });

    expect(output.diagnostics ?? []).toHaveLength(0);
    expect(report.status).toBe('pass');
  });

  it('exposes a validation tool report', async () => {
    const hooks = await DataModelCommandPlugin(pluginInput);
    const validationTool = hooks.tool?.audit_model;

    if (!validationTool) {
      throw new Error('audit_model tool was not registered');
    }

    const output = await validationTool.execute(
      {
        artifact: mysqlArtifact,
        target: 'mysql',
        aiDoubleCheck: true,
      },
      toolContext
    );

    expect(output).toContain('Status: PASS');
    expect(output).toContain('AI double-check: enabled');
  });
});
