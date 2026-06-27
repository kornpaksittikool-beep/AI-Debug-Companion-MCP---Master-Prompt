import { Injectable } from '@nestjs/common';
import type {
  AiModelProfile,
  AiProviderProfile,
  AiRouteCandidate,
  AiRoutePlan,
  AiRouteRequestInput,
} from '../interfaces/ai-provider.interface.js';
import { AiProviderRegistryService } from './ai-provider-registry.service.js';

@Injectable()
export class AiRoutingService {
  constructor(private readonly registry: AiProviderRegistryService) {}

  route(input: AiRouteRequestInput): AiRoutePlan {
    const excluded = new Set(input.excludedProviderIds ?? []);
    const preferred = input.preferredProviderIds ?? [];
    const providers = this.orderedProviders(preferred).filter((provider) => {
      const includedByRequest = input.providerId ? provider.id === input.providerId : true;
      return includedByRequest && !excluded.has(provider.id);
    });
    const accepted: AiRouteCandidate[] = [];
    const rejected: AiRouteCandidate[] = [];

    for (const provider of providers) {
      for (const model of provider.models) {
        const reason = this.rejectionReason(provider, model, input);
        const candidate: AiRouteCandidate = {
          providerId: provider.id,
          modelId: model.id,
          reason: reason ?? this.acceptanceReason(provider, model, input),
        };
        if (reason) {
          rejected.push(candidate);
        } else {
          accepted.push(candidate);
        }
      }
    }

    const [selected, ...fallbackCandidates] = accepted;
    return {
      ...(selected ? { selected } : {}),
      fallbackCandidates,
      rejectedCandidates: rejected,
    };
  }

  private orderedProviders(preferredProviderIds: readonly string[]): readonly AiProviderProfile[] {
    const providers = this.registry.list().providers;
    if (preferredProviderIds.length === 0) {
      return providers;
    }
    const priority = new Map(preferredProviderIds.map((providerId, index) => [providerId, index]));
    return [...providers].sort((left, right) => {
      const leftRank = priority.get(left.id) ?? Number.MAX_SAFE_INTEGER;
      const rightRank = priority.get(right.id) ?? Number.MAX_SAFE_INTEGER;
      return leftRank - rightRank || left.id.localeCompare(right.id);
    });
  }

  private rejectionReason(
    provider: AiProviderProfile,
    model: AiModelProfile,
    input: AiRouteRequestInput,
  ): string | undefined {
    if (input.providerId && input.providerId !== provider.id) {
      return `Provider ${provider.id} does not match requested provider ${input.providerId}.`;
    }
    if (input.modelId && input.modelId !== model.id) {
      return `Model ${model.id} does not match requested model ${input.modelId}.`;
    }
    if (!model.capabilities.includes(input.capability)) {
      return `Model ${model.id} does not support capability ${input.capability}.`;
    }
    if (input.requiredContextTokens && input.requiredContextTokens > model.contextWindowTokens) {
      return `Requested context ${input.requiredContextTokens} exceeds model limit ${model.contextWindowTokens}.`;
    }
    if (input.requireJsonMode && !model.capabilities.includes('json_mode')) {
      return `Model ${model.id} does not support JSON mode.`;
    }
    if (input.requireToolUse && !model.capabilities.includes('tool_use')) {
      return `Model ${model.id} does not support tool use.`;
    }
    return undefined;
  }

  private acceptanceReason(
    provider: AiProviderProfile,
    model: AiModelProfile,
    input: AiRouteRequestInput,
  ): string {
    return `${provider.displayName} ${model.displayName} supports ${input.capability} with ${model.contextWindowTokens} context tokens.`;
  }
}
