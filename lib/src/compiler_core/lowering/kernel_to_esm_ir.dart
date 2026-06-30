import 'package:kernel/kernel.dart' as k;

import '../../names/js_names.dart';
import '../ir/esm_ir.dart';
import '../new_compiler_unsupported.dart';
import '../runtime/runtime_helpers.dart';
import '../semantic/semantic_world.dart';

final class LoweringResult {
  const LoweringResult({required this.semantic, required this.module});

  final SemanticWorldResult semantic;
  final EsmModuleIr module;
}

final class KernelToEsmIrLoweringStage {
  const KernelToEsmIrLoweringStage();

  LoweringResult lower(SemanticWorldResult semantic, {required bool runMain}) {
    final world = semantic.world;
    final helpers = EsmRuntimeHelperUseSet();
    final items = <EsmModuleItemIr>[
      for (final field in world.fields) _lowerField(world, helpers, field),
      for (final procedure in world.procedures)
        _lowerProcedure(world, helpers, procedure),
      if (runMain)
        EsmExpressionStatementIr(
          EsmCallIr(
            callee: EsmIdentifierIr(world.symbolForRequired(world.main).name),
            arguments: const [],
          ),
        ),
    ];
    return LoweringResult(
      semantic: semantic,
      module: EsmModuleIr(items: items, runtimeHelpers: helpers.toList()),
    );
  }

  EsmVariableDeclarationIr _lowerField(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmFieldSymbol field,
  ) {
    final initializer = field.node.initializer;
    return EsmVariableDeclarationIr(
      name: field.name,
      initializer: initializer == null
          ? null
          : _lowerExpression(
              world,
              helpers,
              const <k.VariableDeclaration, String>{},
              initializer,
            ),
      mutable: field.mutable,
      export: field.export,
    );
  }

  EsmFunctionIr _lowerProcedure(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    EsmProcedureSymbol procedure,
  ) {
    final function = procedure.node.function;
    if (function.asyncMarker != k.AsyncMarker.Sync) {
      throw NewCompilerUnsupported(function, 'async function lowering');
    }
    if (function.namedParameters.isNotEmpty) {
      throw NewCompilerUnsupported(function, 'named parameter lowering');
    }
    final locals = <k.VariableDeclaration, String>{};
    final labels = <k.LabeledStatement, String>{};
    final usedParameters = <String>{};
    final parameters = [
      for (final parameter in function.positionalParameters)
        _bindParameter(locals, usedParameters, parameter),
    ];
    final body = function.body;
    if (body == null) {
      throw NewCompilerUnsupported(function, 'procedure without body');
    }
    return EsmFunctionIr(
      name: procedure.name,
      export: procedure.export,
      parameters: parameters,
      body: _lowerStatementList(world, helpers, locals, labels, body),
    );
  }

  String _bindParameter(
    Map<k.VariableDeclaration, String> locals,
    Set<String> usedParameters,
    k.VariableDeclaration parameter,
  ) {
    final original = parameter.name ?? 'arg';
    final name = _freshIn(usedParameters, original);
    locals[parameter] = name;
    return name;
  }

  List<EsmStatementIr> _lowerStatementList(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.Statement statement,
  ) {
    return switch (statement) {
      k.Block() => [
        for (final child in statement.statements)
          ..._lowerStatementList(world, helpers, locals, labels, child),
      ],
      k.LabeledStatement() => [
        _lowerLabeledStatement(world, helpers, locals, labels, statement),
      ],
      k.BreakStatement() => [_lowerBreakStatement(labels, statement)],
      k.VariableDeclaration() => [
        _lowerVariableDeclaration(world, helpers, locals, statement),
      ],
      k.EmptyStatement() => const [],
      k.ExpressionStatement() => [
        EsmExpressionStatementIr(
          _lowerExpression(world, helpers, locals, statement.expression),
        ),
      ],
      k.IfStatement() => [
        _lowerIfStatement(world, helpers, locals, labels, statement),
      ],
      k.WhileStatement() => [
        _lowerWhileStatement(world, helpers, locals, labels, statement),
      ],
      k.DoStatement() => [
        _lowerDoStatement(world, helpers, locals, labels, statement),
      ],
      k.SwitchStatement() => [
        _lowerSwitchStatement(world, helpers, locals, labels, statement),
      ],
      k.ForStatement() => [
        _lowerForStatement(world, helpers, locals, labels, statement),
      ],
      k.ReturnStatement() => [
        EsmReturnStatementIr(
          statement.expression == null
              ? null
              : _lowerExpression(world, helpers, locals, statement.expression!),
        ),
      ],
      _ => throw NewCompilerUnsupported(statement, 'statement lowering'),
    };
  }

  EsmLabeledStatementIr _lowerLabeledStatement(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.LabeledStatement statement,
  ) {
    final label = _freshIn(labels.values.toSet(), 'label');
    labels[statement] = label;
    return EsmLabeledStatementIr(
      label: label,
      body: _lowerStatementList(world, helpers, locals, labels, statement.body),
    );
  }

  EsmBreakStatementIr _lowerBreakStatement(
    Map<k.LabeledStatement, String> labels,
    k.BreakStatement statement,
  ) {
    final label = labels[statement.target];
    if (label == null) {
      throw NewCompilerUnsupported(statement, 'unbound break target');
    }
    return EsmBreakStatementIr(label);
  }

  EsmIfStatementIr _lowerIfStatement(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.IfStatement statement,
  ) {
    final otherwise = statement.otherwise;
    return EsmIfStatementIr(
      condition: _lowerExpression(world, helpers, locals, statement.condition),
      thenBody: _lowerStatementList(
        world,
        helpers,
        locals,
        labels,
        statement.then,
      ),
      otherwiseBody: otherwise == null
          ? null
          : _lowerStatementList(world, helpers, locals, labels, otherwise),
    );
  }

  EsmWhileStatementIr _lowerWhileStatement(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.WhileStatement statement,
  ) {
    return EsmWhileStatementIr(
      condition: _lowerExpression(world, helpers, locals, statement.condition),
      body: _lowerStatementList(world, helpers, locals, labels, statement.body),
    );
  }

  EsmDoStatementIr _lowerDoStatement(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.DoStatement statement,
  ) {
    return EsmDoStatementIr(
      body: _lowerStatementList(world, helpers, locals, labels, statement.body),
      condition: _lowerExpression(world, helpers, locals, statement.condition),
    );
  }

  EsmSwitchStatementIr _lowerSwitchStatement(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.SwitchStatement statement,
  ) {
    return EsmSwitchStatementIr(
      expression: _lowerExpression(
        world,
        helpers,
        locals,
        statement.expression,
      ),
      cases: [
        for (final switchCase in statement.cases)
          _lowerSwitchCase(world, helpers, locals, labels, switchCase),
      ],
    );
  }

  EsmSwitchCaseIr _lowerSwitchCase(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.SwitchCase switchCase,
  ) {
    return EsmSwitchCaseIr(
      expressions: [
        for (final expression in switchCase.expressions)
          _lowerExpression(world, helpers, locals, expression),
      ],
      isDefault: switchCase.isDefault,
      body: _lowerStatementList(
        world,
        helpers,
        locals,
        labels,
        switchCase.body,
      ),
    );
  }

  EsmForStatementIr _lowerForStatement(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    Map<k.LabeledStatement, String> labels,
    k.ForStatement statement,
  ) {
    return EsmForStatementIr(
      initializers: [
        for (final initializer in statement.variableInitializations)
          _lowerForInitializer(world, helpers, locals, initializer),
      ],
      condition: statement.condition == null
          ? null
          : _lowerExpression(world, helpers, locals, statement.condition!),
      updates: [
        for (final update in statement.updates)
          _lowerExpression(world, helpers, locals, update),
      ],
      body: _lowerStatementList(world, helpers, locals, labels, statement.body),
    );
  }

  EsmVariableDeclarationIr _lowerForInitializer(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.VariableInitializationBase initializer,
  ) {
    if (initializer is! k.VariableDeclaration) {
      throw NewCompilerUnsupported(initializer, 'for initializer lowering');
    }
    return _lowerVariableDeclaration(world, helpers, locals, initializer);
  }

  EsmVariableDeclarationIr _lowerVariableDeclaration(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.VariableDeclaration statement,
  ) {
    final name = _freshIn(locals.values.toSet(), statement.name ?? 'v');
    locals[statement] = name;
    final initializer = statement.initializer;
    return EsmVariableDeclarationIr(
      name: name,
      initializer: initializer == null
          ? null
          : _lowerExpression(world, helpers, locals, initializer),
      mutable: statement.isAssignable,
    );
  }

  EsmExpressionIr _lowerExpression(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.Expression expression,
  ) {
    return switch (expression) {
      k.StaticInvocation() => _lowerStaticInvocation(
        world,
        helpers,
        locals,
        expression,
      ),
      k.StaticGet() => _lowerStaticGet(world, expression),
      k.StaticSet() => _lowerStaticSet(world, helpers, locals, expression),
      k.ConstantExpression() => _lowerConstantExpression(expression),
      k.VariableGet() => _lowerVariableGet(locals, expression),
      k.VariableSet() => _lowerVariableSet(world, helpers, locals, expression),
      k.InstanceInvocation() => _lowerInstanceInvocation(
        world,
        helpers,
        locals,
        expression,
      ),
      k.StringLiteral() => EsmStringLiteralIr(expression.value),
      k.StringConcatenation() => EsmStringConcatenationIr([
        for (final part in expression.expressions)
          _lowerExpression(world, helpers, locals, part),
      ]),
      k.IntLiteral() => EsmNumberLiteralIr(expression.value),
      k.DoubleLiteral() => EsmNumberLiteralIr(expression.value),
      k.BoolLiteral() => EsmBooleanLiteralIr(expression.value),
      k.NullLiteral() => const EsmNullLiteralIr(),
      _ => throw NewCompilerUnsupported(expression, 'expression lowering'),
    };
  }

  EsmExpressionIr _lowerConstantExpression(k.ConstantExpression expression) {
    final constant = expression.constant;
    if (constant is k.IntConstant) {
      return EsmNumberLiteralIr(constant.value);
    }
    if (constant is k.DoubleConstant) {
      return EsmNumberLiteralIr(constant.value);
    }
    if (constant is k.StringConstant) {
      return EsmStringLiteralIr(constant.value);
    }
    if (constant is k.BoolConstant) {
      return EsmBooleanLiteralIr(constant.value);
    }
    if (constant is k.NullConstant) {
      return const EsmNullLiteralIr();
    }
    throw NewCompilerUnsupported(expression, 'constant expression lowering');
  }

  EsmExpressionIr _lowerStaticGet(
    EsmSemanticWorld world,
    k.StaticGet expression,
  ) {
    final target = expression.targetReference.node;
    if (target is k.Field) {
      final symbol = world.fieldSymbolFor(target);
      if (symbol != null) {
        return EsmIdentifierIr(symbol.name);
      }
    }
    if (target is k.Procedure) {
      final symbol = world.symbolFor(target);
      if (symbol != null) {
        return switch (symbol.kind) {
          EsmProcedureKind.method => EsmIdentifierIr(symbol.name),
          EsmProcedureKind.getter => EsmCallIr(
            callee: EsmIdentifierIr(symbol.name),
            arguments: const [],
          ),
          EsmProcedureKind.setter => throw NewCompilerUnsupported(
            expression,
            'static setter get lowering',
          ),
        };
      }
    }
    throw NewCompilerUnsupported(expression, 'static get lowering');
  }

  EsmExpressionIr _lowerStaticSet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticSet expression,
  ) {
    final target = expression.targetReference.node;
    if (target is k.Field) {
      final symbol = world.fieldSymbolFor(target);
      if (symbol != null) {
        if (!symbol.mutable) {
          throw NewCompilerUnsupported(expression, 'write to final field');
        }
        return EsmAssignmentIr(
          target: EsmIdentifierIr(symbol.name),
          value: _lowerExpression(world, helpers, locals, expression.value),
        );
      }
    }
    if (target is k.Procedure) {
      final symbol = world.symbolFor(target);
      if (symbol != null && symbol.kind == EsmProcedureKind.setter) {
        return EsmCallIr(
          callee: EsmIdentifierIr(symbol.name),
          arguments: [
            _lowerExpression(world, helpers, locals, expression.value),
          ],
        );
      }
    }
    throw NewCompilerUnsupported(expression, 'static set lowering');
  }

  EsmExpressionIr _lowerVariableSet(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.VariableSet expression,
  ) {
    final name = locals[expression.variable];
    if (name == null) {
      throw NewCompilerUnsupported(expression, 'unbound variable set');
    }
    return EsmAssignmentIr(
      target: EsmIdentifierIr(name),
      value: _lowerExpression(world, helpers, locals, expression.value),
    );
  }

  EsmExpressionIr _lowerInstanceInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.InstanceInvocation expression,
  ) {
    final operator = expression.name.text;
    if (!_binaryOperators.contains(operator) ||
        expression.arguments.positional.length != 1 ||
        expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty) {
      throw NewCompilerUnsupported(expression, 'instance invocation lowering');
    }
    return EsmBinaryIr(
      left: _lowerExpression(world, helpers, locals, expression.receiver),
      operator: operator,
      right: _lowerExpression(
        world,
        helpers,
        locals,
        expression.arguments.positional.single,
      ),
    );
  }

  EsmExpressionIr _lowerStaticInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression,
  ) {
    if (expression.arguments.named.isNotEmpty ||
        expression.arguments.types.isNotEmpty) {
      throw NewCompilerUnsupported(expression, 'static invocation arguments');
    }
    final targetNode = expression.targetReference.node;
    if (targetNode is! k.Procedure) {
      final helperCall = _lowerRuntimeStaticInvocation(
        world,
        helpers,
        locals,
        expression,
      );
      if (helperCall != null) {
        return helperCall;
      }
      throw NewCompilerUnsupported(
        expression.targetReference,
        'external static target',
      );
    }
    final target = world.symbolFor(targetNode);
    if (target == null) {
      throw NewCompilerUnsupported(expression.target, 'external static target');
    }
    if (target.kind != EsmProcedureKind.method) {
      throw NewCompilerUnsupported(expression.target, 'static accessor call');
    }
    return EsmCallIr(
      callee: EsmIdentifierIr(target.name),
      arguments: [
        for (final argument in expression.arguments.positional)
          _lowerExpression(world, helpers, locals, argument),
      ],
    );
  }

  EsmExpressionIr? _lowerRuntimeStaticInvocation(
    EsmSemanticWorld world,
    EsmRuntimeHelperUseSet helpers,
    Map<k.VariableDeclaration, String> locals,
    k.StaticInvocation expression,
  ) {
    if (!_isCorePrint(expression.targetReference)) {
      return null;
    }
    if (expression.arguments.positional.length != 1) {
      throw NewCompilerUnsupported(expression, 'print argument shape');
    }
    helpers.add(EsmRuntimeHelper.print);
    return EsmCallIr(
      callee: EsmIdentifierIr(esmRuntimeHelperName(EsmRuntimeHelper.print)),
      arguments: [
        _lowerExpression(
          world,
          helpers,
          locals,
          expression.arguments.positional.single,
        ),
      ],
    );
  }

  bool _isCorePrint(k.Reference reference) {
    return reference.toStringInternal() == 'dart:core::@methods::print';
  }

  EsmExpressionIr _lowerVariableGet(
    Map<k.VariableDeclaration, String> locals,
    k.VariableGet expression,
  ) {
    final name = locals[expression.variable];
    if (name == null) {
      throw NewCompilerUnsupported(expression, 'unbound variable get');
    }
    return EsmIdentifierIr(name);
  }

  String _freshIn(Set<String> usedNames, String original) {
    var name = sanitizeJsIdentifier(original);
    if (!isJsBindingIdentifier(name)) {
      name = '\$$name';
    }
    var candidate = name;
    var suffix = 1;
    while (!usedNames.add(candidate)) {
      candidate = '${name}_$suffix';
      suffix++;
    }
    return candidate;
  }
}

const _binaryOperators = {'+', '-', '*', '/', '%', '<', '<=', '>', '>='};
