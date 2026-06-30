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

final class EsmVariableDeclarationIr extends EsmStatementIr {
  const EsmVariableDeclarationIr({
    required this.name,
    required this.initializer,
    required this.mutable,
  });

  final String name;
  final EsmExpressionIr? initializer;
  final bool mutable;
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
