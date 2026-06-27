import { Injectable } from '@nestjs/common';
import * as path from 'node:path';
import * as ts from 'typescript';
import type {
  LanguageParser,
  RepositorySymbol,
  RepositorySymbolKind,
} from '../interfaces/repository-intelligence.interface.js';
import { RepositorySafetyService } from './repository-safety.service.js';

const SUPPORTED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

@Injectable()
export class TypeScriptSymbolParserService implements LanguageParser {
  readonly language = 'typescript-javascript';

  constructor(private readonly safety: RepositorySafetyService) {}

  supportsFile(filePath: string): boolean {
    return SUPPORTED_EXTENSIONS.has(path.extname(filePath).toLowerCase());
  }

  parseSymbols(content: string, filePath: string): readonly RepositorySymbol[] {
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      this.resolveScriptKind(filePath),
    );
    const rootPath = path.dirname(filePath);
    const symbols: RepositorySymbol[] = [];

    const visit = (node: ts.Node, containerName?: string): void => {
      const symbol = this.nodeToSymbol(sourceFile, rootPath, node, containerName);
      if (symbol) {
        symbols.push(symbol);
      }

      const nextContainer = symbol?.kind === 'class' || symbol?.kind === 'interface' ? symbol.name : containerName;
      ts.forEachChild(node, (child: ts.Node) => visit(child, nextContainer));
    };

    ts.forEachChild(sourceFile, (node: ts.Node) => visit(node));
    return symbols;
  }

  private nodeToSymbol(
    sourceFile: ts.SourceFile,
    rootPath: string,
    node: ts.Node,
    containerName?: string,
  ): RepositorySymbol | undefined {
    if (ts.isClassDeclaration(node) && node.name) {
      return this.createSymbol(sourceFile, rootPath, node, 'class', node.name.text, containerName);
    }

    if (ts.isFunctionDeclaration(node) && node.name) {
      return this.createSymbol(sourceFile, rootPath, node, 'function', node.name.text, containerName);
    }

    if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
      return this.createSymbol(sourceFile, rootPath, node, 'method', node.name.text, containerName);
    }

    if (ts.isInterfaceDeclaration(node)) {
      return this.createSymbol(sourceFile, rootPath, node, 'interface', node.name.text, containerName);
    }

    if (ts.isTypeAliasDeclaration(node)) {
      return this.createSymbol(sourceFile, rootPath, node, 'type', node.name.text, containerName);
    }

    if (ts.isEnumDeclaration(node)) {
      return this.createSymbol(sourceFile, rootPath, node, 'enum', node.name.text, containerName);
    }

    if (ts.isVariableStatement(node)) {
      return this.variableStatementToSymbol(sourceFile, rootPath, node, containerName);
    }

    return undefined;
  }

  private variableStatementToSymbol(
    sourceFile: ts.SourceFile,
    rootPath: string,
    node: ts.VariableStatement,
    containerName?: string,
  ): RepositorySymbol | undefined {
    const declaration = node.declarationList.declarations[0];
    if (!declaration || !ts.isIdentifier(declaration.name)) {
      return undefined;
    }

    return this.createSymbol(sourceFile, rootPath, node, 'variable', declaration.name.text, containerName);
  }

  private createSymbol(
    sourceFile: ts.SourceFile,
    rootPath: string,
    node: ts.Node,
    kind: RepositorySymbolKind,
    name: string,
    containerName?: string,
  ): RepositorySymbol {
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    const filePath = sourceFile.fileName;
    return {
      name,
      kind,
      filePath,
      relativePath: this.safety.toRelative(rootPath, filePath),
      startLine: start.line + 1,
      endLine: end.line + 1,
      exported: this.isExported(node),
      ...(containerName ? { containerName } : {}),
      signature: this.extractSignature(sourceFile, node),
    };
  }

  private extractSignature(sourceFile: ts.SourceFile, node: ts.Node): string {
    const text = node.getText(sourceFile).split('\n')[0]?.trim() ?? '';
    return text.length > 240 ? `${text.slice(0, 237)}...` : text;
  }

  private isExported(node: ts.Node): boolean {
    return (
      ts.canHaveModifiers(node) &&
      Boolean(
        ts
          .getModifiers(node)
          ?.some((modifier: ts.ModifierLike) => modifier.kind === ts.SyntaxKind.ExportKeyword),
      )
    );
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
