import 'package:kernel/kernel.dart' as k;

import '../../../foundation/kernel/sdk_symbols.dart';
import '../../ir/esm_ir.dart';
import '../../runtime/runtime_helpers.dart';

EsmExpressionIr? lowerDartCoreEnumStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpressionIr Function(k.Expression argument) lower,
}) {
  if (expression.arguments.named.isNotEmpty) {
    return null;
  }
  final positional = expression.arguments.positional;
  switch (dartSdkStaticInvocationSymbol(expression.targetReference)) {
    case DartSdkStaticInvocationSymbol.coreEnumName when positional.length == 1:
      return EsmPropertyAccessIr(
        receiver: lower(positional.single),
        property: 'name',
      );
    case DartSdkStaticInvocationSymbol.coreEnumByName
        when positional.length == 2:
      helpers.require(EsmRuntimeHelper.enumByName);
      return EsmCallIr(
        callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.enumByName),
        arguments: [for (final argument in positional) lower(argument)],
      );
    case DartSdkStaticInvocationSymbol.coreEnumAsNameMap
        when positional.length == 1:
      helpers.require(EsmRuntimeHelper.enumAsNameMap);
      return EsmCallIr(
        callee: helpers.reference(
          runtimeHelpers,
          EsmRuntimeHelper.enumAsNameMap,
        ),
        arguments: [lower(positional.single)],
      );
    default:
      return null;
  }
}
