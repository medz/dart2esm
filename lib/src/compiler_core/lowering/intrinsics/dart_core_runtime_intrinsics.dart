import 'package:kernel/kernel.dart' as k;

import '../../../kernel/sdk_symbols.dart';
import '../../ir/esm_ir.dart';
import '../../runtime/runtime_helpers.dart';

EsmExpressionIr? lowerDartCoreRuntimeStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpressionIr Function(k.Expression argument) lower,
  required EsmExpressionIr Function(EsmExpressionIr value) arrayFrom,
}) {
  return _lowerDartCoreObjectStaticInvocation(
        expression: expression,
        helpers: helpers,
        runtimeHelpers: runtimeHelpers,
        lower: lower,
        arrayFrom: arrayFrom,
      ) ??
      _lowerDartCoreFunctionStaticInvocation(
        expression: expression,
        helpers: helpers,
        runtimeHelpers: runtimeHelpers,
        lower: lower,
      );
}

EsmExpressionIr? _lowerDartCoreObjectStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpressionIr Function(k.Expression argument) lower,
  required EsmExpressionIr Function(EsmExpressionIr value) arrayFrom,
}) {
  if (expression.arguments.named.isNotEmpty ||
      expression.arguments.types.isNotEmpty) {
    return null;
  }
  final positional = expression.arguments.positional;
  switch (dartCoreObjectStaticInvocationSymbol(expression.targetReference)) {
    case DartCoreObjectStaticInvocationSymbol.hash when positional.length >= 2:
      helpers.require(EsmRuntimeHelper.objectHash);
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.objectHash),
        arguments: [
          EsmArrayLiteralIr([
            for (final argument in positional) lower(argument),
          ]),
        ],
      );
    case DartCoreObjectStaticInvocationSymbol.hashAll
        when positional.length == 1:
      helpers.require(EsmRuntimeHelper.objectHash);
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.objectHash),
        arguments: [arrayFrom(lower(positional.single))],
      );
    case DartCoreObjectStaticInvocationSymbol.hashAllUnordered
        when positional.length == 1:
      helpers.require(EsmRuntimeHelper.objectHash);
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartObjectHashUnordered'),
        arguments: [arrayFrom(lower(positional.single))],
      );
    default:
      return null;
  }
}

EsmExpressionIr? _lowerDartCoreFunctionStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpressionIr Function(k.Expression argument) lower,
}) {
  final arguments = expression.arguments;
  final positional = arguments.positional;
  if (arguments.named.isNotEmpty || arguments.types.isNotEmpty) {
    return null;
  }
  switch (dartSdkStaticInvocationSymbol(expression.targetReference)) {
    case DartSdkStaticInvocationSymbol.coreFunctionApply
        when positional.length >= 2 && positional.length <= 3:
      helpers.require(EsmRuntimeHelper.functionApply);
      return EsmCallIr(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.functionApply,
        ),
        arguments: [
          for (final argument in positional) lower(argument),
          if (positional.length == 2) const EsmNullLiteralIr(),
        ],
      );
    case DartSdkStaticInvocationSymbol.coreIdentical
        when positional.length == 2:
      return EsmCallIr(
        callee: const EsmPropertyAccessIr(
          receiver: EsmIdentifierIr('Object'),
          property: 'is',
        ),
        arguments: [for (final argument in positional) lower(argument)],
      );
    case DartSdkStaticInvocationSymbol.coreIdentityHashCode
        when positional.length == 1:
      helpers.require(EsmRuntimeHelper.objectHash);
      return EsmCallIr(
        callee: const EsmIdentifierIr('__dartHashValue'),
        arguments: [lower(positional.single)],
      );
    case DartSdkStaticInvocationSymbol.corePrint when positional.length == 1:
      helpers.require(EsmRuntimeHelper.print);
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.print),
        arguments: [lower(positional.single)],
      );
    default:
      return null;
  }
}
