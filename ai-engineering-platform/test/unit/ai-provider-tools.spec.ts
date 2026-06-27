import type { JsonSchemaObject } from '../../src/core/registry/interfaces/json-schema.interface.js';
import { AiProviderRegistryService } from '../../src/modules/ai-provider/services/ai-provider-registry.service.js';
import { AiRoutingService } from '../../src/modules/ai-provider/services/ai-routing.service.js';
import {
  AiProviderMetadataTool,
  AiProvidersTool,
  AiRouteRequestTool,
  AiValidateRequestTool,
} from '../../src/modules/ai-provider/tools/ai-provider.tools.js';

describe('AI provider tools', () => {
  it('executes provider list and metadata handlers', async () => {
    const registry = new AiProviderRegistryService();

    const providersResult = (await new AiProvidersTool(registry).execute({})) as unknown as {
      readonly providers: readonly { readonly id: string }[];
    };
    expect(providersResult.providers.map((provider) => provider.id)).toContain('openai');
    await expect(new AiProviderMetadataTool(registry).execute({ providerId: 'openai' })).resolves.toMatchObject({
      id: 'openai',
    });
  });

  it('executes validation and routing handlers', async () => {
    const registry = new AiProviderRegistryService();
    const input = {
      capability: 'tool_use',
      preferredProviderIds: ['openai'],
      requireToolUse: true,
    } as unknown as JsonSchemaObject;

    await expect(new AiValidateRequestTool(registry).execute(input)).resolves.toMatchObject({
      valid: true,
    });
    const route = (await new AiRouteRequestTool(new AiRoutingService(registry)).execute(input)) as unknown as {
      readonly selected?: { readonly providerId: string };
    };
    expect(route.selected?.providerId).toBe('openai');
  });
});
