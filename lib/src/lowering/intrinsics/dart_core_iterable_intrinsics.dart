import 'package:kernel/kernel.dart' as k;

import '../../foundation/kernel/sdk_symbols.dart';
import '../../ast/esm_ast.dart';
import '../../transformer/helpers/runtime_helpers.dart';

EsmExpression? lowerDartCoreIterableStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmExpression Function(k.Expression argument) lower,
  required EsmExpression Function(EsmExpression value) arrayFrom,
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
            : const EsmStringLiteral('('),
        _joinMappedIterable(
          arrayFrom,
          lower(positional.first),
          _dartStringifyValue(),
        ),
        positional.length >= 3
            ? lower(positional[2])
            : const EsmStringLiteral(')'),
      );
    default:
      return null;
  }
}

EsmArrowFunction _dartStringifyValue() {
  return const EsmArrowFunction(
    parameters: [EsmIdentifierParameter(name: 'value')],
    body: EsmCall(
      callee: EsmIdentifier('__dartStr'),
      arguments: [EsmIdentifier('value')],
    ),
  );
}

EsmStringConcatenation _dartDelimitedCollectionToString(
  EsmExpression open,
  EsmExpression body,
  EsmExpression close,
) {
  return EsmStringConcatenation([open, body, close]);
}

EsmCall _joinMappedIterable(
  EsmExpression Function(EsmExpression value) arrayFrom,
  EsmExpression iterable,
  EsmExpression callback,
) {
  return _join(
    EsmCall(
      callee: EsmPropertyAccess(receiver: arrayFrom(iterable), property: 'map'),
      arguments: [callback],
    ),
  );
}

EsmCall _join(EsmExpression iterable) {
  return EsmCall(
    callee: EsmPropertyAccess(receiver: iterable, property: 'join'),
    arguments: const [EsmStringLiteral(', ')],
  );
}
