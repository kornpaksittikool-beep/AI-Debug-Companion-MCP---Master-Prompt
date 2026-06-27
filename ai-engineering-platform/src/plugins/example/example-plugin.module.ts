import { Module, OnModuleInit } from '@nestjs/common';
import { CoreModule } from '../../core/core.module.js';
import { ToolRegistryService } from '../../core/registry/services/tool-registry.service.js';
import { ExampleEchoTool, ExamplePluginService } from './example-plugin.service.js';

@Module({
  imports: [CoreModule],
  providers: [ExampleEchoTool, ExamplePluginService],
  exports: [ExamplePluginService],
})
export class ExamplePluginModule implements OnModuleInit {
  constructor(
    private readonly registry: ToolRegistryService,
    private readonly plugin: ExamplePluginService,
  ) {}

  onModuleInit(): void {
    for (const tool of this.plugin.getTools()) {
      this.registry.register(tool.definition, tool.handler);
    }
  }
}
