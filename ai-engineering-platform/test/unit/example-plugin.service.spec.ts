import {
  EXAMPLE_PLUGIN_TOOL_DEFINITION,
  ExampleEchoTool,
  ExamplePluginService,
} from '../../src/plugins/example/example-plugin.service.js';

describe('ExamplePluginService', () => {
  it('exposes a manifest and tool registrations', () => {
    const echoTool = new ExampleEchoTool();
    const plugin = new ExamplePluginService(echoTool);

    expect(plugin.getManifest().name).toBe('example-plugin');
    expect(plugin.getManifest().tools).toEqual([EXAMPLE_PLUGIN_TOOL_DEFINITION]);
    expect(plugin.getTools()).toHaveLength(1);
  });

  it('echoes a message', async () => {
    const echoTool = new ExampleEchoTool();

    await expect(
      echoTool.execute({ message: 'hello' }),
    ).resolves.toEqual({ message: 'hello' });
  });
});
