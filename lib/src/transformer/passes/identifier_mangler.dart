import '../../ast/esm_ast.dart';
import '../../ast/esm_references.dart';
import '../../foundation/names/js_names.dart';
import '../helpers/runtime_helper_linker.dart';
import '../helpers/runtime_helpers.dart';
import '../transform_pass.dart';

final class IdentifierMangler implements TransformPass {
  const IdentifierMangler();

  @override
  TransformPassReturn apply(EsmModule module, TransformContext context) {
    if (!context.profile.isRelease ||
        module.items.any((item) => item is EsmRawModuleItem)) {
      return TransformPassReturn(module: module);
    }

    final protectedNames = <String>{};
    for (final item in module.items) {
      switch (item) {
        case EsmClass(:final name, export: true) ||
            EsmFunction(:final name, export: true):
          protectedNames.add(name);
        case EsmVariableDeclaration(:final binding, export: true):
          _addBindingNames(protectedNames, binding);
        default:
          break;
      }
    }
    final targets = <String>[];
    for (final name in collectEsmBindingNames(module)) {
      if (name.length > 1 &&
          !protectedNames.contains(name) &&
          !EsmRuntimeHelperRegistry.generatedGlobalNames.contains(name)) {
        targets.add(name);
      }
    }
    if (targets.isEmpty) return TransformPassReturn(module: module);

    final occupied = {
      ...collectEsmBindingNames(module),
      ...collectEsmIdentifierReferences(module),
      ...EsmRuntimeHelperRegistry.generatedGlobalNames,
    };
    final generator = _ShortNameGenerator(occupied);
    final names = <String, String>{};
    String? pending;
    for (final target in targets) {
      pending ??= generator.next();
      if (pending.length >= target.length) continue;
      names[target] = pending;
      occupied.add(pending);
      pending = null;
    }
    if (names.isEmpty) return TransformPassReturn(module: module);

    return TransformPassReturn(
      module: _IdentifierRenamer(names).module(module),
    );
  }

  void _addBindingNames(Set<String> names, EsmBinding binding) {
    switch (binding) {
      case EsmIdentifierBinding():
        names.add(binding.name);
      case EsmObjectBindingPattern():
        names.addAll(binding.bindings.map((item) => item.name));
      case EsmArrayBindingPattern():
        for (final item in binding.elements) {
          _addBindingNames(names, item);
        }
    }
  }
}

final class RuntimeIdentifierMangler implements TransformPass {
  const RuntimeIdentifierMangler();

  @override
  TransformPassReturn apply(EsmModule module, TransformContext context) {
    if (!context.profile.isRelease) {
      return TransformPassReturn(module: module);
    }

    final runtimeNames = EsmRuntimeHelperRegistry.generatedGlobalNames;
    final targets = <String>{
      for (final name in collectEsmBindingNames(module))
        if (runtimeNames.contains(name)) name,
      for (final name in collectEsmIdentifierReferences(module))
        if (runtimeNames.contains(name)) name,
      for (final item in module.items)
        if (item case EsmRawModuleItem(:final source))
          for (final name in collectRawRuntimeIdentifierReferences(source))
            if (runtimeNames.contains(name)) name,
    };
    if (targets.isEmpty) return TransformPassReturn(module: module);

    final occupied = {
      ...collectEsmBindingNames(module),
      ...collectEsmIdentifierReferences(module),
      for (final item in module.items)
        if (item case EsmRawModuleItem(:final source))
          ...collectRawJsIdentifiers(source),
    };
    final generator = _ShortNameGenerator(occupied);
    final names = <String, String>{};
    for (final target in targets) {
      final replacement = generator.next();
      if (replacement.length >= target.length) break;
      names[target] = replacement;
      occupied.add(replacement);
    }
    if (names.isEmpty) return TransformPassReturn(module: module);

    final renamer = _IdentifierRenamer(names);
    return TransformPassReturn(
      module: EsmModule(
        items: [
          for (final item in module.items)
            if (item case EsmRawModuleItem(:final source))
              EsmRawModuleItem(
                renameRawRuntimeIdentifierReferences(source, names),
              )
            else
              renamer.moduleItem(item),
        ],
      ),
    );
  }
}

final class _ShortNameGenerator {
  _ShortNameGenerator(this.occupied);

  static const _first =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ\$_';
  static const _rest =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ\$_0123456789';

  final Set<String> occupied;
  var _index = 0;

  String next() {
    while (true) {
      final candidate = _name(_index++);
      if (isJsBindingIdentifier(candidate) && !occupied.contains(candidate)) {
        return candidate;
      }
    }
  }

  String _name(int index) {
    final buffer = StringBuffer(_first[index % _first.length]);
    index ~/= _first.length;
    while (index > 0) {
      index--;
      buffer.write(_rest[index % _rest.length]);
      index ~/= _rest.length;
    }
    return buffer.toString();
  }
}

final class _IdentifierRenamer {
  const _IdentifierRenamer(this.names);

  final Map<String, String> names;

  String name(String value) => names[value] ?? value;

  EsmModule module(EsmModule module) =>
      EsmModule(items: [for (final item in module.items) moduleItem(item)]);

  EsmModuleItem moduleItem(EsmModuleItem item) => switch (item) {
    EsmRawModuleItem() => item,
    EsmClass() => EsmClass(
      name: name(item.name),
      export: item.export,
      superclass: expressionOrNull(item.superclass),
      constructor: item.constructor == null
          ? null
          : EsmClassConstructor(
              parameters: parameters(item.constructor!.parameters),
              body: statements(item.constructor!.body),
            ),
      methods: [for (final method in item.methods) classMethod(method)],
    ),
    EsmFunction() => EsmFunction(
      name: name(item.name),
      export: item.export,
      isAsync: item.isAsync,
      isGenerator: item.isGenerator,
      parameters: parameters(item.parameters),
      body: statements(item.body),
    ),
    EsmStatement() => statement(item),
  };

  EsmClassMethod classMethod(EsmClassMethod method) => EsmClassMethod(
    key: propertyKey(method.key),
    kind: method.kind,
    isStatic: method.isStatic,
    isAsync: method.isAsync,
    isGenerator: method.isGenerator,
    parameters: parameters(method.parameters),
    body: statements(method.body),
  );

  List<EsmParameter> parameters(Iterable<EsmParameter> values) => [
    for (final value in values) parameter(value),
  ];

  EsmParameter parameter(EsmParameter parameter) => switch (parameter) {
    EsmIdentifierParameter() => EsmIdentifierParameter(
      name: name(parameter.name),
      defaultValue: expressionOrNull(parameter.defaultValue),
    ),
    EsmObjectPatternParameter() => EsmObjectPatternParameter(
      bindings: [
        for (final binding in parameter.bindings) objectPatternBinding(binding),
      ],
    ),
    EsmArrayPatternParameter() => EsmArrayPatternParameter(
      elements: parameters(parameter.elements),
    ),
  };

  EsmObjectPatternBinding objectPatternBinding(EsmObjectPatternBinding value) =>
      EsmObjectPatternBinding(
        property: value.property,
        name: name(value.name),
        defaultValue: expressionOrNull(value.defaultValue),
      );

  EsmBinding binding(EsmBinding binding) => switch (binding) {
    EsmIdentifierBinding() => EsmIdentifierBinding(name(binding.name)),
    EsmObjectBindingPattern() => EsmObjectBindingPattern(
      bindings: [
        for (final value in binding.bindings) objectPatternBinding(value),
      ],
    ),
    EsmArrayBindingPattern() => EsmArrayBindingPattern(
      elements: [for (final value in binding.elements) this.binding(value)],
    ),
  };

  List<EsmStatement> statements(Iterable<EsmStatement> values) => [
    for (final value in values) statement(value),
  ];

  EsmStatement statement(EsmStatement statement) => switch (statement) {
    EsmExpressionStatement() => EsmExpressionStatement(
      expression(statement.expression),
    ),
    EsmBlockStatement() => EsmBlockStatement(statements(statement.body)),
    EsmLabeledStatement() => EsmLabeledStatement(
      label: statement.label,
      statement: this.statement(statement.statement),
    ),
    EsmBreakStatement() => statement,
    EsmContinueStatement() => statement,
    EsmVariableDeclaration() => EsmVariableDeclaration(
      binding: binding(statement.binding),
      initializer: expressionOrNull(statement.initializer),
      mutable: statement.mutable,
      export: statement.export,
    ),
    EsmIfStatement() => EsmIfStatement(
      condition: expression(statement.condition),
      thenBody: statements(statement.thenBody),
      otherwiseBody: statement.otherwiseBody == null
          ? null
          : statements(statement.otherwiseBody!),
    ),
    EsmWhileStatement() => EsmWhileStatement(
      condition: expression(statement.condition),
      body: statements(statement.body),
    ),
    EsmDoStatement() => EsmDoStatement(
      body: statements(statement.body),
      condition: expression(statement.condition),
    ),
    EsmSwitchStatement() => EsmSwitchStatement(
      expression: expression(statement.expression),
      cases: [for (final value in statement.cases) switchCase(value)],
    ),
    EsmForStatement() => EsmForStatement(
      initializers: [
        for (final value in statement.initializers)
          this.statement(value) as EsmVariableDeclaration,
      ],
      condition: expressionOrNull(statement.condition),
      updates: [for (final value in statement.updates) expression(value)],
      body: statements(statement.body),
    ),
    EsmReturnStatement() => EsmReturnStatement(
      expressionOrNull(statement.expression),
    ),
    EsmYieldStatement() => EsmYieldStatement(
      expression: expression(statement.expression),
      delegate: statement.delegate,
    ),
    EsmThrowStatement() => EsmThrowStatement(expression(statement.expression)),
    EsmTryStatement() => EsmTryStatement(
      body: statements(statement.body),
      catchParameter: statement.catchParameter == null
          ? null
          : parameter(statement.catchParameter!),
      catchBody: statement.catchBody == null
          ? null
          : statements(statement.catchBody!),
      finallyBody: statement.finallyBody == null
          ? null
          : statements(statement.finallyBody!),
    ),
  };

  EsmSwitchCase switchCase(EsmSwitchCase value) => EsmSwitchCase(
    expressions: [for (final item in value.expressions) expression(item)],
    isDefault: value.isDefault,
    body: statements(value.body),
  );

  EsmPropertyKey propertyKey(EsmPropertyKey key) => switch (key) {
    EsmStaticPropertyKey() => key,
    EsmComputedPropertyKey() => EsmComputedPropertyKey(
      expression(key.expression),
    ),
  };

  EsmExpression? expressionOrNull(EsmExpression? value) =>
      value == null ? null : expression(value);

  EsmExpression expression(EsmExpression value) => switch (value) {
    EsmIdentifier() => EsmIdentifier(name(value.name)),
    EsmImportMeta() ||
    EsmStringLiteral() ||
    EsmNumberLiteral() ||
    EsmBooleanLiteral() ||
    EsmNullLiteral() ||
    EsmThis() ||
    EsmNewTarget() ||
    EsmSuper() => value,
    EsmStringConcatenation() => EsmStringConcatenation([
      for (final item in value.expressions) expression(item),
    ]),
    EsmAssignment() => EsmAssignment(
      target: expression(value.target),
      value: expression(value.value),
    ),
    EsmBinary() => EsmBinary(
      left: expression(value.left),
      operator: value.operator,
      right: expression(value.right),
    ),
    EsmUnary() => EsmUnary(
      operator: value.operator,
      operand: expression(value.operand),
    ),
    EsmConditional() => EsmConditional(
      condition: expression(value.condition),
      thenExpression: expression(value.thenExpression),
      otherwiseExpression: expression(value.otherwiseExpression),
    ),
    EsmNullishCoalesce() => EsmNullishCoalesce(
      left: expression(value.left),
      right: expression(value.right),
    ),
    EsmParenthesized() => EsmParenthesized(expression(value.expression)),
    EsmArrayLiteral() => EsmArrayLiteral([
      for (final item in value.elements) expression(item),
    ]),
    EsmObjectLiteral() => EsmObjectLiteral([
      for (final property in value.properties)
        EsmObjectLiteralProperty(
          key: propertyKey(property.key),
          value: expression(property.value),
        ),
    ]),
    EsmArrowFunction() => EsmArrowFunction(
      parameters: parameters(value.parameters),
      body: expression(value.body),
    ),
    EsmFunctionExpression() => EsmFunctionExpression(
      parameters: parameters(value.parameters),
      isAsync: value.isAsync,
      isGenerator: value.isGenerator,
      body: statements(value.body),
    ),
    EsmArrowBlockFunction() => EsmArrowBlockFunction(
      parameters: parameters(value.parameters),
      isAsync: value.isAsync,
      body: statements(value.body),
    ),
    EsmAwait() => EsmAwait(expression(value.expression)),
    EsmCall() => EsmCall(
      callee: expression(value.callee),
      arguments: [for (final item in value.arguments) expression(item)],
    ),
    EsmNew() => EsmNew(
      callee: expression(value.callee),
      arguments: [for (final item in value.arguments) expression(item)],
    ),
    EsmPropertyAccess() => EsmPropertyAccess(
      receiver: expression(value.receiver),
      property: value.property,
    ),
    EsmComputedPropertyAccess() => EsmComputedPropertyAccess(
      receiver: expression(value.receiver),
      property: expression(value.property),
    ),
    EsmOptionalPropertyAccess() => EsmOptionalPropertyAccess(
      receiver: expression(value.receiver),
      property: value.property,
    ),
    EsmOptionalMethodCall() => EsmOptionalMethodCall(
      receiver: expression(value.receiver),
      property: value.property,
      arguments: [for (final item in value.arguments) expression(item)],
    ),
  };
}
