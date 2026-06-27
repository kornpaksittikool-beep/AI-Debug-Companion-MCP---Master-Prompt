import { Injectable } from '@nestjs/common';
import * as path from 'node:path';
import * as ts from 'typescript';
import type {
  RepositoryCallEdge,
  RepositoryImportEdge,
} from '../interfaces/repository-intelligence.interface.js';
import { RepositorySafetyService } from './repository-safety.service.js';

const SUPPORTED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

interface RawImportEdge {
  readonly sourceFile: string;
  readonly specifier: string;
  readonly kind: 'static' | 're_export' | 'dynamic';
  readonly line: number;
}

@Injectable()
export class TypeScriptGraphParserService {
  readonly language = 'typescript-javascript';

  constructor(private readonly safety: RepositorySafetyService) {}

  supportsFile(filePath: string): boolean {
    return SUPPORTED_EXTENSIONS.has(path.extname(filePath).toLowerCase());
  }

  parseImports(content: string, filePath: string, rootPath: string): readonly RepositoryImportEdge[] {
    const sourceFile = this.createSourceFile(content, filePath);
    const edges: RawImportEdge[] = [];

    const visit = (node: ts.Node): void => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        edges.push(this.createRawImport(sourceFile, filePath, node.moduleSpecifier.text, 'static', node));
      }

      if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        edges.push(this.createRawImport(sourceFile, filePath, node.moduleSpecifier.text, 're_export', node));
      }

      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        edges.push(this.createRawImport(sourceFile, filePath, node.arguments[0].text, 'dynamic', node));
      }

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    return edges.map((edge) => ({
      ...edge,
      sourceRelativePath: this.safety.toRelative(rootPath, edge.sourceFile),
      unresolved: true,
    }));
  }

  parseCalls(content: string, filePath: string, rootPath: string): readonly RepositoryCallEdge[] {
    const sourceFile = this.createSourceFile(content, filePath);
    const edges: RepositoryCallEdge[] = [];

    const visit = (node: ts.Node, callerName = '<module>'): void => {
      const nextCaller = this.callerName(node) ?? callerName;
      if (ts.isCallExpression(node) && node.expression.kind !== ts.SyntaxKind.ImportKeyword) {
        const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        edges.push({
          sourceFile: filePath,
          sourceRelativePath: this.safety.toRelative(rootPath, filePath),
          callerName,
          calleeName: this.truncate(node.expression.getText(sourceFile)),
          line: position.line + 1,
        });
      }

      ts.forEachChild(node, (child) => visit(child, nextCaller));
    };

    ts.forEachChild(sourceFile, (node) => visit(node));
    return edges;
  }

  private createSourceFile(content: string, filePath: string): ts.SourceFile {
    return ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, this.resolveScriptKind(filePath));
  }

  private createRawImport(
    sourceFile: ts.SourceFile,
    filePath: string,
    specifier: string,
    kind: 'static' | 're_export' | 'dynamic',
    node: ts.Node,
  ): RawImportEdge {
    const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    return {
      sourceFile: filePath,
      specifier,
      kind,
      line: position.line + 1,
    };
  }

  private callerName(node: ts.Node): string | undefined {
    if (ts.isFunctionDeclaration(node) && node.name) {
      return node.name.text;
    }
    if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
      return node.name.text;
    }
    if (ts.isClassDeclaration(node) && node.name) {
      return node.name.text;
    }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      return node.name.text;
    }
    return undefined;
  }

  private truncate(value: string): string {
    const normalized = value.replace(/\s+/g, ' ').trim();
    return normalized.length > 240 ? `${normalized.slice(0, 237)}...` : normalized;
  }

  private resolveScriptKind(filePath: string): ts.ScriptKind {
    switch (path.extname(filePath).toLowerCase()) {
      case '.tsx':
        return ts.ScriptKind.TSX;
      case '.jsx':
        return ts.ScriptKind.JSX;
      case '.js':
        return ts.ScriptKind.JS;
      default:
        return ts.ScriptKind.TS;
    }
  }
}
