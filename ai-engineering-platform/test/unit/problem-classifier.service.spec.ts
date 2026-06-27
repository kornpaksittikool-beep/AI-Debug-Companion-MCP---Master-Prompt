import { ProblemClassifierService } from '../../src/modules/investigation/services/problem-classifier.service.js';

describe('ProblemClassifierService', () => {
  const classifier = new ProblemClassifierService();

  it.each([
    ['TypeError: failed to read property', 'error'],
    ['at Service.method (src/service.ts:10:5)', 'stack_trace'],
    ['timestamp=2026-06-27 warn slow query', 'log'],
    ['Screenshot attached showing broken UI', 'screenshot'],
    ['Bug in checkout flow', 'issue'],
    ['Feature request: add approval workflow', 'feature_request'],
    ['Please review this behavior', 'unknown'],
  ] as const)('classifies %s as %s', (input, expected) => {
    expect(classifier.classify(input)).toBe(expected);
  });
});
