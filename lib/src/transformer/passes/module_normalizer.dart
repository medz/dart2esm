import '../../ast/esm_ast.dart';
import '../transform_pass.dart';

final class ModuleNormalizer implements TransformPass {
  const ModuleNormalizer();

  @override
  TransformPassReturn apply(EsmModule module, TransformContext context) {
    final normalized = _normalizeModuleItems(module.items);
    return TransformPassReturn(
      module: normalized.changed ? EsmModule(items: normalized.items) : module,
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
                isAsync: item.isAsync,
                isGenerator: item.isGenerator,
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
            isAsync: method.isAsync,
            isGenerator: method.isGenerator,
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
        final condition = statement.condition == null
            ? null
            : _normalizeExpression(statement.condition!);
        final updates = [
          for (final update in statement.updates) _normalizeExpression(update),
        ];
        final initializers = [
          for (final initializer in statement.initializers)
            _normalizeVariableDeclaration(initializer).statement
                as EsmVariableDeclaration,
        ];
        final expressionChanged =
            (condition?.changed ?? false) ||
            updates.indexed.any((entry) => entry.$2.changed) ||
            initializers.indexed.any(
              (entry) => entry.$2 != statement.initializers[entry.$1],
            );
        if (!body.changed && !expressionChanged) {
          return (statement: statement, changed: false);
        }
        return (
          statement: EsmForStatement(
            initializers: initializers,
            condition: condition?.expression,
            updates: [for (final update in updates) update.expression],
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
      case EsmExpressionStatement():
        final expression = _normalizeExpression(statement.expression);
        if (!expression.changed) {
          return (statement: statement, changed: false);
        }
        return (
          statement: EsmExpressionStatement(expression.expression),
          changed: true,
        );
      case EsmVariableDeclaration():
        return _normalizeVariableDeclaration(statement);
      case EsmReturnStatement():
        final expression = statement.expression == null
            ? null
            : _normalizeExpression(statement.expression!);
        if (expression == null || !expression.changed) {
          return (statement: statement, changed: false);
        }
        return (
          statement: EsmReturnStatement(expression.expression),
          changed: true,
        );
      case EsmYieldStatement():
        final expression = _normalizeExpression(statement.expression);
        if (!expression.changed) {
          return (statement: statement, changed: false);
        }
        return (
          statement: EsmYieldStatement(
            expression: expression.expression,
            delegate: statement.delegate,
          ),
          changed: true,
        );
      case EsmThrowStatement():
        final expression = _normalizeExpression(statement.expression);
        if (!expression.changed) {
          return (statement: statement, changed: false);
        }
        return (
          statement: EsmThrowStatement(expression.expression),
          changed: true,
        );
      case EsmBreakStatement() || EsmContinueStatement():
        return (statement: statement, changed: false);
    }
  }

  ({EsmStatement statement, bool changed}) _normalizeVariableDeclaration(
    EsmVariableDeclaration statement,
  ) {
    final initializer = statement.initializer == null
        ? null
        : _normalizeExpression(statement.initializer!);
    if (initializer == null || !initializer.changed) {
      return (statement: statement, changed: false);
    }
    return (
      statement: EsmVariableDeclaration(
        binding: statement.binding,
        initializer: initializer.expression,
        mutable: statement.mutable,
        export: statement.export,
      ),
      changed: true,
    );
  }

  ({EsmExpression expression, bool changed}) _normalizeExpression(
    EsmExpression expression,
  ) {
    switch (expression) {
      case EsmCall():
        final callee = _normalizeExpression(expression.callee);
        final arguments = [
          for (final argument in expression.arguments)
            _normalizeExpression(argument),
        ];
        final normalized = EsmCall(
          callee: callee.expression,
          arguments: [for (final argument in arguments) argument.expression],
        );
        final varArgs = _normalizeObjectVarArgsCall(normalized);
        final changed =
            callee.changed ||
            arguments.any((argument) => argument.changed) ||
            varArgs.changed;
        return (expression: varArgs.expression, changed: changed);
      case EsmArrayLiteral():
        final elements = [
          for (final element in expression.elements)
            _normalizeExpression(element),
        ];
        if (!elements.any((element) => element.changed)) {
          return (expression: expression, changed: false);
        }
        return (
          expression: EsmArrayLiteral([
            for (final element in elements) element.expression,
          ]),
          changed: true,
        );
      case EsmObjectLiteral():
        var changed = false;
        final properties = [
          for (final property in expression.properties)
            () {
              final value = _normalizeExpression(property.value);
              changed = changed || value.changed;
              if (!value.changed) return property;
              return EsmObjectLiteralProperty(
                key: property.key,
                value: value.expression,
              );
            }(),
        ];
        if (!changed) return (expression: expression, changed: false);
        return (expression: EsmObjectLiteral(properties), changed: true);
      case EsmAssignment():
        final target = _normalizeExpression(expression.target);
        final value = _normalizeExpression(expression.value);
        if (!target.changed && !value.changed) {
          return (expression: expression, changed: false);
        }
        return (
          expression: EsmAssignment(
            target: target.expression,
            value: value.expression,
          ),
          changed: true,
        );
      case EsmBinary():
        final left = _normalizeExpression(expression.left);
        final right = _normalizeExpression(expression.right);
        if (!left.changed && !right.changed) {
          return (expression: expression, changed: false);
        }
        return (
          expression: EsmBinary(
            left: left.expression,
            operator: expression.operator,
            right: right.expression,
          ),
          changed: true,
        );
      case EsmUnary():
        final operand = _normalizeExpression(expression.operand);
        if (!operand.changed) return (expression: expression, changed: false);
        return (
          expression: EsmUnary(
            operator: expression.operator,
            operand: operand.expression,
          ),
          changed: true,
        );
      case EsmConditional():
        final condition = _normalizeExpression(expression.condition);
        final then = _normalizeExpression(expression.thenExpression);
        final otherwise = _normalizeExpression(expression.otherwiseExpression);
        if (!condition.changed && !then.changed && !otherwise.changed) {
          return (expression: expression, changed: false);
        }
        return (
          expression: EsmConditional(
            condition: condition.expression,
            thenExpression: then.expression,
            otherwiseExpression: otherwise.expression,
          ),
          changed: true,
        );
      case EsmNullishCoalesce():
        final left = _normalizeExpression(expression.left);
        final right = _normalizeExpression(expression.right);
        if (!left.changed && !right.changed) {
          return (expression: expression, changed: false);
        }
        return (
          expression: EsmNullishCoalesce(
            left: left.expression,
            right: right.expression,
          ),
          changed: true,
        );
      case EsmParenthesized():
        final inner = _normalizeExpression(expression.expression);
        if (!inner.changed) return (expression: expression, changed: false);
        return (expression: EsmParenthesized(inner.expression), changed: true);
      case EsmArrowFunction():
        final body = _normalizeExpression(expression.body);
        if (!body.changed) return (expression: expression, changed: false);
        return (
          expression: EsmArrowFunction(
            parameters: expression.parameters,
            body: body.expression,
          ),
          changed: true,
        );
      case EsmFunctionExpression():
        final body = _normalizeStatementList(expression.body);
        if (!body.changed) return (expression: expression, changed: false);
        return (
          expression: EsmFunctionExpression(
            parameters: expression.parameters,
            isAsync: expression.isAsync,
            isGenerator: expression.isGenerator,
            body: body.statements,
          ),
          changed: true,
        );
      case EsmArrowBlockFunction():
        final body = _normalizeStatementList(expression.body);
        if (!body.changed) return (expression: expression, changed: false);
        return (
          expression: EsmArrowBlockFunction(
            parameters: expression.parameters,
            isAsync: expression.isAsync,
            body: body.statements,
          ),
          changed: true,
        );
      case EsmAwait():
        final inner = _normalizeExpression(expression.expression);
        if (!inner.changed) return (expression: expression, changed: false);
        return (expression: EsmAwait(inner.expression), changed: true);
      case EsmNew():
        final callee = _normalizeExpression(expression.callee);
        final arguments = [
          for (final argument in expression.arguments)
            _normalizeExpression(argument),
        ];
        if (!callee.changed && !arguments.any((argument) => argument.changed)) {
          return (expression: expression, changed: false);
        }
        return (
          expression: EsmNew(
            callee: callee.expression,
            arguments: [for (final argument in arguments) argument.expression],
          ),
          changed: true,
        );
      case EsmPropertyAccess():
        final receiver = _normalizeExpression(expression.receiver);
        if (!receiver.changed) return (expression: expression, changed: false);
        return (
          expression: EsmPropertyAccess(
            receiver: receiver.expression,
            property: expression.property,
          ),
          changed: true,
        );
      case EsmComputedPropertyAccess():
        final receiver = _normalizeExpression(expression.receiver);
        final property = _normalizeExpression(expression.property);
        if (!receiver.changed && !property.changed) {
          return (expression: expression, changed: false);
        }
        return (
          expression: EsmComputedPropertyAccess(
            receiver: receiver.expression,
            property: property.expression,
          ),
          changed: true,
        );
      case EsmOptionalPropertyAccess():
        final receiver = _normalizeExpression(expression.receiver);
        if (!receiver.changed) return (expression: expression, changed: false);
        return (
          expression: EsmOptionalPropertyAccess(
            receiver: receiver.expression,
            property: expression.property,
          ),
          changed: true,
        );
      case EsmOptionalMethodCall():
        final receiver = _normalizeExpression(expression.receiver);
        final arguments = [
          for (final argument in expression.arguments)
            _normalizeExpression(argument),
        ];
        if (!receiver.changed &&
            !arguments.any((argument) => argument.changed)) {
          return (expression: expression, changed: false);
        }
        return (
          expression: EsmOptionalMethodCall(
            receiver: receiver.expression,
            property: expression.property,
            arguments: [for (final argument in arguments) argument.expression],
          ),
          changed: true,
        );
      case EsmStringLiteral() ||
          EsmStringConcatenation() ||
          EsmNumberLiteral() ||
          EsmBooleanLiteral() ||
          EsmNullLiteral() ||
          EsmIdentifier() ||
          EsmImportMeta() ||
          EsmThis() ||
          EsmNewTarget() ||
          EsmSuper():
        return (expression: expression, changed: false);
    }
  }

  ({EsmExpression expression, bool changed}) _normalizeObjectVarArgsCall(
    EsmCall call,
  ) {
    final method = _objectVarArgsMethod(call.callee);
    if (method == null || call.arguments.length != 1) {
      return (expression: call, changed: false);
    }
    if (call.arguments.single is! EsmArrayLiteral) {
      return (expression: call, changed: false);
    }
    return (
      expression: EsmCall(
        callee: EsmPropertyAccess(receiver: method.callee, property: 'apply'),
        arguments: [method.receiver, call.arguments.single],
      ),
      changed: true,
    );
  }

  ({EsmExpression receiver, EsmExpression callee})? _objectVarArgsMethod(
    EsmExpression callee,
  ) {
    final method = switch (callee) {
      EsmPropertyAccess(:final receiver, :final property) => (
        receiver: receiver,
        methodName: property,
      ),
      EsmComputedPropertyAccess(
        :final receiver,
        property: EsmStringLiteral(:final value),
      ) =>
        (receiver: receiver, methodName: value),
      _ => null,
    };
    if (method == null) {
      return null;
    }
    if (method.methodName != 'create' &&
        method.methodName != 'defineProperty') {
      return null;
    }
    if (!_isGlobalObjectReference(method.receiver)) {
      return null;
    }
    return (receiver: method.receiver, callee: callee);
  }

  bool _isGlobalObjectReference(EsmExpression expression) {
    return switch (expression) {
      EsmIdentifier(:final name) => name == 'Object',
      EsmComputedPropertyAccess(
        receiver: EsmIdentifier(name: 'globalThis'),
        property: EsmStringLiteral(value: 'Object'),
      ) =>
        true,
      EsmPropertyAccess(
        receiver: EsmIdentifier(name: 'globalThis'),
        property: 'Object',
      ) =>
        true,
      EsmCall(callee: EsmIdentifier(name: '__dartAs'), :final arguments)
          when arguments.isNotEmpty =>
        _isGlobalObjectReference(arguments.first),
      _ => false,
    };
  }
}
