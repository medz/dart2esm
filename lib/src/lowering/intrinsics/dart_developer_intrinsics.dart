import 'package:kernel/kernel.dart' as k;

import '../../foundation/kernel/sdk_symbols.dart';
import '../../ast/esm_ast.dart';

EsmExpression? lowerDartDeveloperStaticGet(k.StaticGet expression) {
  switch (dartDeveloperStaticGetSymbol(expression.targetReference)) {
    case DartDeveloperStaticGetSymbol.timelineNow:
      return const EsmCall(
        callee: EsmPropertyAccess(
          receiver: EsmIdentifier('Math'),
          property: 'trunc',
        ),
        arguments: [
          EsmBinary(
            left: EsmCall(
              callee: EsmPropertyAccess(
                receiver: EsmIdentifier('Date'),
                property: 'now',
              ),
              arguments: [],
            ),
            operator: EsmBinaryOperator.multiply,
            right: EsmNumberLiteral(1000),
          ),
        ],
      );
    case DartDeveloperStaticGetSymbol.extensionStreamHasListener:
      return const EsmBooleanLiteral(false);
    case DartDeveloperStaticGetSymbol.reachabilityBarrier:
      return const EsmNumberLiteral(0);
    case DartDeveloperStaticGetSymbol.nativeRuntimeBuildId:
      return const EsmNullLiteral();
    case DartDeveloperStaticGetSymbol.userTagDefaultTag:
      return EsmObjectLiteral([
        EsmObjectLiteralProperty.static(
          key: 'label',
          value: EsmStringLiteral('Default'),
        ),
      ]);
    case null:
      return null;
  }
}

EsmExpression? lowerDartDeveloperStaticInvocation({
  required k.StaticInvocation expression,
  required EsmExpression Function(k.Expression argument) lower,
  required EsmExpression? Function(k.Arguments arguments, String name)
  lowerNamedArgument,
}) {
  switch (dartDeveloperStaticInvocationSymbol(expression.targetReference)) {
    case DartDeveloperStaticInvocationSymbol.debugger:
      return lowerNamedArgument(expression.arguments, 'when') ??
          const EsmBooleanLiteral(true);
    case DartDeveloperStaticInvocationSymbol.inspect:
      final positional = expression.arguments.positional;
      if (positional.isEmpty) {
        return const EsmNullLiteral();
      }
      return lower(positional.first);
    case DartDeveloperStaticInvocationSymbol.timelineTimeSync:
      final positional = expression.arguments.positional;
      if (positional.length < 2) {
        return const EsmNullLiteral();
      }
      return EsmCall(
        callee: EsmParenthesized(lower(positional[1])),
        arguments: const [],
      );
    case DartDeveloperStaticInvocationSymbol.flowBegin:
      return EsmObjectLiteral([
        EsmObjectLiteralProperty.static(
          key: 'id',
          value:
              lowerNamedArgument(expression.arguments, 'id') ??
              const EsmNumberLiteral(0),
        ),
      ]);
    case DartDeveloperStaticInvocationSymbol.flowStep:
    case DartDeveloperStaticInvocationSymbol.flowEnd:
      return EsmObjectLiteral([
        EsmObjectLiteralProperty.static(
          key: 'id',
          value: expression.arguments.positional.isEmpty
              ? const EsmNumberLiteral(0)
              : lower(expression.arguments.positional.first),
        ),
      ]);
    case DartDeveloperStaticInvocationSymbol.serviceGetInfo:
    case DartDeveloperStaticInvocationSymbol.serviceControlWebServer:
      return EsmCall(
        callee: const EsmPropertyAccess(
          receiver: EsmIdentifier('Promise'),
          property: 'resolve',
        ),
        arguments: [
          EsmObjectLiteral([
            EsmObjectLiteralProperty.static(
              key: 'type',
              value: EsmStringLiteral('VM'),
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
      return const EsmNullLiteral();
    case null:
      return null;
  }
}
