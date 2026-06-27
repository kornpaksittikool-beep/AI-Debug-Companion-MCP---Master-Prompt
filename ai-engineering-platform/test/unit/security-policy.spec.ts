import { CommandPolicyService } from '../../src/core/security/command-policy.service.js';
import { PathPolicyService } from '../../src/core/security/path-policy.service.js';

describe('Security policy services', () => {
  it('allows only commands from the allow list', () => {
    const policy = new CommandPolicyService();

    expect(policy.isAllowed('pnpm test', ['pnpm test'])).toBe(true);
    expect(policy.isAllowed('rm -rf /', ['pnpm test'])).toBe(false);
  });

  it('rejects paths outside the configured root', () => {
    const policy = new PathPolicyService();

    expect(policy.isPathInsideRoot('/workspace/project/src/index.ts', '/workspace/project')).toBe(
      true,
    );
    expect(policy.isPathInsideRoot('/workspace/other/index.ts', '/workspace/project')).toBe(false);
  });
});
