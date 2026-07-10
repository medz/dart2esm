import '../../ast/esm_ast.dart';
import '../transform_pass.dart';

final class ReleaseOptimizer implements TransformPass {
  const ReleaseOptimizer();

  @override
  TransformPassReturn apply(EsmModule module, TransformContext context) {
    if (!context.profile.isRelease) {
      return TransformPassReturn(module: module);
    }

    var changed = false;
    final items = <EsmModuleItem>[];
    for (final item in module.items) {
      switch (item) {
        case EsmFunction():
          final body = _optimizeStatements(item.body);
          if (!body.changed) {
            items.add(item);
            continue;
          }
          changed = true;
          items.add(
            EsmFunction(
              name: item.name,
              export: item.export,
              isAsync: item.isAsync,
              isGenerator: item.isGenerator,
              parameters: item.parameters,
              body: body.statements,
            ),
          );
        case EsmClass():
          final result = _optimizeClass(item);
          changed = changed || result.changed;
          items.add(result.item);
        case EsmStatement():
          final result = _optimizeStatement(item);
          changed = changed || result.changed || result.statements.length != 1;
          items.addAll(result.statements);
        case EsmRawModuleItem():
          items.add(item);
      }
    }
    return TransformPassReturn(
      module: changed ? EsmModule(items: items) : module,
    );
  }

  ({EsmClass item, bool changed}) _optimizeClass(EsmClass item) {
    var changed = false;
    final constructor = item.constructor;
    EsmClassConstructor? optimizedConstructor = constructor;
    if (constructor != null) {
      final body = _optimizeStatements(constructor.body);
      if (body.changed) {
        changed = true;
        optimizedConstructor = EsmClassConstructor(
          parameters: constructor.parameters,
          body: body.statements,
        );
      }
    }

    final methods = <EsmClassMethod>[];
    for (final method in item.methods) {
      final body = _optimizeStatements(method.body);
      if (!body.changed) {
        methods.add(method);
        continue;
      }
      changed = true;
      methods.add(
        EsmClassMethod(
          key: method.key,
          kind: method.kind,
          isStatic: method.isStatic,
          isAsync: method.isAsync,
          isGenerator: method.isGenerator,
          parameters: method.parameters,
          body: body.statements,
        ),
      );
    }
    if (!changed) return (item: item, changed: false);
    return (
      item: EsmClass(
        name: item.name,
        export: item.export,
        superclass: item.superclass,
        constructor: optimizedConstructor,
        methods: methods,
      ),
      changed: true,
    );
  }

  ({List<EsmStatement> statements, bool changed}) _optimizeStatements(
    Iterable<EsmStatement> statements,
  ) {
    var changed = false;
    final optimized = <EsmStatement>[];
    final source = statements.toList(growable: false);
    for (var index = 0; index < source.length; index++) {
      final result = _optimizeStatement(source[index]);
      changed = changed || result.changed || result.statements.length != 1;
      optimized.addAll(result.statements);
      if (optimized.isNotEmpty && _alwaysExits(optimized.last)) {
        if (index != source.length - 1) changed = true;
        break;
      }
    }
    return (statements: optimized, changed: changed);
  }

  ({List<EsmStatement> statements, bool changed}) _optimizeStatement(
    EsmStatement statement,
  ) {
    switch (statement) {
      case EsmBlockStatement():
        final body = _optimizeStatements(statement.body);
        if (!body.changed) return (statements: [statement], changed: false);
        return (
          statements: [EsmBlockStatement(body.statements)],
          changed: true,
        );
      case EsmLabeledStatement():
        final body = _optimizeStatement(statement.statement);
        if (!body.changed && body.statements.length == 1) {
          return (statements: [statement], changed: false);
        }
        return (
          statements: [
            EsmLabeledStatement(
              label: statement.label,
              statement: body.statements.length == 1
                  ? body.statements.single
                  : EsmBlockStatement(body.statements),
            ),
          ],
          changed: true,
        );
      case EsmIfStatement():
        final thenBody = _optimizeStatements(statement.thenBody);
        final otherwiseBody = statement.otherwiseBody == null
            ? null
            : _optimizeStatements(statement.otherwiseBody!);
        if (statement.condition case EsmBooleanLiteral(:final value)) {
          final selected = value
              ? thenBody.statements
              : otherwiseBody?.statements;
          if (selected == null || selected.isEmpty) {
            return (statements: const [], changed: true);
          }
          return (statements: [EsmBlockStatement(selected)], changed: true);
        }
        if (!thenBody.changed && !(otherwiseBody?.changed ?? false)) {
          return (statements: [statement], changed: false);
        }
        return (
          statements: [
            EsmIfStatement(
              condition: statement.condition,
              thenBody: thenBody.statements,
              otherwiseBody: otherwiseBody?.statements,
            ),
          ],
          changed: true,
        );
      case EsmWhileStatement():
        if (statement.condition case EsmBooleanLiteral(value: false)) {
          return (statements: const [], changed: true);
        }
        final body = _optimizeStatements(statement.body);
        if (!body.changed) return (statements: [statement], changed: false);
        return (
          statements: [
            EsmWhileStatement(
              condition: statement.condition,
              body: body.statements,
            ),
          ],
          changed: true,
        );
      case EsmDoStatement():
        final body = _optimizeStatements(statement.body);
        if (!body.changed) return (statements: [statement], changed: false);
        return (
          statements: [
            EsmDoStatement(
              body: body.statements,
              condition: statement.condition,
            ),
          ],
          changed: true,
        );
      case EsmSwitchStatement():
        var changed = false;
        final cases = <EsmSwitchCase>[];
        for (final switchCase in statement.cases) {
          final body = _optimizeStatements(switchCase.body);
          changed = changed || body.changed;
          cases.add(
            body.changed
                ? EsmSwitchCase(
                    expressions: switchCase.expressions,
                    isDefault: switchCase.isDefault,
                    body: body.statements,
                  )
                : switchCase,
          );
        }
        if (!changed) return (statements: [statement], changed: false);
        return (
          statements: [
            EsmSwitchStatement(expression: statement.expression, cases: cases),
          ],
          changed: true,
        );
      case EsmForStatement():
        final body = _optimizeStatements(statement.body);
        if (!body.changed) return (statements: [statement], changed: false);
        return (
          statements: [
            EsmForStatement(
              initializers: statement.initializers,
              condition: statement.condition,
              updates: statement.updates,
              body: body.statements,
            ),
          ],
          changed: true,
        );
      case EsmTryStatement():
        final body = _optimizeStatements(statement.body);
        final catchBody = statement.catchBody == null
            ? null
            : _optimizeStatements(statement.catchBody!);
        final finallyBody = statement.finallyBody == null
            ? null
            : _optimizeStatements(statement.finallyBody!);
        if (!body.changed &&
            !(catchBody?.changed ?? false) &&
            !(finallyBody?.changed ?? false)) {
          return (statements: [statement], changed: false);
        }
        return (
          statements: [
            EsmTryStatement(
              body: body.statements,
              catchParameter: statement.catchParameter,
              catchBody: catchBody?.statements,
              finallyBody: finallyBody?.statements,
            ),
          ],
          changed: true,
        );
      case EsmExpressionStatement() ||
          EsmVariableDeclaration() ||
          EsmReturnStatement() ||
          EsmYieldStatement() ||
          EsmThrowStatement() ||
          EsmBreakStatement() ||
          EsmContinueStatement():
        return (statements: [statement], changed: false);
    }
  }
}

bool _alwaysExits(EsmStatement statement) {
  return switch (statement) {
    EsmReturnStatement() ||
    EsmThrowStatement() ||
    EsmBreakStatement() ||
    EsmContinueStatement() => true,
    EsmBlockStatement(:final body) =>
      body.isNotEmpty && _alwaysExits(body.last),
    EsmIfStatement(:final thenBody, :final otherwiseBody) =>
      otherwiseBody != null &&
          thenBody.isNotEmpty &&
          otherwiseBody.isNotEmpty &&
          _alwaysExits(thenBody.last) &&
          _alwaysExits(otherwiseBody.last),
    _ => false,
  };
}
