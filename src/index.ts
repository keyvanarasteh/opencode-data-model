import type { Plugin } from '@opencode-ai/plugin';
import { tool } from '@opencode-ai/plugin';

const generationTargetValues = [
  'complete',
  'mysql',
  'postgresql',
  'typescript',
  'javascript',
] as const;
const normalizationValues = ['standard', 'strict'] as const;
const validationModeValues = ['forced', 'advisory', 'off'] as const;

type GenerationTarget = (typeof generationTargetValues)[number];
type NormalizationLevel = (typeof normalizationValues)[number];
type ValidationMode = (typeof validationModeValues)[number];

type ValidationStatus = 'pass' | 'fail';

interface CommandDefinition {
  name: string;
  description: string;
  template: string;
  agent?: string;
  model?: string;
  subtask?: boolean;
}

interface GenerationBriefOptions {
  target: GenerationTarget;
  context: string;
  projectName?: string;
  namingConvention?: string;
  normalization?: NormalizationLevel;
  includeExamples?: boolean;
  validationMode?: ValidationMode;
  aiDoubleCheck?: boolean;
}

interface ValidationCheck {
  label: string;
  status: ValidationStatus;
  detail: string;
}

interface ValidationReport {
  target: GenerationTarget;
  status: ValidationStatus;
  checks: ValidationCheck[];
  targetChecks: ValidationCheck[];
  aiDoubleCheck: boolean;
  summary: string;
}

const targetLabels: Record<GenerationTarget, string> = {
  complete: 'complete data model documentation',
  mysql: 'normalized MySQL schema',
  postgresql: 'normalized PostgreSQL schema',
  typescript: 'TypeScript interfaces and types',
  javascript: 'JavaScript data structures with JSDoc types',
};

const targetRubrics: Record<GenerationTarget, string[]> = {
  complete: [
    'Database schemas with tables, relationships, constraints, indexes, and migration notes.',
    'Service-layer models including DTOs, domain models, validation boundaries, and mappings.',
    'UI data structures including component props, state shape, API payloads, and data flows.',
    'A traceability table linking business concepts to storage, service, and UI structures.',
  ],
  mysql: [
    'Use MySQL 8 compatible DDL, InnoDB tables, utf8mb4 character sets, and explicit indexes.',
    'Normalize to at least third normal form unless a documented read-model exception is needed.',
    'Include primary keys, foreign keys, unique constraints, checks where supported, and timestamps.',
    'Call out MySQL-specific tradeoffs such as JSON columns, generated columns, and ON DELETE rules.',
  ],
  postgresql: [
    'Use PostgreSQL compatible DDL with schemas, identity columns or UUIDs, and explicit indexes.',
    'Normalize to at least third normal form unless a documented read-model exception is needed.',
    'Include primary keys, foreign keys, unique constraints, check constraints, and timestamps.',
    'Call out PostgreSQL-specific tradeoffs such as enums, jsonb, partial indexes, and extensions.',
  ],
  typescript: [
    'Define interfaces, discriminated unions, literal types, branded IDs, and utility types as needed.',
    'Separate domain models, persistence rows, create/update DTOs, API responses, and UI view models.',
    'Represent nullability, optionality, readonly fields, dates, decimals, and enums explicitly.',
    'Add concise mapping notes between generated types and database/service concepts.',
  ],
  javascript: [
    'Define plain JavaScript object shapes using JSDoc typedefs and reusable factory examples.',
    'Separate domain records, persistence rows, request payloads, API responses, and UI state shapes.',
    'Represent nullability, optionality, dates, decimals, and enums through comments and examples.',
    'Add concise mapping notes for teams that may later migrate the shapes to TypeScript.',
  ],
};

const requiredValidationSignals: Array<{
  label: string;
  patterns: RegExp[];
  detail: string;
}> = [
  {
    label: 'Assumptions',
    patterns: [/assumptions?/i],
    detail: 'List assumptions and open questions that affect the model.',
  },
  {
    label: 'Generated Artifacts',
    patterns: [
      /generated (artifact|artifacts|model|schema|types|output)/i,
      /create table/i,
      /interface\s+\w+/i,
      /@typedef/i,
    ],
    detail: 'Include a non-empty generated schema, type block, model, or documentation artifact.',
  },
  {
    label: 'Relationships',
    patterns: [/relationships?/i, /foreign key/i, /references/i, /data flow/i],
    detail: 'Describe relationships, cardinality, ownership, and data flow.',
  },
  {
    label: 'Constraints',
    patterns: [/constraints?/i, /not null/i, /unique/i, /check\s*\(/i, /validation rules?/i],
    detail: 'State database constraints, object constraints, or validation rules explicitly.',
  },
  {
    label: 'Implementation Notes',
    patterns: [/implementation notes?/i, /migration notes?/i, /developer notes?/i],
    detail: 'Add implementation notes for migration, integration, or edge cases.',
  },
  {
    label: 'Review Checklist',
    patterns: [/review checklist/i, /validation checklist/i],
    detail: 'Finish with a checklist for reviewer validation.',
  },
];

const targetValidationSignals: Record<
  GenerationTarget,
  Array<{ label: string; pattern: RegExp }>
> = {
  complete: [
    { label: 'Database layer', pattern: /database|table|schema/i },
    { label: 'Service layer', pattern: /service|dto|domain/i },
    { label: 'UI layer', pattern: /ui|component|props|state/i },
  ],
  mysql: [
    { label: 'MySQL DDL', pattern: /create table/i },
    { label: 'Primary key', pattern: /primary key/i },
    { label: 'Relationship constraint', pattern: /foreign key|references/i },
  ],
  postgresql: [
    { label: 'PostgreSQL DDL', pattern: /create table/i },
    { label: 'Primary key', pattern: /primary key/i },
    { label: 'Relationship constraint', pattern: /foreign key|references/i },
  ],
  typescript: [
    { label: 'Type declarations', pattern: /\b(interface|type)\s+\w+/i },
    { label: 'DTO or view model boundary', pattern: /dto|viewmodel|view model|props/i },
  ],
  javascript: [
    { label: 'JSDoc types', pattern: /@typedef|@property/i },
    { label: 'Plain object examples', pattern: /const\s+\w+\s*=\s*\{|example/i },
  ],
};

const commands: CommandDefinition[] = [
  {
    name: 'data-model',
    description: 'Generate complete data model documentation from the current context',
    template: commandTemplate('complete'),
  },
  {
    name: 'data-model-mysql',
    description: 'Generate a normalized MySQL schema from the current context',
    template: commandTemplate('mysql'),
  },
  {
    name: 'data-model-postgresql',
    description: 'Generate a normalized PostgreSQL schema from the current context',
    template: commandTemplate('postgresql'),
  },
  {
    name: 'data-model-typescript',
    description: 'Generate TypeScript interfaces and types from the current context',
    template: commandTemplate('typescript'),
  },
  {
    name: 'data-model-javascript',
    description: 'Generate JavaScript object shapes and JSDoc types from the current context',
    template: commandTemplate('javascript'),
  },
  {
    name: 'data-model-roadmap',
    description: 'Create a quality roadmap for a data model generation effort',
    template: roadmapTemplate(),
  },
  {
    name: 'data-model-validate',
    description: 'Validate a generated data model artifact against required quality gates',
    template: validationTemplate(),
  },
];

function commandTemplate(target: GenerationTarget): string {
  const rubric = targetRubrics[target].map((item) => `- ${item}`).join('\n');

  return `
Generate ${targetLabels[target]} from the current conversation, selected files, attached
files, and any text supplied with this command.

Use the matching data-model tool if it is available to establish the generation contract,
then produce the final artifact directly in the response.

Quality bar:
${rubric}

Required response structure:
1. Assumptions and open questions
2. Source context summary
3. Generated model
4. Relationships and data flow
5. Constraints, validation rules, and indexes where relevant
6. Implementation notes
7. Review checklist

Forced validation gate:
${validationGateText(target, 'forced', false)}

Rules:
- Prefer normalized models and explicit relationships.
- Preserve domain language from the supplied context.
- Name every assumption that changes the generated structure.
- Do not invent unrelated products, actors, or workflows.
- Ask a clarifying question only when the missing answer would materially change the model.
- If the validation gate fails, revise the artifact before giving the final answer.
`.trim();
}

function roadmapTemplate(): string {
  return `
Create a roadmap for building a high-quality data model generator plugin.

Cover these goals:
- Complete data model documentation.
- Normalized MySQL schema generation.
- Normalized PostgreSQL schema generation.
- TypeScript interface and type generation.
- JavaScript object shape and JSDoc type generation.
- OpenCode command support and plugin menu discoverability.

Required response structure:
1. Product scope
2. Generation quality principles
3. Implementation milestones
4. Validation and testing strategy
5. Documentation and release plan
6. Risks and mitigations
`.trim();
}

function validationTemplate(): string {
  return `
Validate a generated data model artifact from the current context.

Use the validate_data_model_output tool when available. Report pass/fail status for:
- Assumptions
- Generated artifacts
- Relationships
- Constraints
- Implementation notes
- Review checklist

If the user asks for an AI double-check, run a second independent reviewer pass after
the structural validation and list any remaining risks.
`.trim();
}

function buildGenerationBrief(options: GenerationBriefOptions): string {
  const project = options.projectName?.trim() || 'unspecified project';
  const naming =
    options.namingConvention?.trim() || 'preserve domain names; use idiomatic code names';
  const normalization = options.normalization ?? 'standard';
  const examples =
    options.includeExamples === false ? 'No examples requested.' : 'Include examples.';
  const validationMode = options.validationMode ?? 'forced';
  const aiDoubleCheck = options.aiDoubleCheck === true;
  const rubric = targetRubrics[options.target].map((item) => `- ${item}`).join('\n');

  return `
# Data Model Generation Contract

Target: ${targetLabels[options.target]}
Project: ${project}
Naming convention: ${naming}
Normalization level: ${normalization}
Examples: ${examples}

## Supplied Context

${options.context.trim()}

## Quality Bar

${rubric}

## Required Work

1. Identify actors, entities, value objects, lifecycle states, and business events.
2. Infer relationships, cardinality, ownership, invariants, and deletion behavior.
3. Separate canonical write models from read models, DTOs, and UI view state.
4. Generate the requested artifact with explicit assumptions.
5. Include validation rules, indexes, constraints, naming notes, and review checks.

## Output Rules

- Produce the final artifact, not only a plan.
- Prefer normalized structures unless denormalization is justified.
- Use deterministic, consistent names.
- Flag ambiguity instead of silently choosing risky semantics.
- Keep explanations concise and implementation-oriented.

## Validation Gate

${validationGateText(options.target, validationMode, aiDoubleCheck)}
`.trim();
}

function buildRoadmapBrief(context: string, projectName?: string): string {
  const project = projectName?.trim() || 'opencode-data-model';

  return `
# Data Model Generator Roadmap Contract

Project: ${project}

## Supplied Context

${context.trim()}

## Required Roadmap

1. Command/menu experience for OpenCode users.
2. Generator prompts for database, service-layer, and UI structures.
3. Dialect-specific MySQL and PostgreSQL schema quality.
4. TypeScript and JavaScript output quality.
5. Tests, fixture contexts, regression checks, and documentation.
6. Packaging, public release, and adoption steps.

## Output Rules

- Organize milestones from first usable release to high-confidence release.
- Include concrete acceptance criteria for each milestone.
- Highlight risks that could reduce generation quality.
`.trim();
}

function validationGateText(
  target: GenerationTarget,
  validationMode: ValidationMode,
  aiDoubleCheck: boolean
): string {
  if (validationMode === 'off') {
    return 'Validation mode: off. Still keep assumptions and review risks visible.';
  }

  const modeText =
    validationMode === 'forced'
      ? 'Validation mode: forced. Do not finalize until all required checks pass.'
      : 'Validation mode: advisory. Report failures and recommended fixes.';
  const required = requiredValidationSignals
    .map((check) => `- ${check.label}: ${check.detail}`)
    .join('\n');
  const targetChecks = targetValidationSignals[target]
    .map((check) => `- ${check.label}`)
    .join('\n');
  const aiReview = aiDoubleCheck
    ? 'AI double-check: enabled. After the structural pass, run a second independent reviewer pass and list residual risks.'
    : 'AI double-check: optional. Run it when the user asks for double-checking or when ambiguity remains.';

  return `
${modeText}

Required checks:
${required}

Target-specific checks:
${targetChecks}

${aiReview}
`.trim();
}

function runChecks(
  artifact: string,
  checks: Array<{ label: string; patterns?: RegExp[]; pattern?: RegExp; detail?: string }>
): ValidationCheck[] {
  return checks.map((check) => {
    const patterns = check.patterns ?? (check.pattern ? [check.pattern] : []);
    const passed = patterns.some((pattern) => pattern.test(artifact));

    return {
      label: check.label,
      status: passed ? 'pass' : 'fail',
      detail: passed ? 'Signal found.' : (check.detail ?? 'Required signal was not found.'),
    };
  });
}

export function validateDataModelArtifact(input: {
  artifact: string;
  target: GenerationTarget;
  aiDoubleCheck?: boolean;
}): ValidationReport {
  const checks = runChecks(input.artifact, requiredValidationSignals);
  const targetChecks = runChecks(input.artifact, targetValidationSignals[input.target]);
  const failed = [...checks, ...targetChecks].filter((check) => check.status === 'fail');
  const status: ValidationStatus = failed.length === 0 ? 'pass' : 'fail';

  return {
    target: input.target,
    status,
    checks,
    targetChecks,
    aiDoubleCheck: input.aiDoubleCheck === true,
    summary:
      status === 'pass'
        ? 'All required validation signals were found.'
        : `${failed.length} validation check(s) failed. Revise the artifact before finalizing.`,
  };
}

export function formatValidationReport(report: ValidationReport): string {
  const formatCheck = (check: ValidationCheck) =>
    `- [${check.status === 'pass' ? 'x' : ' '}] ${check.label}: ${check.detail}`;

  return `
# Data Model Validation Report

Target: ${targetLabels[report.target]}
Status: ${report.status.toUpperCase()}
AI double-check: ${report.aiDoubleCheck ? 'enabled' : 'not requested'}

## Required Components

${report.checks.map(formatCheck).join('\n')}

## Target Checks

${report.targetChecks.map(formatCheck).join('\n')}

## Result

${report.summary}

${report.aiDoubleCheck ? 'Run a second independent AI reviewer pass before final acceptance.' : 'AI double-check can be requested for an additional reviewer pass.'}
`.trim();
}

function generationArgs() {
  return {
    context: tool.schema
      .string()
      .min(1)
      .describe('Business, product, API, database, or UI context to model.'),
    projectName: tool.schema
      .string()
      .optional()
      .describe('Optional project or bounded context name.'),
    namingConvention: tool.schema
      .string()
      .optional()
      .describe('Optional naming preference such as snake_case, camelCase, or domain-first names.'),
    normalization: tool.schema
      .enum(normalizationValues)
      .optional()
      .describe('How aggressively to normalize relational schemas.'),
    includeExamples: tool.schema
      .boolean()
      .optional()
      .describe('Whether to include examples, sample payloads, or sample queries.'),
    validationMode: tool.schema
      .enum(validationModeValues)
      .optional()
      .describe('Validation strictness for the final output. Defaults to forced.'),
    aiDoubleCheck: tool.schema
      .boolean()
      .optional()
      .describe('Request a second independent AI reviewer pass after structural validation.'),
  };
}

export const DataModelCommandPlugin: Plugin = async () => {
  return {
    tool: {
      generate_data_model_documentation: tool({
        description:
          'Build a generation contract for complete data model documentation across DB, service, and UI layers.',
        args: generationArgs(),
        async execute(args) {
          return buildGenerationBrief({ ...args, target: 'complete' });
        },
      }),
      generate_mysql_schema: tool({
        description: 'Build a generation contract for a normalized MySQL schema.',
        args: generationArgs(),
        async execute(args) {
          return buildGenerationBrief({ ...args, target: 'mysql' });
        },
      }),
      generate_postgresql_schema: tool({
        description: 'Build a generation contract for a normalized PostgreSQL schema.',
        args: generationArgs(),
        async execute(args) {
          return buildGenerationBrief({ ...args, target: 'postgresql' });
        },
      }),
      generate_typescript_types: tool({
        description: 'Build a generation contract for TypeScript interfaces and types.',
        args: generationArgs(),
        async execute(args) {
          return buildGenerationBrief({ ...args, target: 'typescript' });
        },
      }),
      generate_javascript_types: tool({
        description: 'Build a generation contract for JavaScript object shapes and JSDoc typedefs.',
        args: generationArgs(),
        async execute(args) {
          return buildGenerationBrief({ ...args, target: 'javascript' });
        },
      }),
      create_data_model_roadmap: tool({
        description: 'Build a roadmap contract for improving a data model generator plugin.',
        args: {
          context: tool.schema
            .string()
            .min(1)
            .describe('Current goals, constraints, or product notes.'),
          projectName: tool.schema.string().optional().describe('Optional project or plugin name.'),
        },
        async execute(args) {
          return buildRoadmapBrief(args.context, args.projectName);
        },
      }),
      validate_data_model_output: tool({
        description:
          'Validate a generated data model artifact for required sections, relationships, constraints, and target-specific signals.',
        args: {
          artifact: tool.schema
            .string()
            .min(1)
            .describe('Generated markdown, SQL, TypeScript, or JavaScript artifact to validate.'),
          target: tool.schema
            .enum(generationTargetValues)
            .describe('Artifact target to validate against.'),
          aiDoubleCheck: tool.schema
            .boolean()
            .optional()
            .describe('Include a second-pass AI reviewer requirement in the validation report.'),
        },
        async execute(args) {
          return formatValidationReport(validateDataModelArtifact(args));
        },
      }),
    },
    async config(config) {
      config.command = config.command ?? {};

      for (const command of commands) {
        config.command[command.name] = {
          template: command.template,
          description: command.description,
          agent: command.agent,
          model: command.model,
          subtask: command.subtask,
        };
      }
    },
  };
};

export default DataModelCommandPlugin;
