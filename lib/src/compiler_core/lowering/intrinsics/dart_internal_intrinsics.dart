import 'package:kernel/kernel.dart' as k;

import '../../../kernel/sdk_symbols.dart';
import '../../ir/esm_ir.dart';
import '../../runtime/runtime_helpers.dart';

EsmExpressionIr? lowerDartInternalStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpressionIr Function(k.Expression argument) lower,
  required EsmExpressionIr Function(EsmExpressionIr value) arrayFrom,
}) {
  final positional = expression.arguments.positional;
  switch (dartSdkStaticInvocationSymbol(expression.targetReference)) {
    case DartSdkStaticInvocationSymbol.internalCheckNotNullable
        when positional.length == 2 && expression.arguments.named.isEmpty:
      helpers.require(EsmRuntimeHelper.nullCheck);
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.nullCheck),
        arguments: [lower(positional.first)],
      );
    case DartSdkStaticInvocationSymbol.internalSort
        when positional.length == 2 && expression.arguments.named.isEmpty:
      helpers.require(EsmRuntimeHelper.compare);
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: lower(positional.first),
          property: 'sort',
        ),
        arguments: [
          EsmArrowFunctionIr(
            parameters: const [
              EsmIdentifierParameterIr(name: 'left'),
              EsmIdentifierParameterIr(name: 'right'),
            ],
            body: EsmCallIr(
              callee: helpers.reference(
                runtimeHelpers,
                EsmRuntimeHelper.compare,
              ),
              arguments: [
                const EsmIdentifierIr('left'),
                const EsmIdentifierIr('right'),
                lower(positional[1]),
              ],
            ),
          ),
        ],
      );
    case DartSdkStaticInvocationSymbol.internalFollowedByFirstEfficient
        when positional.length == 2 && expression.arguments.named.isEmpty:
      return EsmCallIr(
        callee: EsmPropertyAccessIr(
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

EsmExpressionIr _lowerCoreErrorLiteral(
  EsmRuntimeHelperUseSet helpers,
  EsmRuntimeHelperRegistry runtimeHelpers,
  String message,
) {
  helpers.require(EsmRuntimeHelper.coreError);
  return EsmCallIr(
    callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.coreError),
    arguments: [
      const EsmStringLiteralIr('StateError'),
      EsmStringLiteralIr(message),
    ],
  );
}
