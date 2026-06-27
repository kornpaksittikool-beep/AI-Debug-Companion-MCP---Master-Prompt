export type AiProviderKind = 'hosted' | 'local' | 'router';
export type AiTransportKind = 'https' | 'local-http' | 'none';
export type AiCapability = 'chat' | 'tool_use' | 'json_mode' | 'vision' | 'embeddings';

export interface AiModelProfile {
  readonly id: string;
  readonly displayName: string;
  readonly capabilities: readonly AiCapability[];
  readonly contextWindowTokens: number;
  readonly maxOutputTokens: number;
}

export interface AiProviderProfile {
  readonly id: string;
  readonly displayName: string;
  readonly kind: AiProviderKind;
  readonly transport: AiTransportKind;
  readonly requiresApiKey: boolean;
  readonly safetyPolicy: string;
  readonly models: readonly AiModelProfile[];
}

export interface AiProviderListResult {
  readonly providers: readonly AiProviderProfile[];
}

export interface AiProviderMetadataInput {
  readonly providerId: string;
}

export interface AiProviderRequestMessage {
  readonly role: 'system' | 'user' | 'assistant' | 'tool';
  readonly content: string;
}

export interface AiProviderRequest {
  readonly providerId?: string;
  readonly modelId?: string;
  readonly capability: AiCapability;
  readonly messages?: readonly AiProviderRequestMessage[];
  readonly prompt?: string;
  readonly requiredContextTokens?: number;
  readonly requireJsonMode?: boolean;
  readonly requireToolUse?: boolean;
}

export interface AiProviderValidationIssue {
  readonly field: string;
  readonly message: string;
  readonly suggestion: string;
}

export interface AiProviderValidationResult {
  readonly valid: boolean;
  readonly provider?: AiProviderProfile;
  readonly model?: AiModelProfile;
  readonly issues: readonly AiProviderValidationIssue[];
}

export interface AiRouteRequestInput extends AiProviderRequest {
  readonly preferredProviderIds?: readonly string[];
  readonly excludedProviderIds?: readonly string[];
}

export interface AiRouteCandidate {
  readonly providerId: string;
  readonly modelId: string;
  readonly reason: string;
}

export interface AiRoutePlan {
  readonly selected?: AiRouteCandidate;
  readonly fallbackCandidates: readonly AiRouteCandidate[];
  readonly rejectedCandidates: readonly AiRouteCandidate[];
}

export interface AiNormalizedResponse {
  readonly providerId: string;
  readonly modelId: string;
  readonly content: string;
  readonly finishReason: 'stop' | 'length' | 'tool_call' | 'error';
  readonly usage?: {
    readonly inputTokens?: number;
    readonly outputTokens?: number;
  };
}
