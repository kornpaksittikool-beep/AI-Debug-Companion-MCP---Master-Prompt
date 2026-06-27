import { ErrorMapperService } from '../../src/core/errors/error-mapper.service.js';
import { PlatformError } from '../../src/core/errors/platform-error.js';

describe('ErrorMapperService', () => {
  it('maps platform errors to the standard envelope', () => {
    const mapper = new ErrorMapperService();
    const envelope = mapper.toEnvelope(
      new PlatformError({
        code: 'TEST_ERROR',
        message: 'Test failed.',
        reason: 'The test intentionally failed.',
        suggestion: 'Use a passing test.',
      }),
      'corr_123',
    );

    expect(envelope).toEqual({
      code: 'TEST_ERROR',
      message: 'Test failed.',
      reason: 'The test intentionally failed.',
      suggestion: 'Use a passing test.',
      correlationId: 'corr_123',
    });
  });

  it('maps unknown errors to internal errors', () => {
    const mapper = new ErrorMapperService();
    const envelope = mapper.toEnvelope(new Error('boom'), 'corr_123');

    expect(envelope.code).toBe('INTERNAL_ERROR');
    expect(envelope.reason).toBe('boom');
    expect(envelope.correlationId).toBe('corr_123');
  });
});
