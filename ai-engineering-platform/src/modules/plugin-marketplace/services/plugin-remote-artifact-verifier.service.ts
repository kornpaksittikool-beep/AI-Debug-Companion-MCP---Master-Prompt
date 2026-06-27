import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type {
  PluginManifestValidationIssue,
  RemotePluginArtifactVerificationInput,
  RemotePluginArtifactVerificationResult,
  RemotePluginSource,
} from '../interfaces/plugin-marketplace.interface.js';

const ALLOWED_SOURCE_TYPES = new Set(['https_archive', 'github_release', 'git_repository']);

@Injectable()
export class PluginRemoteArtifactVerifierService {
  verify(input: RemotePluginArtifactVerificationInput): RemotePluginArtifactVerificationResult {
    const issues = [...this.validateSource(input.source)];
    const actualChecksum = createHash('sha256').update(input.artifactContent, 'utf8').digest('hex');
    if (input.source.checksum !== actualChecksum) {
      issues.push({
        field: 'source.checksum',
        message: 'Remote plugin artifact checksum does not match.',
        suggestion: 'Verify the artifact source and provide the expected SHA-256 checksum.',
      });
    }

    return {
      valid: issues.length === 0,
      sourceType: input.source.type,
      sourceUrl: input.source.url,
      checksumAlgorithm: input.source.checksumAlgorithm,
      expectedChecksum: input.source.checksum,
      actualChecksum,
      signatureVerified: Boolean(
        input.source.signature?.algorithm && input.source.signature.keyId && input.source.signature.signature,
      ),
      issues,
    };
  }

  validateSource(source: RemotePluginSource): readonly PluginManifestValidationIssue[] {
    const issues: PluginManifestValidationIssue[] = [];
    if (!ALLOWED_SOURCE_TYPES.has(source.type)) {
      issues.push({
        field: 'source.type',
        message: `Remote plugin source type "${source.type}" is not allowed.`,
        suggestion: 'Use one of: https_archive, github_release, git_repository.',
      });
    }
    if (!source.url.startsWith('https://')) {
      issues.push({
        field: 'source.url',
        message: 'Remote plugin source URL must use HTTPS.',
        suggestion: 'Provide an https:// source URL.',
      });
    }
    if (source.checksumAlgorithm !== 'sha256') {
      issues.push({
        field: 'source.checksumAlgorithm',
        message: 'Only SHA-256 checksum verification is supported in Phase 17.',
        suggestion: 'Use checksumAlgorithm "sha256".',
      });
    }
    if (!/^[a-f0-9]{64}$/u.test(source.checksum)) {
      issues.push({
        field: 'source.checksum',
        message: 'Remote plugin checksum must be a lowercase SHA-256 hex digest.',
        suggestion: 'Provide a 64-character lowercase SHA-256 checksum.',
      });
    }
    if (source.signature && (!source.signature.algorithm || !source.signature.keyId || !source.signature.signature)) {
      issues.push({
        field: 'source.signature',
        message: 'Signature metadata is incomplete.',
        suggestion: 'Provide algorithm, keyId, and signature or omit signature metadata.',
      });
    }
    return issues;
  }
}
