import { Injectable } from '@nestjs/common';
import { PlatformError } from '../../../core/errors/platform-error.js';
import type {
  AiModelProfile,
  AiProviderListResult,
  AiProviderProfile,
  AiProviderRequest,
  AiProviderValidationIssue,
  AiProviderValidationResult,
} from '../interfaces/ai-provider.interface.js';
import { BUILT_IN_AI_PROVIDER_PROFILES } from './ai-provider-profiles.js';

@Injectable()
export class AiProviderRegistryService {
  private readonly providers = new Map<string, AiProviderProfile>();

  constructor() {
    for (const profile of BUILT_IN_AI_PROVIDER_PROFILES) {
      this.register(profile);
    }
  }

  register(profile: AiProviderProfile): void {
    if (this.providers.has(profile.id)) {
      throw new PlatformError({
        code: 'AI_PROVIDER_ALREADY_REGISTERED',
        message: `AI provider "${profile.id}" is already registered.`,
        reason: 'AI provider IDs must be unique.',
        suggestion: 'Use a unique provider ID for the provider adapter profile.',
      });
    }
    this.providers.set(profile.id, profile);
  }

  list(): AiProviderListResult {
    return {
      providers: [...this.providers.values()],
    };
  }

  get(providerId: string): AiProviderProfile {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new PlatformError({
        code: 'AI_PROVIDER_NOT_FOUND',
        message: `AI provider "${providerId}" is not registered.`,
        reason: 'The provider registry could not resolve the requested provider.',
        suggestion: 'Call ai.providers to inspect available provider IDs.',
      });
    }
    return provider;
  }

  validateRequest(request: AiProviderRequest): AiProviderValidationResult {
    const issues: AiProviderValidationIssue[] = [];
    const provider = request.providerId ? this.providers.get(request.providerId) : undefined;
    const model = provider && request.modelId ? this.findModel(provider, request.modelId) : undefined;

    if (request.providerId && !provider) {
      issues.push({
        field: 'providerId',
        message: `Provider "${request.providerId}" is not registered.`,
        suggestion: 'Use a provider returned by ai.providers.',
      });
    }

    if (provider && request.modelId && !model) {
      issues.push({
        field: 'modelId',
        message: `Model "${request.modelId}" is not registered for provider "${provider.id}".`,
        suggestion: 'Use a model returned by ai.provider_metadata.',
      });
    }

    const candidateModels = provider ? provider.models : this.list().providers.flatMap((item) => item.models);
    const capabilityMatches = candidateModels.some((candidate) => candidate.capabilities.includes(request.capability));
    if (!capabilityMatches) {
      issues.push({
        field: 'capability',
        message: `No model supports capability "${request.capability}".`,
        suggestion: 'Choose a supported capability or provider/model pair.',
      });
    }

    const selectedModel = model ?? (provider ? provider.models[0] : undefined);
    if (selectedModel && request.requiredContextTokens && request.requiredContextTokens > selectedModel.contextWindowTokens) {
      issues.push({
        field: 'requiredContextTokens',
        message: `Requested context ${request.requiredContextTokens} exceeds model limit ${selectedModel.contextWindowTokens}.`,
        suggestion: 'Reduce context size or choose a model with a larger context window.',
      });
    }

    if (selectedModel && request.requireJsonMode && !selectedModel.capabilities.includes('json_mode')) {
      issues.push({
        field: 'requireJsonMode',
        message: `Model "${selectedModel.id}" does not support JSON mode.`,
        suggestion: 'Choose a model with json_mode capability.',
      });
    }

    if (selectedModel && request.requireToolUse && !selectedModel.capabilities.includes('tool_use')) {
      issues.push({
        field: 'requireToolUse',
        message: `Model "${selectedModel.id}" does not support tool use.`,
        suggestion: 'Choose a model with tool_use capability.',
      });
    }

    return {
      valid: issues.length === 0,
      ...(provider ? { provider } : {}),
      ...(model ? { model } : {}),
      issues,
    };
  }

  findModel(provider: AiProviderProfile, modelId: string): AiModelProfile | undefined {
    return provider.models.find((model) => model.id === modelId);
  }
}
