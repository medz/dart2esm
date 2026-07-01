sealed class EsmNode {
  const EsmNode();
}

final class EsmModule extends EsmNode {
  const EsmModule({required this.items});

  final List<EsmModuleItem> items;
}

sealed class EsmModuleItem extends EsmNode {
  const EsmModuleItem();
}

final class EsmRawModuleItem extends EsmModuleItem {
  const EsmRawModuleItem(this.source);

  final String source;
}

final class EsmClass extends EsmModuleItem {
  const EsmClass({
    required this.name,
    required this.export,
    required this.superclass,
    required this.constructor,
    required this.methods,
  });

  final String name;
  final bool export;
  final EsmExpression? superclass;
  final EsmClassConstructor? constructor;
  final List<EsmClassMethod> methods;
}

final class EsmClassConstructor extends EsmNode {
  const EsmClassConstructor({required this.parameters, required this.body});

  final List<EsmParameter> parameters;
  final List<EsmStatement> body;
}

final class EsmClassMethod extends EsmNode {
  const EsmClassMethod({
    required this.key,
    required this.kind,
    required this.isStatic,
    required this.parameters,
    required this.body,
  });

  final EsmPropertyKey key;
  final EsmClassMethodKind kind;
  final bool isStatic;
  final List<EsmParameter> parameters;
  final List<EsmStatement> body;

  String get name => switch (key) {
    EsmStaticPropertyKey(:final value) => value,
    EsmComputedPropertyKey() => throw StateError(
      'Computed class method keys do not have a static name',
    ),
  };
}

enum EsmClassMethodKind { method, getter, setter }

final class EsmFunction extends EsmModuleItem {
  const EsmFunction({
    required this.name,
    required this.export,
    required this.parameters,
    required this.body,
  });

  final String name;
  final bool export;
  final List<EsmParameter> parameters;
  final List<EsmStatement> body;
}

sealed class EsmParameter extends EsmNode {
  const EsmParameter();
}

final class EsmIdentifierParameter extends EsmParameter {
  const EsmIdentifierParameter({required this.name, this.defaultValue});

  final String name;
  final EsmExpression? defaultValue;
}

final class EsmObjectPatternParameter extends EsmParameter {
  const EsmObjectPatternParameter({required this.bindings});

  final List<EsmObjectPatternBinding> bindings;
}

final class EsmArrayPatternParameter extends EsmParameter {
  const EsmArrayPatternParameter({required this.elements});

  final List<EsmParameter> elements;
}

final class EsmObjectPatternBinding extends EsmNode {
  const EsmObjectPatternBinding({
    required this.property,
    required this.name,
    this.defaultValue,
  });

  final String property;
  final String name;
  final EsmExpression? defaultValue;
}

sealed class EsmBinding extends EsmNode {
  const EsmBinding();
}

final class EsmIdentifierBinding extends EsmBinding {
  const EsmIdentifierBinding(this.name);

  final String name;
}

final class EsmObjectBindingPattern extends EsmBinding {
  const EsmObjectBindingPattern({required this.bindings});

  final List<EsmObjectPatternBinding> bindings;
}

final class EsmArrayBindingPattern extends EsmBinding {
  const EsmArrayBindingPattern({required this.elements});

  final List<EsmBinding> elements;
}

sealed class EsmStatement extends EsmModuleItem {
  const EsmStatement();
}

final class EsmExpressionStatement extends EsmStatement {
  const EsmExpressionStatement(this.expression);

  final EsmExpression expression;
}

final class EsmBlockStatement extends EsmStatement {
  const EsmBlockStatement(this.body);

  final List<EsmStatement> body;
}

final class EsmLabeledStatement extends EsmStatement {
  const EsmLabeledStatement({required this.label, required this.statement});

  final String label;
  final EsmStatement statement;
}

final class EsmBreakStatement extends EsmStatement {
  const EsmBreakStatement(this.label);

  final String? label;
}

final class EsmContinueStatement extends EsmStatement {
  const EsmContinueStatement([this.label]);

  final String? label;
}

final class EsmVariableDeclaration extends EsmStatement {
  const EsmVariableDeclaration({
    required this.binding,
    required this.initializer,
    required this.mutable,
    this.export = false,
  });

  final EsmBinding binding;
  final EsmExpression? initializer;
  final bool mutable;
  final bool export;
}

final class EsmIfStatement extends EsmStatement {
  const EsmIfStatement({
    required this.condition,
    required this.thenBody,
    required this.otherwiseBody,
  });

  final EsmExpression condition;
  final List<EsmStatement> thenBody;
  final List<EsmStatement>? otherwiseBody;
}

final class EsmWhileStatement extends EsmStatement {
  const EsmWhileStatement({required this.condition, required this.body});

  final EsmExpression condition;
  final List<EsmStatement> body;
}

final class EsmDoStatement extends EsmStatement {
  const EsmDoStatement({required this.body, required this.condition});

  final List<EsmStatement> body;
  final EsmExpression condition;
}

final class EsmSwitchStatement extends EsmStatement {
  const EsmSwitchStatement({required this.expression, required this.cases});

  final EsmExpression expression;
  final List<EsmSwitchCase> cases;
}

final class EsmSwitchCase extends EsmNode {
  const EsmSwitchCase({
    required this.expressions,
    required this.isDefault,
    required this.body,
  });

  final List<EsmExpression> expressions;
  final bool isDefault;
  final List<EsmStatement> body;
}

final class EsmForStatement extends EsmStatement {
  const EsmForStatement({
    required this.initializers,
    required this.condition,
    required this.updates,
    required this.body,
  });

  final List<EsmVariableDeclaration> initializers;
  final EsmExpression? condition;
  final List<EsmExpression> updates;
  final List<EsmStatement> body;
}

final class EsmReturnStatement extends EsmStatement {
  const EsmReturnStatement(this.expression);

  final EsmExpression? expression;
}

final class EsmThrowStatement extends EsmStatement {
  const EsmThrowStatement(this.expression);

  final EsmExpression expression;
}

final class EsmTryStatement extends EsmStatement {
  const EsmTryStatement({
    required this.body,
    required this.catchParameter,
    required this.catchBody,
    required this.finallyBody,
  });

  final List<EsmStatement> body;
  final EsmParameter? catchParameter;
  final List<EsmStatement>? catchBody;
  final List<EsmStatement>? finallyBody;
}

sealed class EsmExpression extends EsmNode {
  const EsmExpression();
}

final class EsmIdentifier extends EsmExpression {
  const EsmIdentifier(this.name);

  final String name;
}

final class EsmImportMeta extends EsmExpression {
  const EsmImportMeta();
}

final class EsmStringLiteral extends EsmExpression {
  const EsmStringLiteral(this.value);

  final String value;
}

final class EsmStringConcatenation extends EsmExpression {
  const EsmStringConcatenation(this.expressions);

  final List<EsmExpression> expressions;
}

final class EsmAssignment extends EsmExpression {
  const EsmAssignment({required this.target, required this.value});

  final EsmExpression target;
  final EsmExpression value;
}

final class EsmBinary extends EsmExpression {
  const EsmBinary({
    required this.left,
    required this.operator,
    required this.right,
  });

  final EsmExpression left;
  final EsmBinaryOperator operator;
  final EsmExpression right;
}

enum EsmBinaryOperator {
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

final class EsmUnary extends EsmExpression {
  const EsmUnary({required this.operator, required this.operand});

  final EsmUnaryOperator operator;
  final EsmExpression operand;
}

enum EsmUnaryOperator { logicalNot, negate, bitNot, typeOf }

final class EsmConditional extends EsmExpression {
  const EsmConditional({
    required this.condition,
    required this.thenExpression,
    required this.otherwiseExpression,
  });

  final EsmExpression condition;
  final EsmExpression thenExpression;
  final EsmExpression otherwiseExpression;
}

final class EsmNullishCoalesce extends EsmExpression {
  const EsmNullishCoalesce({required this.left, required this.right});

  final EsmExpression left;
  final EsmExpression right;
}

final class EsmParenthesized extends EsmExpression {
  const EsmParenthesized(this.expression);

  final EsmExpression expression;
}

final class EsmNumberLiteral extends EsmExpression {
  const EsmNumberLiteral(this.value);

  final num value;
}

final class EsmBooleanLiteral extends EsmExpression {
  const EsmBooleanLiteral(this.value);

  final bool value;
}

final class EsmNullLiteral extends EsmExpression {
  const EsmNullLiteral();
}

final class EsmArrayLiteral extends EsmExpression {
  const EsmArrayLiteral(this.elements);

  final List<EsmExpression> elements;
}

final class EsmObjectLiteral extends EsmExpression {
  const EsmObjectLiteral(this.properties);

  final List<EsmObjectLiteralProperty> properties;
}

sealed class EsmPropertyKey extends EsmNode {
  const EsmPropertyKey();
}

final class EsmStaticPropertyKey extends EsmPropertyKey {
  const EsmStaticPropertyKey(this.value);

  final String value;
}

final class EsmComputedPropertyKey extends EsmPropertyKey {
  const EsmComputedPropertyKey(this.expression);

  final EsmExpression expression;
}

final class EsmObjectLiteralProperty extends EsmNode {
  const EsmObjectLiteralProperty({required this.key, required this.value});

  EsmObjectLiteralProperty.static({required String key, required this.value})
    : key = EsmStaticPropertyKey(key);

  EsmObjectLiteralProperty.computed({
    required EsmExpression key,
    required this.value,
  }) : key = EsmComputedPropertyKey(key);

  final EsmPropertyKey key;
  final EsmExpression value;
}

final class EsmArrowFunction extends EsmExpression {
  const EsmArrowFunction({required this.parameters, required this.body});

  final List<EsmParameter> parameters;
  final EsmExpression body;
}

final class EsmFunctionExpression extends EsmExpression {
  const EsmFunctionExpression({required this.parameters, required this.body});

  final List<EsmParameter> parameters;
  final List<EsmStatement> body;
}

final class EsmArrowBlockFunction extends EsmExpression {
  const EsmArrowBlockFunction({required this.parameters, required this.body});

  final List<EsmParameter> parameters;
  final List<EsmStatement> body;
}

final class EsmCall extends EsmExpression {
  const EsmCall({required this.callee, required this.arguments});

  final EsmExpression callee;
  final List<EsmExpression> arguments;
}

final class EsmNew extends EsmExpression {
  const EsmNew({required this.callee, required this.arguments});

  final EsmExpression callee;
  final List<EsmExpression> arguments;
}

final class EsmPropertyAccess extends EsmExpression {
  const EsmPropertyAccess({required this.receiver, required this.property});

  final EsmExpression receiver;
  final String property;
}

final class EsmComputedPropertyAccess extends EsmExpression {
  const EsmComputedPropertyAccess({
    required this.receiver,
    required this.property,
  });

  final EsmExpression receiver;
  final EsmExpression property;
}

final class EsmOptionalPropertyAccess extends EsmExpression {
  const EsmOptionalPropertyAccess({
    required this.receiver,
    required this.property,
  });

  final EsmExpression receiver;
  final String property;
}

final class EsmOptionalMethodCall extends EsmExpression {
  const EsmOptionalMethodCall({
    required this.receiver,
    required this.property,
    required this.arguments,
  });

  final EsmExpression receiver;
  final String property;
  final List<EsmExpression> arguments;
}

final class EsmThis extends EsmExpression {
  const EsmThis();
}

final class EsmNewTarget extends EsmExpression {
  const EsmNewTarget();
}

final class EsmSuper extends EsmExpression {
  const EsmSuper();
}
