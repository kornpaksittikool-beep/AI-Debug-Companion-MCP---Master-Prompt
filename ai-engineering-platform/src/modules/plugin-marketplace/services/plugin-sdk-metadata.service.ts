import { Injectable } from '@nestjs/common';
import type { PluginSdkMetadata } from '../interfaces/plugin-marketplace.interface.js';

@Injectable()
export class PluginSdkMetadataService {
  metadata(): PluginSdkMetadata {
    return {
      languagePluginSdk: {
        version: '1.0.0',
        requiredCapabilities: ['parse_source', 'return_symbols', 'declare_supported_extensions'],
        extensionPoints: ['repository.symbol_parser', 'repository.context_reader'],
      },
      externalToolPluginSdk: {
        version: '1.0.0',
        requiredCapabilities: ['declare_tools', 'declare_permissions', 'declare_command_policy'],
        securityRequirements: [
          'Commands must use allow-listed executable names.',
          'File access must declare bounded roots.',
          'Network access must be explicit in permissions.',
        ],
      },
    };
  }
}
