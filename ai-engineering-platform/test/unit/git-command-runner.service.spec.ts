import { GitCommandRunnerService } from '../../src/modules/git-intelligence/services/git-command-runner.service.js';

describe('GitCommandRunnerService', () => {
  it('rejects git subcommands outside the read-only allow list', async () => {
    const runner = new GitCommandRunnerService();

    await expect(runner.run(process.cwd(), ['commit', '-m', 'blocked'])).rejects.toThrow(
      'Git command is not allowed',
    );
  });

  it('rejects output-writing git options', async () => {
    const runner = new GitCommandRunnerService();

    await expect(runner.run(process.cwd(), ['log', '--output=result.txt'])).rejects.toThrow(
      'Git command output redirection is not allowed',
    );
  });
});
