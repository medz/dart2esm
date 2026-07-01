import 'package:kernel/kernel.dart' as k;

import '../../../kernel/sdk_symbols.dart';
import '../../ir/esm_ir.dart';
import '../../runtime/runtime_helpers.dart';

EsmExpressionIr? lowerDartCoreIterableStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmExpressionIr Function(k.Expression argument) lower,
  required EsmExpressionIr Function(EsmExpressionIr value) arrayFrom,
}) {
  final positional = expression.arguments.positional;
  switch (dartSdkStaticInvocationSymbol(expression.targetReference)) {
    case DartSdkStaticInvocationSymbol.coreIterableToFullString ||
            DartSdkStaticInvocationSymbol.coreIterableToShortString
        when positional.isNotEmpty &&
            positional.length <= 3 &&
            expression.arguments.named.isEmpty &&
            expression.arguments.types.isEmpty:
      helpers.require(EsmRuntimeHelper.stringify);
      return _dartDelimitedCollectionToString(
        positional.length >= 2
            ? lower(positional[1])
            : const EsmStringLiteralIr('('),
        _joinMappedIterable(
          arrayFrom,
          lower(positional.first),
          _dartStringifyValue(),
        ),
        positional.length >= 3
            ? lower(positional[2])
            : const EsmStringLiteralIr(')'),
      );
    default:
      return null;
  }
}

EsmArrowFunctionIr _dartStringifyValue() {
  return const EsmArrowFunctionIr(
    parameters: [EsmIdentifierParameterIr(name: 'value')],
    body: EsmCallIr(
      callee: EsmIdentifierIr('__dartStr'),
      arguments: [EsmIdentifierIr('value')],
    ),
  );
}

EsmStringConcatenationIr _dartDelimitedCollectionToString(
  EsmExpressionIr open,
  EsmExpressionIr body,
  EsmExpressionIr close,
) {
  return EsmStringConcatenationIr([open, body, close]);
}

EsmCallIr _joinMappedIterable(
  EsmExpressionIr Function(EsmExpressionIr value) arrayFrom,
  EsmExpressionIr iterable,
  EsmExpressionIr callback,
) {
  return _join(
    EsmCallIr(
      callee: EsmPropertyAccessIr(
        receiver: arrayFrom(iterable),
        property: 'map',
      ),
      arguments: [callback],
    ),
  );
}

EsmCallIr _join(EsmExpressionIr iterable) {
  return EsmCallIr(
    callee: EsmPropertyAccessIr(receiver: iterable, property: 'join'),
    arguments: const [EsmStringLiteralIr(', ')],
  );
}
