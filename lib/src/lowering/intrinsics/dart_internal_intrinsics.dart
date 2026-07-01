import 'package:kernel/kernel.dart' as k;

import '../../foundation/kernel/sdk_symbols.dart';
import '../../ast/esm_ast.dart';
import '../../runtime/runtime_helpers.dart';

EsmExpression? lowerDartInternalStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpression Function(k.Expression argument) lower,
  required EsmExpression Function(EsmExpression value) arrayFrom,
}) {
  final positional = expression.arguments.positional;
  switch (dartSdkStaticInvocationSymbol(expression.targetReference)) {
    case DartSdkStaticInvocationSymbol.internalCheckNotNullable
        when positional.length == 2 && expression.arguments.named.isEmpty:
      helpers.require(EsmRuntimeHelper.nullCheck);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.nullCheck),
        arguments: [lower(positional.first)],
      );
    case DartSdkStaticInvocationSymbol.internalSort
        when positional.length == 2 && expression.arguments.named.isEmpty:
      helpers.require(EsmRuntimeHelper.compare);
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: lower(positional.first),
          property: 'sort',
        ),
        arguments: [
          EsmArrowFunction(
            parameters: const [
              EsmIdentifierParameter(name: 'left'),
              EsmIdentifierParameter(name: 'right'),
            ],
            body: EsmCall(
              callee: helpers.reference(
                runtimeHelpers,
                EsmRuntimeHelper.compare,
              ),
              arguments: [
                const EsmIdentifier('left'),
                const EsmIdentifier('right'),
                lower(positional[1]),
              ],
            ),
          ),
        ],
      );
    case DartSdkStaticInvocationSymbol.internalFollowedByFirstEfficient
        when positional.length == 2 && expression.arguments.named.isEmpty:
      return EsmCall(
        callee: EsmPropertyAccess(
          receiver: arrayFrom(lower(positional.first)),
          property: 'concat',
        ),
        arguments: [arrayFrom(lower(positional[1]))],
      );
    case DartSdkStaticInvocationSymbol.iterableElementErrorNoElement
        when positional.isEmpty &&
            expression.arguments.named.isEmpty &&
            expression.arguments.types.isEmpty:
      return _lowerCoreErrorLiteral(helpers, runtimeHelpers, 'No element');
    case DartSdkStaticInvocationSymbol.iterableElementErrorTooMany
        when positional.isEmpty &&
            expression.arguments.named.isEmpty &&
            expression.arguments.types.isEmpty:
      return _lowerCoreErrorLiteral(
        helpers,
        runtimeHelpers,
        'Too many elements',
      );
    case DartSdkStaticInvocationSymbol.iterableElementErrorTooFew
        when positional.isEmpty &&
            expression.arguments.named.isEmpty &&
            expression.arguments.types.isEmpty:
      return _lowerCoreErrorLiteral(
        helpers,
        runtimeHelpers,
        'Too few elements',
      );
    default:
      return null;
  }
}

EsmExpression _lowerCoreErrorLiteral(
  EsmRuntimeHelperUseSet helpers,
  EsmRuntimeHelperRegistry runtimeHelpers,
  String message,
) {
  helpers.require(EsmRuntimeHelper.coreError);
  return EsmCall(
    callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.coreError),
    arguments: [
      const EsmStringLiteral('StateError'),
      EsmStringLiteral(message),
    ],
  );
}
