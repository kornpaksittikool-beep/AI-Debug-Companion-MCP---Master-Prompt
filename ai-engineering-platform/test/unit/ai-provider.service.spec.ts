import { PlatformError } from '../../src/core/errors/platform-error.js';
import { AiProviderRegistryService } from '../../src/modules/ai-provider/services/ai-provider-registry.service.js';
import { AiRoutingService } from '../../src/modules/ai-provider/services/ai-routing.service.js';

describe('AiProviderRegistryService', () => {
  it('lists built-in provider profiles', () => {
    const service = new AiProviderRegistryService();

    expect(service.list().providers.map((provider) => provider.id)).toEqual(
      expect.arrayContaining(['openai', 'claude', 'gemini', 'deepseek', 'ollama', 'openrouter', 'local-llm']),
    );
  });

  it('returns one provider metadata record', () => {
    const service = new AiProviderRegistryService();

    expect(service.get('openai')).toMatchObject({
      id: 'openai',
      models: [expect.objectContaining({ id: 'gpt-5' })],
    });
  });

  it('rejects unknown provider lookups', () => {
    const service = new AiProviderRegistryService();

    expect(() => service.get('missing')).toThrow(PlatformError);
  });

  it('validates provider-neutral requests', () => {
    const service = new AiProviderRegistryService();

    expect(
      service.validateRequest({
        providerId: 'openai',
        modelId: 'gpt-5',
        capability: 'tool_use',
        requireToolUse: true,
      }),
    ).toMatchObject({
      valid: true,
    });
    expect(
      service.validateRequest({
        providerId: 'local-llm',
        modelId: 'local-default',
        capability: 'tool_use',
        requireToolUse: true,
      }),
    ).toMatchObject({
      valid: false,
    });
  });
});

describe('AiRoutingService', () => {
  it('creates deterministic routing plans with preferred providers', () => {
    const route = new AiRoutingService(new AiProviderRegistryService()).route({
      capability: 'tool_use',
      preferredProviderIds: ['claude', 'openai'],
      requireToolUse: true,
    });

    expect(route.selected).toMatchObject({
      providerId: 'claude',
      modelId: 'claude-sonnet',
    });
    expect(route.fallbackCandidates.map((candidate) => candidate.providerId)).toContain('openai');
  });

  it('reports rejected candidates when constraints cannot be met', () => {
    const route = new AiRoutingService(new AiProviderRegistryService()).route({
      providerId: 'local-llm',
      capability: 'tool_use',
      requireToolUse: true,
    });

    expect(route.selected).toBeUndefined();
    expect(route.rejectedCandidates).toEqual([
      expect.objectContaining({
        providerId: 'local-llm',
      }),
    ]);
  });
});
