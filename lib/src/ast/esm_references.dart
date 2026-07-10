import 'esm_ast.dart';

Set<String> collectEsmIdentifierReferences(EsmModule module) {
  final collector = _EsmNameCollector();
  collector.visitModuleItems(module.items);
  return collector.references;
}

Set<String> collectEsmBindingNames(EsmModule module) {
  final collector = _EsmNameCollector();
  collector.visitModuleItems(module.items);
  return collector.bindings;
}

final class _EsmNameCollector {
  final references = <String>{};
  final bindings = <String>{};

  void visitModuleItems(Iterable<EsmModuleItem> items) {
    for (final item in items) {
      visitModuleItem(item);
    }
  }

  void visitModuleItem(EsmModuleItem item) {
    switch (item) {
      case EsmRawModuleItem():
        break;
      case EsmClass():
        bindings.add(item.name);
        visitExpression(item.superclass);
        final constructor = item.constructor;
        if (constructor != null) {
          visitParameters(constructor.parameters);
          visitStatements(constructor.body);
        }
        for (final method in item.methods) {
          visitPropertyKey(method.key);
          visitParameters(method.parameters);
          visitStatements(method.body);
        }
      case EsmFunction():
        bindings.add(item.name);
        visitParameters(item.parameters);
        visitStatements(item.body);
      case EsmStatement():
        visitStatement(item);
    }
  }

  void visitStatements(Iterable<EsmStatement>? statements) {
    if (statements == null) return;
    for (final statement in statements) {
      visitStatement(statement);
    }
  }

  void visitStatement(EsmStatement statement) {
    switch (statement) {
      case EsmExpressionStatement():
        visitExpression(statement.expression);
      case EsmBlockStatement():
        visitStatements(statement.body);
      case EsmLabeledStatement():
        visitStatement(statement.statement);
      case EsmBreakStatement() || EsmContinueStatement():
        break;
      case EsmVariableDeclaration():
        visitBinding(statement.binding);
        visitExpression(statement.initializer);
      case EsmIfStatement():
        visitExpression(statement.condition);
        visitStatements(statement.thenBody);
        visitStatements(statement.otherwiseBody);
      case EsmWhileStatement():
        visitExpression(statement.condition);
        visitStatements(statement.body);
      case EsmDoStatement():
        visitStatements(statement.body);
        visitExpression(statement.condition);
      case EsmSwitchStatement():
        visitExpression(statement.expression);
        for (final switchCase in statement.cases) {
          for (final expression in switchCase.expressions) {
            visitExpression(expression);
          }
          visitStatements(switchCase.body);
        }
      case EsmForStatement():
        for (final initializer in statement.initializers) {
          visitStatement(initializer);
        }
        visitExpression(statement.condition);
        for (final update in statement.updates) {
          visitExpression(update);
        }
        visitStatements(statement.body);
      case EsmReturnStatement():
        visitExpression(statement.expression);
      case EsmYieldStatement():
        visitExpression(statement.expression);
      case EsmThrowStatement():
        visitExpression(statement.expression);
      case EsmTryStatement():
        visitStatements(statement.body);
        final parameter = statement.catchParameter;
        if (parameter != null) visitParameter(parameter);
        visitStatements(statement.catchBody);
        visitStatements(statement.finallyBody);
    }
  }

  void visitParameters(Iterable<EsmParameter> parameters) {
    for (final parameter in parameters) {
      visitParameter(parameter);
    }
  }

  void visitParameter(EsmParameter parameter) {
    switch (parameter) {
      case EsmIdentifierParameter():
        bindings.add(parameter.name);
        visitExpression(parameter.defaultValue);
      case EsmObjectPatternParameter():
        for (final binding in parameter.bindings) {
          bindings.add(binding.name);
          visitExpression(binding.defaultValue);
        }
      case EsmArrayPatternParameter():
        visitParameters(parameter.elements);
    }
  }

  void visitBinding(EsmBinding binding) {
    switch (binding) {
      case EsmIdentifierBinding():
        bindings.add(binding.name);
      case EsmObjectBindingPattern():
        for (final item in binding.bindings) {
          bindings.add(item.name);
          visitExpression(item.defaultValue);
        }
      case EsmArrayBindingPattern():
        for (final item in binding.elements) {
          visitBinding(item);
        }
    }
  }

  void visitPropertyKey(EsmPropertyKey key) {
    if (key case EsmComputedPropertyKey(:final expression)) {
      visitExpression(expression);
    }
  }

  void visitExpression(EsmExpression? expression) {
    if (expression == null) return;
    switch (expression) {
      case EsmIdentifier():
        references.add(expression.name);
      case EsmImportMeta() ||
          EsmStringLiteral() ||
          EsmNumberLiteral() ||
          EsmBooleanLiteral() ||
          EsmNullLiteral() ||
          EsmThis() ||
          EsmNewTarget() ||
          EsmSuper():
        break;
      case EsmStringConcatenation():
        for (final item in expression.expressions) {
          visitExpression(item);
        }
      case EsmAssignment():
        visitExpression(expression.target);
        visitExpression(expression.value);
      case EsmBinary():
        visitExpression(expression.left);
        visitExpression(expression.right);
      case EsmUnary():
        visitExpression(expression.operand);
      case EsmConditional():
        visitExpression(expression.condition);
        visitExpression(expression.thenExpression);
        visitExpression(expression.otherwiseExpression);
      case EsmNullishCoalesce():
        visitExpression(expression.left);
        visitExpression(expression.right);
      case EsmParenthesized():
        visitExpression(expression.expression);
      case EsmArrayLiteral():
        for (final item in expression.elements) {
          visitExpression(item);
        }
      case EsmObjectLiteral():
        for (final property in expression.properties) {
          visitPropertyKey(property.key);
          visitExpression(property.value);
        }
      case EsmArrowFunction():
        visitParameters(expression.parameters);
        visitExpression(expression.body);
      case EsmFunctionExpression():
        visitParameters(expression.parameters);
        visitStatements(expression.body);
      case EsmArrowBlockFunction():
        visitParameters(expression.parameters);
        visitStatements(expression.body);
      case EsmAwait():
        visitExpression(expression.expression);
      case EsmCall():
        visitExpression(expression.callee);
        for (final argument in expression.arguments) {
          visitExpression(argument);
        }
      case EsmNew():
        visitExpression(expression.callee);
        for (final argument in expression.arguments) {
          visitExpression(argument);
        }
      case EsmPropertyAccess():
        visitExpression(expression.receiver);
      case EsmComputedPropertyAccess():
        visitExpression(expression.receiver);
        visitExpression(expression.property);
      case EsmOptionalPropertyAccess():
        visitExpression(expression.receiver);
      case EsmOptionalMethodCall():
        visitExpression(expression.receiver);
        for (final argument in expression.arguments) {
          visitExpression(argument);
        }
    }
  }
}
