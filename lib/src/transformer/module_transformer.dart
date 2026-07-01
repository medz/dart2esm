import '../ast/esm_ast.dart';
import '../lowering/kernel_to_esm_ast.dart';

final class TransformerReturn {
  const TransformerReturn({
    required this.lowering,
    required this.module,
    required this.changed,
    required this.invalidatesSemantic,
  });

  final LowererReturn lowering;
  final EsmModule module;
  final bool changed;
  final bool invalidatesSemantic;

  get runtimeHelpers => lowering.runtimeHelpers;
}

final class Transformer {
  const Transformer();

  TransformerReturn transform(LowererReturn lowering) {
    final normalized = _normalizeModuleItems(lowering.module.items);
    return TransformerReturn(
      lowering: lowering,
      module: normalized.changed
          ? EsmModule(items: normalized.items)
          : lowering.module,
      changed: normalized.changed,
      invalidatesSemantic: false,
    );
  }

  ({List<EsmModuleItem> items, bool changed}) _normalizeModuleItems(
    Iterable<EsmModuleItem> items,
  ) {
    var changed = false;
    final normalized = <EsmModuleItem>[];
    for (final item in items) {
      switch (item) {
        case EsmRawModuleItem():
          if (item.source.trim().isEmpty) {
            changed = true;
            continue;
          }
          normalized.add(item);
        case EsmFunction():
          final body = _normalizeStatementList(item.body);
          if (body.changed) {
            changed = true;
            normalized.add(
              EsmFunction(
                name: item.name,
                export: item.export,
                parameters: item.parameters,
                body: body.statements,
              ),
            );
          } else {
            normalized.add(item);
          }
        case EsmClass():
          final klass = _normalizeClass(item);
          changed = changed || klass.changed;
          normalized.add(klass.item);
        case EsmStatement():
          final statement = _normalizeStatement(item);
          if (statement.changed) {
            changed = true;
          }
          final normalizedStatement = statement.statement;
          if (normalizedStatement == null) {
            changed = true;
            continue;
          }
          normalized.add(normalizedStatement);
      }
    }
    return (items: normalized, changed: changed);
  }

  ({EsmClass item, bool changed}) _normalizeClass(EsmClass item) {
    var changed = false;
    final constructor = item.constructor;
    EsmClassConstructor? normalizedConstructor;
    if (constructor != null) {
      final body = _normalizeStatementList(constructor.body);
      if (body.changed) {
        changed = true;
        normalizedConstructor = EsmClassConstructor(
          parameters: constructor.parameters,
          body: body.statements,
        );
      } else {
        normalizedConstructor = constructor;
      }
    }

    final methods = <EsmClassMethod>[];
    for (final method in item.methods) {
      final body = _normalizeStatementList(method.body);
      if (body.changed) {
        changed = true;
        methods.add(
          EsmClassMethod(
            key: method.key,
            kind: method.kind,
            isStatic: method.isStatic,
            parameters: method.parameters,
            body: body.statements,
          ),
        );
      } else {
        methods.add(method);
      }
    }

    if (!changed) {
      return (item: item, changed: false);
    }
    return (
      item: EsmClass(
        name: item.name,
        export: item.export,
        superclass: item.superclass,
        constructor: normalizedConstructor,
        methods: methods,
      ),
      changed: true,
    );
  }

  ({List<EsmStatement> statements, bool changed}) _normalizeStatementList(
    Iterable<EsmStatement> statements,
  ) {
    var changed = false;
    final normalized = <EsmStatement>[];
    for (final statement in statements) {
      final result = _normalizeStatement(statement);
      changed = changed || result.changed;
      final normalizedStatement = result.statement;
      if (normalizedStatement == null) {
        changed = true;
        continue;
      }
      normalized.add(normalizedStatement);
    }
    return (statements: normalized, changed: changed);
  }

  ({EsmStatement? statement, bool changed}) _normalizeStatement(
    EsmStatement statement,
  ) {
    switch (statement) {
      case EsmBlockStatement():
        final body = _normalizeStatementList(statement.body);
        if (body.statements.isEmpty) {
          return (statement: null, changed: true);
        }
        if (body.changed) {
          return (statement: EsmBlockStatement(body.statements), changed: true);
        }
        return (statement: statement, changed: false);
      case EsmLabeledStatement():
        final body = _normalizeStatement(statement.statement);
        if (!body.changed) {
          return (statement: statement, changed: false);
        }
        return (
          statement: EsmLabeledStatement(
            label: statement.label,
            statement: body.statement ?? const EsmBlockStatement([]),
          ),
          changed: true,
        );
      case EsmIfStatement():
        final thenBody = _normalizeStatementList(statement.thenBody);
        final otherwiseBody = statement.otherwiseBody == null
            ? null
            : _normalizeStatementList(statement.otherwiseBody!);
        if (!thenBody.changed &&
            (otherwiseBody == null || !otherwiseBody.changed)) {
          return (statement: statement, changed: false);
        }
        return (
          statement: EsmIfStatement(
            condition: statement.condition,
            thenBody: thenBody.statements,
            otherwiseBody: otherwiseBody?.statements,
          ),
          changed: true,
        );
      case EsmWhileStatement():
        final body = _normalizeStatementList(statement.body);
        if (!body.changed) {
          return (statement: statement, changed: false);
        }
        return (
          statement: EsmWhileStatement(
            condition: statement.condition,
            body: body.statements,
          ),
          changed: true,
        );
      case EsmDoStatement():
        final body = _normalizeStatementList(statement.body);
        if (!body.changed) {
          return (statement: statement, changed: false);
        }
        return (
          statement: EsmDoStatement(
            body: body.statements,
            condition: statement.condition,
          ),
          changed: true,
        );
      case EsmSwitchStatement():
        var changed = false;
        final cases = [
          for (final switchCase in statement.cases)
            () {
              final body = _normalizeStatementList(switchCase.body);
              if (!body.changed) {
                return switchCase;
              }
              changed = true;
              return EsmSwitchCase(
                expressions: switchCase.expressions,
                isDefault: switchCase.isDefault,
                body: body.statements,
              );
            }(),
        ];
        if (!changed) {
          return (statement: statement, changed: false);
        }
        return (
          statement: EsmSwitchStatement(
            expression: statement.expression,
            cases: cases,
          ),
          changed: true,
        );
      case EsmForStatement():
        final body = _normalizeStatementList(statement.body);
        if (!body.changed) {
          return (statement: statement, changed: false);
        }
        return (
          statement: EsmForStatement(
            initializers: statement.initializers,
            condition: statement.condition,
            updates: statement.updates,
            body: body.statements,
          ),
          changed: true,
        );
      case EsmTryStatement():
        final body = _normalizeStatementList(statement.body);
        final catchBody = statement.catchBody == null
            ? null
            : _normalizeStatementList(statement.catchBody!);
        final finallyBody = statement.finallyBody == null
            ? null
            : _normalizeStatementList(statement.finallyBody!);
        if (!body.changed &&
            (catchBody == null || !catchBody.changed) &&
            (finallyBody == null || !finallyBody.changed)) {
          return (statement: statement, changed: false);
        }
        return (
          statement: EsmTryStatement(
            body: body.statements,
            catchParameter: statement.catchParameter,
            catchBody: catchBody?.statements,
            finallyBody: finallyBody?.statements,
          ),
          changed: true,
        );
      case EsmExpressionStatement() ||
          EsmBreakStatement() ||
          EsmContinueStatement() ||
          EsmVariableDeclaration() ||
          EsmReturnStatement() ||
          EsmThrowStatement():
        return (statement: statement, changed: false);
    }
  }
}
