import 'package:kernel/kernel.dart' as k;

import '../../../kernel/sdk_symbols.dart';
import '../../ir/esm_ir.dart';

EsmExpressionIr? lowerDartDeveloperStaticGet(k.StaticGet expression) {
  switch (dartDeveloperStaticGetSymbol(expression.targetReference)) {
    case DartDeveloperStaticGetSymbol.timelineNow:
      return const EsmCallIr(
        callee: EsmPropertyAccessIr(
          receiver: EsmIdentifierIr('Math'),
          property: 'trunc',
        ),
        arguments: [
          EsmBinaryIr(
            left: EsmCallIr(
              callee: EsmPropertyAccessIr(
                receiver: EsmIdentifierIr('Date'),
                property: 'now',
              ),
              arguments: [],
            ),
            operator: EsmBinaryOperatorIr.multiply,
            right: EsmNumberLiteralIr(1000),
          ),
        ],
      );
    case DartDeveloperStaticGetSymbol.extensionStreamHasListener:
      return const EsmBooleanLiteralIr(false);
    case DartDeveloperStaticGetSymbol.reachabilityBarrier:
      return const EsmNumberLiteralIr(0);
    case DartDeveloperStaticGetSymbol.nativeRuntimeBuildId:
      return const EsmNullLiteralIr();
    case DartDeveloperStaticGetSymbol.userTagDefaultTag:
      return EsmObjectLiteralIr([
        EsmObjectLiteralPropertyIr.static(
          key: 'label',
          value: EsmStringLiteralIr('Default'),
        ),
      ]);
    case null:
      return null;
  }
}

EsmExpressionIr? lowerDartDeveloperStaticInvocation({
  required k.StaticInvocation expression,
  required EsmExpressionIr Function(k.Expression argument) lower,
  required EsmExpressionIr? Function(k.Arguments arguments, String name)
  lowerNamedArgument,
}) {
  switch (dartDeveloperStaticInvocationSymbol(expression.targetReference)) {
    case DartDeveloperStaticInvocationSymbol.debugger:
      return lowerNamedArgument(expression.arguments, 'when') ??
          const EsmBooleanLiteralIr(true);
    case DartDeveloperStaticInvocationSymbol.inspect:
      final positional = expression.arguments.positional;
      if (positional.isEmpty) {
        return const EsmNullLiteralIr();
      }
      return lower(positional.first);
    case DartDeveloperStaticInvocationSymbol.timelineTimeSync:
      final positional = expression.arguments.positional;
      if (positional.length < 2) {
        return const EsmNullLiteralIr();
      }
      return EsmCallIr(
        callee: EsmParenthesizedIr(lower(positional[1])),
        arguments: const [],
      );
    case DartDeveloperStaticInvocationSymbol.flowBegin:
      return EsmObjectLiteralIr([
        EsmObjectLiteralPropertyIr.static(
          key: 'id',
          value:
              lowerNamedArgument(expression.arguments, 'id') ??
              const EsmNumberLiteralIr(0),
        ),
      ]);
    case DartDeveloperStaticInvocationSymbol.flowStep:
    case DartDeveloperStaticInvocationSymbol.flowEnd:
      return EsmObjectLiteralIr([
        EsmObjectLiteralPropertyIr.static(
          key: 'id',
          value: expression.arguments.positional.isEmpty
              ? const EsmNumberLiteralIr(0)
              : lower(expression.arguments.positional.first),
        ),
      ]);
    case DartDeveloperStaticInvocationSymbol.serviceGetInfo:
    case DartDeveloperStaticInvocationSymbol.serviceControlWebServer:
      return EsmCallIr(
        callee: const EsmPropertyAccessIr(
          receiver: EsmIdentifierIr('Promise'),
          property: 'resolve',
        ),
        arguments: [
          EsmObjectLiteralIr([
            EsmObjectLiteralPropertyIr.static(
              key: 'type',
              value: EsmStringLiteralIr('VM'),
            ),
          ]),
        ],
      );
    case DartDeveloperStaticInvocationSymbol.serviceGetIsolateId:
    case DartDeveloperStaticInvocationSymbol.serviceGetObjectId:
    case DartDeveloperStaticInvocationSymbol.log:
    case DartDeveloperStaticInvocationSymbol.postEvent:
    case DartDeveloperStaticInvocationSymbol.registerExtension:
    case DartDeveloperStaticInvocationSymbol.timelineStartSync:
    case DartDeveloperStaticInvocationSymbol.timelineFinishSync:
    case DartDeveloperStaticInvocationSymbol.timelineInstantSync:
      return const EsmNullLiteralIr();
    case null:
      return null;
  }
}
