import { describe, expect, it } from 'bun:test';
import type { Config } from '@opencode-ai/sdk';
import type { PluginInput, ToolContext } from '@opencode-ai/plugin';
import { DataModelCommandPlugin } from './index';

const pluginInput = {} as PluginInput;
const toolContext: ToolContext = {
  sessionID: 'session-test',
  messageID: 'message-test',
  agent: 'build',
  abort: new globalThis.AbortController().signal,
};

describe('DataModelCommandPlugin', () => {
  it('registers data model commands in OpenCode config', async () => {
    const hooks = await DataModelCommandPlugin(pluginInput);
    const config: Config = {};

    await hooks.config?.(config);

    expect(config.command?.['data-model']).toBeDefined();
    expect(config.command?.['data-model-mysql']?.description).toContain('MySQL');
    expect(config.command?.['data-model-postgresql']?.description).toContain('PostgreSQL');
    expect(config.command?.['data-model-typescript']?.description).toContain('TypeScript');
    expect(config.command?.['data-model-javascript']?.description).toContain('JavaScript');
  });

  it('exposes a MySQL generation contract tool', async () => {
    const hooks = await DataModelCommandPlugin(pluginInput);
    const mysqlTool = hooks.tool?.generate_mysql_schema;

    expect(mysqlTool).toBeDefined();

    const output = await mysqlTool?.execute(
      {
        context: 'Users create projects, invite members, and assign role-based permissions.',
        projectName: 'Workspace access',
        normalization: 'strict',
      },
      toolContext
    );

    expect(output).toContain('normalized MySQL schema');
    expect(output).toContain('Workspace access');
    expect(output).toContain('third normal form');
  });
});
