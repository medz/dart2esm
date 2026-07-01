sealed class EsmIrNode {
  const EsmIrNode();
}

final class EsmModuleIr extends EsmIrNode {
  const EsmModuleIr({required this.items});

  final List<EsmModuleItemIr> items;
}

sealed class EsmModuleItemIr extends EsmIrNode {
  const EsmModuleItemIr();
}

final class EsmRawModuleItemIr extends EsmModuleItemIr {
  const EsmRawModuleItemIr(this.source);

  final String source;
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
  final EsmExpressionIr? superclass;
  final EsmClassConstructorIr? constructor;
  final List<EsmClassMethodIr> methods;
}

final class EsmClassConstructorIr extends EsmIrNode {
  const EsmClassConstructorIr({required this.parameters, required this.body});

  final List<EsmParameterIr> parameters;
  final List<EsmStatementIr> body;
}

final class EsmClassMethodIr extends EsmIrNode {
  const EsmClassMethodIr({
    required this.key,
    required this.kind,
    required this.isStatic,
    required this.parameters,
    required this.body,
  });

  final EsmPropertyKeyIr key;
  final EsmClassMethodKindIr kind;
  final bool isStatic;
  final List<EsmParameterIr> parameters;
  final List<EsmStatementIr> body;

  String get name => switch (key) {
    EsmStaticPropertyKeyIr(:final value) => value,
    EsmComputedPropertyKeyIr() => throw StateError(
      'Computed class method keys do not have a static name',
    ),
  };
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
  final List<EsmParameterIr> parameters;
  final List<EsmStatementIr> body;
}

sealed class EsmParameterIr extends EsmIrNode {
  const EsmParameterIr();
}

final class EsmIdentifierParameterIr extends EsmParameterIr {
  const EsmIdentifierParameterIr({required this.name, this.defaultValue});

  final String name;
  final EsmExpressionIr? defaultValue;
}

final class EsmObjectPatternParameterIr extends EsmParameterIr {
  const EsmObjectPatternParameterIr({required this.bindings});

  final List<EsmObjectPatternBindingIr> bindings;
}

final class EsmArrayPatternParameterIr extends EsmParameterIr {
  const EsmArrayPatternParameterIr({required this.elements});

  final List<EsmParameterIr> elements;
}

final class EsmObjectPatternBindingIr extends EsmIrNode {
  const EsmObjectPatternBindingIr({
    required this.property,
    required this.name,
    this.defaultValue,
  });

  final String property;
  final String name;
  final EsmExpressionIr? defaultValue;
}

sealed class EsmBindingIr extends EsmIrNode {
  const EsmBindingIr();
}

final class EsmIdentifierBindingIr extends EsmBindingIr {
  const EsmIdentifierBindingIr(this.name);

  final String name;
}

final class EsmObjectBindingPatternIr extends EsmBindingIr {
  const EsmObjectBindingPatternIr({required this.bindings});

  final List<EsmObjectPatternBindingIr> bindings;
}

final class EsmArrayBindingPatternIr extends EsmBindingIr {
  const EsmArrayBindingPatternIr({required this.elements});

  final List<EsmBindingIr> elements;
}

sealed class EsmStatementIr extends EsmModuleItemIr {
  const EsmStatementIr();
}

final class EsmExpressionStatementIr extends EsmStatementIr {
  const EsmExpressionStatementIr(this.expression);

  final EsmExpressionIr expression;
}

final class EsmBlockStatementIr extends EsmStatementIr {
  const EsmBlockStatementIr(this.body);

  final List<EsmStatementIr> body;
}

final class EsmLabeledStatementIr extends EsmStatementIr {
  const EsmLabeledStatementIr({required this.label, required this.statement});

  final String label;
  final EsmStatementIr statement;
}

final class EsmBreakStatementIr extends EsmStatementIr {
  const EsmBreakStatementIr(this.label);

  final String? label;
}

final class EsmContinueStatementIr extends EsmStatementIr {
  const EsmContinueStatementIr([this.label]);

  final String? label;
}

final class EsmVariableDeclarationIr extends EsmStatementIr {
  const EsmVariableDeclarationIr({
    required this.binding,
    required this.initializer,
    required this.mutable,
    this.export = false,
  });

  final EsmBindingIr binding;
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

final class EsmThrowStatementIr extends EsmStatementIr {
  const EsmThrowStatementIr(this.expression);

  final EsmExpressionIr expression;
}

final class EsmTryStatementIr extends EsmStatementIr {
  const EsmTryStatementIr({
    required this.body,
    required this.catchParameter,
    required this.catchBody,
    required this.finallyBody,
  });

  final List<EsmStatementIr> body;
  final EsmParameterIr? catchParameter;
  final List<EsmStatementIr>? catchBody;
  final List<EsmStatementIr>? finallyBody;
}

sealed class EsmExpressionIr extends EsmIrNode {
  const EsmExpressionIr();
}

final class EsmIdentifierIr extends EsmExpressionIr {
  const EsmIdentifierIr(this.name);

  final String name;
}

final class EsmImportMetaIr extends EsmExpressionIr {
  const EsmImportMetaIr();
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
  final EsmBinaryOperatorIr operator;
  final EsmExpressionIr right;
}

enum EsmBinaryOperatorIr {
  multiply,
  divide,
  remainder,
  add,
  subtract,
  leftShift,
  signedRightShift,
  unsignedRightShift,
  lessThan,
  lessThanOrEqual,
  greaterThan,
  greaterThanOrEqual,
  instanceOf,
  inOperator,
  looseEquals,
  looseNotEquals,
  strictEquals,
  strictNotEquals,
  bitAnd,
  bitXor,
  bitOr,
  logicalAnd,
  logicalOr,
}

final class EsmUnaryIr extends EsmExpressionIr {
  const EsmUnaryIr({required this.operator, required this.operand});

  final EsmUnaryOperatorIr operator;
  final EsmExpressionIr operand;
}

enum EsmUnaryOperatorIr { logicalNot, negate, bitNot, typeOf }

final class EsmConditionalIr extends EsmExpressionIr {
  const EsmConditionalIr({
    required this.condition,
    required this.thenExpression,
    required this.otherwiseExpression,
  });

  final EsmExpressionIr condition;
  final EsmExpressionIr thenExpression;
  final EsmExpressionIr otherwiseExpression;
}

final class EsmNullishCoalesceIr extends EsmExpressionIr {
  const EsmNullishCoalesceIr({required this.left, required this.right});

  final EsmExpressionIr left;
  final EsmExpressionIr right;
}

final class EsmParenthesizedIr extends EsmExpressionIr {
  const EsmParenthesizedIr(this.expression);

  final EsmExpressionIr expression;
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

final class EsmArrayLiteralIr extends EsmExpressionIr {
  const EsmArrayLiteralIr(this.elements);

  final List<EsmExpressionIr> elements;
}

final class EsmObjectLiteralIr extends EsmExpressionIr {
  const EsmObjectLiteralIr(this.properties);

  final List<EsmObjectLiteralPropertyIr> properties;
}

sealed class EsmPropertyKeyIr extends EsmIrNode {
  const EsmPropertyKeyIr();
}

final class EsmStaticPropertyKeyIr extends EsmPropertyKeyIr {
  const EsmStaticPropertyKeyIr(this.value);

  final String value;
}

final class EsmComputedPropertyKeyIr extends EsmPropertyKeyIr {
  const EsmComputedPropertyKeyIr(this.expression);

  final EsmExpressionIr expression;
}

final class EsmObjectLiteralPropertyIr extends EsmIrNode {
  const EsmObjectLiteralPropertyIr({required this.key, required this.value});

  EsmObjectLiteralPropertyIr.static({required String key, required this.value})
    : key = EsmStaticPropertyKeyIr(key);

  EsmObjectLiteralPropertyIr.computed({
    required EsmExpressionIr key,
    required this.value,
  }) : key = EsmComputedPropertyKeyIr(key);

  final EsmPropertyKeyIr key;
  final EsmExpressionIr value;
}

final class EsmArrowFunctionIr extends EsmExpressionIr {
  const EsmArrowFunctionIr({required this.parameters, required this.body});

  final List<EsmParameterIr> parameters;
  final EsmExpressionIr body;
}

final class EsmFunctionExpressionIr extends EsmExpressionIr {
  const EsmFunctionExpressionIr({required this.parameters, required this.body});

  final List<EsmParameterIr> parameters;
  final List<EsmStatementIr> body;
}

final class EsmArrowBlockFunctionIr extends EsmExpressionIr {
  const EsmArrowBlockFunctionIr({required this.parameters, required this.body});

  final List<EsmParameterIr> parameters;
  final List<EsmStatementIr> body;
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

final class EsmComputedPropertyAccessIr extends EsmExpressionIr {
  const EsmComputedPropertyAccessIr({
    required this.receiver,
    required this.property,
  });

  final EsmExpressionIr receiver;
  final EsmExpressionIr property;
}

final class EsmOptionalPropertyAccessIr extends EsmExpressionIr {
  const EsmOptionalPropertyAccessIr({
    required this.receiver,
    required this.property,
  });

  final EsmExpressionIr receiver;
  final String property;
}

final class EsmOptionalMethodCallIr extends EsmExpressionIr {
  const EsmOptionalMethodCallIr({
    required this.receiver,
    required this.property,
    required this.arguments,
  });

  final EsmExpressionIr receiver;
  final String property;
  final List<EsmExpressionIr> arguments;
}

final class EsmThisIr extends EsmExpressionIr {
  const EsmThisIr();
}

final class EsmNewTargetIr extends EsmExpressionIr {
  const EsmNewTargetIr();
}

final class EsmSuperIr extends EsmExpressionIr {
  const EsmSuperIr();
}
