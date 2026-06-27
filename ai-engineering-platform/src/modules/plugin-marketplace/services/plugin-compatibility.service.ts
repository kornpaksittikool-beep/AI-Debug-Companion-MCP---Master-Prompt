import { Injectable } from '@nestjs/common';
import type { PluginManifest } from '../../../plugins/plugin-api/plugin-manifest.interface.js';
import type {
  PluginCompatibilityCheck,
  PluginCompatibilityInput,
  PluginCompatibilityResult,
} from '../interfaces/plugin-marketplace.interface.js';

const PLATFORM_VERSION = '0.1.0';
const DEFAULT_NODE_VERSION = '22.0.0';
const SUPPORTED_RUNTIMES = ['node', 'python', 'external'] as const;

type VersionTuple = readonly [number, number, number];

@Injectable()
export class PluginCompatibilityService {
  resolve(input: PluginCompatibilityInput): PluginCompatibilityResult {
    const checks: PluginCompatibilityCheck[] = [];
    const compatibility = input.manifest.compatibility;

    if (!compatibility) {
      return {
        compatible: false,
        checks: [
          {
            target: 'platform',
            required: 'declared compatibility metadata',
            actual: 'missing',
            compatible: false,
            reason: 'Plugin manifest does not declare compatibility metadata.',
          },
        ],
      };
    }

    const platformVersion = input.platformVersion ?? PLATFORM_VERSION;
    checks.push(
      this.checkRange('platform', compatibility.platformVersionRange, platformVersion),
    );

    if (compatibility.nodeVersionRange) {
      checks.push(
        this.checkRange('node', compatibility.nodeVersionRange, input.nodeVersion ?? DEFAULT_NODE_VERSION),
      );
    }

    checks.push({
      target: 'runtime',
      required: SUPPORTED_RUNTIMES.join(', '),
      actual: compatibility.runtime,
      compatible: SUPPORTED_RUNTIMES.includes(compatibility.runtime),
      reason: SUPPORTED_RUNTIMES.includes(compatibility.runtime)
        ? 'Runtime is supported by the marketplace contract.'
        : 'Runtime is not supported by the marketplace contract.',
    });

    return {
      compatible: checks.every((check) => check.compatible),
      checks,
    };
  }

  resolveManifest(manifest: PluginManifest): PluginCompatibilityResult {
    return this.resolve({ manifest });
  }

  private checkRange(
    target: PluginCompatibilityCheck['target'],
    required: string,
    actual: string,
  ): PluginCompatibilityCheck {
    const compatible = this.satisfiesRange(actual, required);
    return {
      target,
      required,
      actual,
      compatible,
      reason: compatible
        ? `${actual} satisfies ${required}.`
        : `${actual} does not satisfy ${required}.`,
    };
  }

  private satisfiesRange(version: string, range: string): boolean {
    const actual = this.parseVersion(version);
    const comparators = range
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (comparators.length === 0) {
      return false;
    }

    return comparators.every((comparator) => this.satisfiesComparator(actual, comparator));
  }

  private satisfiesComparator(actual: VersionTuple, comparator: string): boolean {
    const match = /^(>=|<=|>|<|=)?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/.exec(comparator);
    if (!match) {
      return false;
    }
    const operator = match[1] ?? '=';
    const expected: VersionTuple = [
      Number(match[2]),
      match[3] ? Number(match[3]) : 0,
      match[4] ? Number(match[4]) : 0,
    ];
    const comparison = this.compareVersions(actual, expected);

    switch (operator) {
      case '>':
        return comparison > 0;
      case '>=':
        return comparison >= 0;
      case '<':
        return comparison < 0;
      case '<=':
        return comparison <= 0;
      case '=':
        return comparison === 0;
      default:
        return false;
    }
  }

  private parseVersion(version: string): VersionTuple {
    const match = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?/.exec(version);
    if (!match) {
      return [0, 0, 0];
    }
    return [
      Number(match[1]),
      match[2] ? Number(match[2]) : 0,
      match[3] ? Number(match[3]) : 0,
    ];
  }

  private compareVersions(left: VersionTuple, right: VersionTuple): number {
    const differences = [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
    for (const difference of differences) {
      if (difference !== 0) {
        return difference;
      }
    }
    return 0;
  }
}
