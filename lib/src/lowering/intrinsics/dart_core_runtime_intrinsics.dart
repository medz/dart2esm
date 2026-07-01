import 'package:kernel/kernel.dart' as k;

import '../../foundation/kernel/sdk_symbols.dart';
import '../../ast/esm_ast.dart';
import '../../runtime/runtime_helpers.dart';

EsmExpression? lowerDartCoreRuntimeStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpression Function(k.Expression argument) lower,
  required EsmExpression Function(EsmExpression value) arrayFrom,
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

EsmExpression? _lowerDartCoreObjectStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpression Function(k.Expression argument) lower,
  required EsmExpression Function(EsmExpression value) arrayFrom,
}) {
  if (expression.arguments.named.isNotEmpty ||
      expression.arguments.types.isNotEmpty) {
    return null;
  }
  final positional = expression.arguments.positional;
  switch (dartCoreObjectStaticInvocationSymbol(expression.targetReference)) {
    case DartCoreObjectStaticInvocationSymbol.hash when positional.length >= 2:
      helpers.require(EsmRuntimeHelper.objectHash);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.objectHash),
        arguments: [
          EsmArrayLiteral([for (final argument in positional) lower(argument)]),
        ],
      );
    case DartCoreObjectStaticInvocationSymbol.hashAll
        when positional.length == 1:
      helpers.require(EsmRuntimeHelper.objectHash);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.objectHash),
        arguments: [arrayFrom(lower(positional.single))],
      );
    case DartCoreObjectStaticInvocationSymbol.hashAllUnordered
        when positional.length == 1:
      helpers.require(EsmRuntimeHelper.objectHash);
      return EsmCall(
        callee: const EsmIdentifier('__dartObjectHashUnordered'),
        arguments: [arrayFrom(lower(positional.single))],
      );
    default:
      return null;
  }
}

EsmExpression? _lowerDartCoreFunctionStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpression Function(k.Expression argument) lower,
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
      return EsmCall(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.functionApply,
        ),
        arguments: [
          for (final argument in positional) lower(argument),
          if (positional.length == 2) const EsmNullLiteral(),
        ],
      );
    case DartSdkStaticInvocationSymbol.coreIdentical
        when positional.length == 2:
      return EsmCall(
        callee: const EsmPropertyAccess(
          receiver: EsmIdentifier('Object'),
          property: 'is',
        ),
        arguments: [for (final argument in positional) lower(argument)],
      );
    case DartSdkStaticInvocationSymbol.coreIdentityHashCode
        when positional.length == 1:
      helpers.require(EsmRuntimeHelper.objectHash);
      return EsmCall(
        callee: const EsmIdentifier('__dartHashValue'),
        arguments: [lower(positional.single)],
      );
    case DartSdkStaticInvocationSymbol.corePrint when positional.length == 1:
      helpers.require(EsmRuntimeHelper.print);
      return EsmCall(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.print),
        arguments: [lower(positional.single)],
      );
    default:
      return null;
  }
}
