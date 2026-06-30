import '../runtime/runtime_helpers.dart';

sealed class EsmIrNode {
  const EsmIrNode();
}

final class EsmModuleIr extends EsmIrNode {
  const EsmModuleIr({required this.items, this.runtimeHelpers = const []});

  final List<EsmModuleItemIr> items;
  final List<EsmRuntimeHelper> runtimeHelpers;
}

sealed class EsmModuleItemIr extends EsmIrNode {
  const EsmModuleItemIr();
}

final class EsmClassIr extends EsmModuleItemIr {
  const EsmClassIr({
    required this.name,
    required this.export,
    required this.superclass,
    required this.constructor,
    required this.methods,
  });

  final String name;
  final bool export;
  final String? superclass;
  final EsmClassConstructorIr? constructor;
  final List<EsmClassMethodIr> methods;
}

final class EsmClassConstructorIr extends EsmIrNode {
  const EsmClassConstructorIr({required this.parameters, required this.body});

  final List<String> parameters;
  final List<EsmStatementIr> body;
}

final class EsmClassMethodIr extends EsmIrNode {
  const EsmClassMethodIr({
    required this.name,
    required this.kind,
    required this.parameters,
    required this.body,
  });

  final String name;
  final EsmClassMethodKindIr kind;
  final List<String> parameters;
  final List<EsmStatementIr> body;
}

enum EsmClassMethodKindIr { method, getter, setter }

final class EsmFunctionIr extends EsmModuleItemIr {
  const EsmFunctionIr({
    required this.name,
    required this.export,
    required this.parameters,
    required this.body,
  });

  final String name;
  final bool export;
  final List<String> parameters;
  final List<EsmStatementIr> body;
}

sealed class EsmStatementIr extends EsmModuleItemIr {
  const EsmStatementIr();
}

final class EsmExpressionStatementIr extends EsmStatementIr {
  const EsmExpressionStatementIr(this.expression);

  final EsmExpressionIr expression;
}

final class EsmLabeledStatementIr extends EsmStatementIr {
  const EsmLabeledStatementIr({required this.label, required this.body});

  final String label;
  final List<EsmStatementIr> body;
}

final class EsmBreakStatementIr extends EsmStatementIr {
  const EsmBreakStatementIr(this.label);

  final String label;
}

final class EsmVariableDeclarationIr extends EsmStatementIr {
  const EsmVariableDeclarationIr({
    required this.name,
    required this.initializer,
    required this.mutable,
    this.export = false,
  });

  final String name;
  final EsmExpressionIr? initializer;
  final bool mutable;
  final bool export;
}

final class EsmIfStatementIr extends EsmStatementIr {
  const EsmIfStatementIr({
    required this.condition,
    required this.thenBody,
    required this.otherwiseBody,
  });

  final EsmExpressionIr condition;
  final List<EsmStatementIr> thenBody;
  final List<EsmStatementIr>? otherwiseBody;
}

final class EsmWhileStatementIr extends EsmStatementIr {
  const EsmWhileStatementIr({required this.condition, required this.body});

  final EsmExpressionIr condition;
  final List<EsmStatementIr> body;
}

final class EsmDoStatementIr extends EsmStatementIr {
  const EsmDoStatementIr({required this.body, required this.condition});

  final List<EsmStatementIr> body;
  final EsmExpressionIr condition;
}

final class EsmSwitchStatementIr extends EsmStatementIr {
  const EsmSwitchStatementIr({required this.expression, required this.cases});

  final EsmExpressionIr expression;
  final List<EsmSwitchCaseIr> cases;
}

final class EsmSwitchCaseIr extends EsmIrNode {
  const EsmSwitchCaseIr({
    required this.expressions,
    required this.isDefault,
    required this.body,
  });

  final List<EsmExpressionIr> expressions;
  final bool isDefault;
  final List<EsmStatementIr> body;
}

final class EsmForStatementIr extends EsmStatementIr {
  const EsmForStatementIr({
    required this.initializers,
    required this.condition,
    required this.updates,
    required this.body,
  });

  final List<EsmVariableDeclarationIr> initializers;
  final EsmExpressionIr? condition;
  final List<EsmExpressionIr> updates;
  final List<EsmStatementIr> body;
}

final class EsmReturnStatementIr extends EsmStatementIr {
  const EsmReturnStatementIr(this.expression);

  final EsmExpressionIr? expression;
}

sealed class EsmExpressionIr extends EsmIrNode {
  const EsmExpressionIr();
}

final class EsmIdentifierIr extends EsmExpressionIr {
  const EsmIdentifierIr(this.name);

  final String name;
}

final class EsmStringLiteralIr extends EsmExpressionIr {
  const EsmStringLiteralIr(this.value);

  final String value;
}

final class EsmStringConcatenationIr extends EsmExpressionIr {
  const EsmStringConcatenationIr(this.expressions);

  final List<EsmExpressionIr> expressions;
}

final class EsmAssignmentIr extends EsmExpressionIr {
  const EsmAssignmentIr({required this.target, required this.value});

  final EsmExpressionIr target;
  final EsmExpressionIr value;
}

final class EsmBinaryIr extends EsmExpressionIr {
  const EsmBinaryIr({
    required this.left,
    required this.operator,
    required this.right,
  });

  final EsmExpressionIr left;
  final String operator;
  final EsmExpressionIr right;
}

final class EsmNumberLiteralIr extends EsmExpressionIr {
  const EsmNumberLiteralIr(this.value);

  final num value;
}

final class EsmBooleanLiteralIr extends EsmExpressionIr {
  const EsmBooleanLiteralIr(this.value);

  final bool value;
}

final class EsmNullLiteralIr extends EsmExpressionIr {
  const EsmNullLiteralIr();
}

final class EsmCallIr extends EsmExpressionIr {
  const EsmCallIr({required this.callee, required this.arguments});

  final EsmExpressionIr callee;
  final List<EsmExpressionIr> arguments;
}

final class EsmNewIr extends EsmExpressionIr {
  const EsmNewIr({required this.callee, required this.arguments});

  final EsmExpressionIr callee;
  final List<EsmExpressionIr> arguments;
}

final class EsmPropertyAccessIr extends EsmExpressionIr {
  const EsmPropertyAccessIr({required this.receiver, required this.property});

  final EsmExpressionIr receiver;
  final String property;
}

final class EsmThisIr extends EsmExpressionIr {
  const EsmThisIr();
}

final class EsmSuperIr extends EsmExpressionIr {
  const EsmSuperIr();
}
