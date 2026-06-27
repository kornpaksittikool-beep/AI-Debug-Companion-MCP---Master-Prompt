import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { McpExecutionService } from '../../src/core/mcp/services/mcp-execution.service.js';
import { ToolRegistryService } from '../../src/core/registry/services/tool-registry.service.js';

describe('InvestigationModule integration', () => {
  it('registers investigation tools through the registry', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const registry = moduleRef.get(ToolRegistryService);
    const toolNames = registry.list().map((tool) => tool.name);

    expect(toolNames).toEqual(
      expect.arrayContaining([
        'investigation.create',
        'investigation.add_evidence',
        'investigation.add_hypothesis',
        'investigation.record_visit',
        'investigation.summarize',
        'investigation.close',
      ]),
    );

    await moduleRef.close();
  });

  it('executes an investigation lifecycle through core execution', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();

    const execution = moduleRef.get(McpExecutionService);
    const created = await execution.execute({
      toolName: 'investigation.create',
      input: { input: 'Error: failed to save invoice' },
      correlationId: 'corr_create',
    });

    expect(created.ok).toBe(true);
    if (!created.ok) {
      throw new Error('Expected investigation.create to succeed.');
    }

    const sessionId = created.output.id as string;
    const withEvidence = await execution.execute({
      toolName: 'investigation.add_evidence',
      input: {
        sessionId,
        sourceType: 'user_input',
        source: 'bug report',
        summary: 'Invoice save failed.',
      },
      correlationId: 'corr_evidence',
    });

    expect(withEvidence.ok).toBe(true);

    await moduleRef.close();
  });
});
