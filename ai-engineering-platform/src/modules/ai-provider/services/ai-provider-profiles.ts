import type { AiProviderProfile } from '../interfaces/ai-provider.interface.js';

export const BUILT_IN_AI_PROVIDER_PROFILES: readonly AiProviderProfile[] = [
  {
    id: 'openai',
    displayName: 'OpenAI',
    kind: 'hosted',
    transport: 'https',
    requiresApiKey: true,
    safetyPolicy: 'Hosted provider profile. Requests must be routed through an adapter before execution.',
    models: [
      {
        id: 'gpt-5',
        displayName: 'GPT-5',
        capabilities: ['chat', 'tool_use', 'json_mode', 'vision', 'embeddings'],
        contextWindowTokens: 128000,
        maxOutputTokens: 16000,
      },
    ],
  },
  {
    id: 'claude',
    displayName: 'Claude',
    kind: 'hosted',
    transport: 'https',
    requiresApiKey: true,
    safetyPolicy: 'Hosted provider profile. Requests must be routed through an adapter before execution.',
    models: [
      {
        id: 'claude-sonnet',
        displayName: 'Claude Sonnet',
        capabilities: ['chat', 'tool_use', 'json_mode', 'vision'],
        contextWindowTokens: 200000,
        maxOutputTokens: 16000,
      },
    ],
  },
  {
    id: 'gemini',
    displayName: 'Gemini',
    kind: 'hosted',
    transport: 'https',
    requiresApiKey: true,
    safetyPolicy: 'Hosted provider profile. Requests must be routed through an adapter before execution.',
    models: [
      {
        id: 'gemini-pro',
        displayName: 'Gemini Pro',
        capabilities: ['chat', 'tool_use', 'json_mode', 'vision'],
        contextWindowTokens: 1000000,
        maxOutputTokens: 8192,
      },
    ],
  },
  {
    id: 'deepseek',
    displayName: 'DeepSeek',
    kind: 'hosted',
    transport: 'https',
    requiresApiKey: true,
    safetyPolicy: 'Hosted provider profile. Requests must be routed through an adapter before execution.',
    models: [
      {
        id: 'deepseek-chat',
        displayName: 'DeepSeek Chat',
        capabilities: ['chat', 'json_mode'],
        contextWindowTokens: 64000,
        maxOutputTokens: 8192,
      },
    ],
  },
  {
    id: 'ollama',
    displayName: 'Ollama',
    kind: 'local',
    transport: 'local-http',
    requiresApiKey: false,
    safetyPolicy: 'Local provider profile. Execution must stay behind an explicit local adapter.',
    models: [
      {
        id: 'ollama-local',
        displayName: 'Ollama Local Model',
        capabilities: ['chat', 'json_mode'],
        contextWindowTokens: 32000,
        maxOutputTokens: 4096,
      },
    ],
  },
  {
    id: 'openrouter',
    displayName: 'OpenRouter',
    kind: 'router',
    transport: 'https',
    requiresApiKey: true,
    safetyPolicy: 'Router provider profile. Downstream model selection must remain explicit.',
    models: [
      {
        id: 'openrouter-auto',
        displayName: 'OpenRouter Explicit Model Route',
        capabilities: ['chat', 'tool_use', 'json_mode', 'vision'],
        contextWindowTokens: 128000,
        maxOutputTokens: 8192,
      },
    ],
  },
  {
    id: 'local-llm',
    displayName: 'Local LLM',
    kind: 'local',
    transport: 'none',
    requiresApiKey: false,
    safetyPolicy: 'Local profile placeholder. A concrete local adapter must declare its own transport before execution.',
    models: [
      {
        id: 'local-default',
        displayName: 'Local Default Model',
        capabilities: ['chat'],
        contextWindowTokens: 16000,
        maxOutputTokens: 2048,
      },
    ],
  },
];
