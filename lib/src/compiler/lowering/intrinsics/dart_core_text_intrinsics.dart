import 'package:kernel/kernel.dart' as k;

import '../../../foundation/kernel/kernel_references.dart';
import '../../ir/esm_ir.dart';
import '../../runtime/runtime_helpers.dart';

EsmExpressionIr? lowerDartCoreTextStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpressionIr Function(k.Expression argument) lower,
  required EsmExpressionIr? Function(k.Arguments arguments, String name)
  lowerNamedArgument,
}) {
  return _lowerDartCoreStringStaticInvocation(
        expression: expression,
        helpers: helpers,
        runtimeHelpers: runtimeHelpers,
        lower: lower,
      ) ??
      _lowerDartCoreRegExpStaticInvocation(
        expression: expression,
        helpers: helpers,
        runtimeHelpers: runtimeHelpers,
        lower: lower,
        lowerNamedArgument: lowerNamedArgument,
      );
}

EsmExpressionIr? _lowerDartCoreStringStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpressionIr Function(k.Expression argument) lower,
}) {
  if (expression.arguments.named.isNotEmpty ||
      expression.arguments.types.isNotEmpty) {
    return null;
  }
  final target = kernelReferencePath(expression.targetReference);
  final positional = expression.arguments.positional;
  if (target == 'dart:core::String::@factories::fromCharCode' &&
      positional.length == 1) {
    return EsmCallIr(
      callee: const EsmPropertyAccessIr(
        receiver: EsmIdentifierIr('String'),
        property: 'fromCodePoint',
      ),
      arguments: [lower(positional.single)],
    );
  }
  if (target == 'dart:core::String::@factories::fromCharCodes' &&
      positional.isNotEmpty &&
      positional.length <= 3) {
    helpers.require(EsmRuntimeHelper.stringFactory);
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.stringFactory),
      arguments: [for (final argument in positional) lower(argument)],
    );
  }
  return null;
}

EsmExpressionIr? _lowerDartCoreRegExpStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpressionIr Function(k.Expression argument) lower,
  required EsmExpressionIr? Function(k.Arguments arguments, String name)
  lowerNamedArgument,
}) {
  if (expression.arguments.types.isNotEmpty) {
    return null;
  }
  final target = kernelReferencePath(expression.targetReference);
  final positional = expression.arguments.positional;
  if (target.startsWith('dart:core::RegExp::@factories::') &&
      positional.length == 1 &&
      _hasOnlyNamedArguments(expression.arguments, {
        'multiLine',
        'caseSensitive',
        'unicode',
        'dotAll',
      })) {
    helpers.require(EsmRuntimeHelper.regExp);
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.regExp),
      arguments: [
        lower(positional.single),
        EsmObjectLiteralIr([
          EsmObjectLiteralPropertyIr.static(
            key: 'caseSensitive',
            value:
                lowerNamedArgument(expression.arguments, 'caseSensitive') ??
                const EsmBooleanLiteralIr(true),
          ),
          EsmObjectLiteralPropertyIr.static(
            key: 'multiLine',
            value:
                lowerNamedArgument(expression.arguments, 'multiLine') ??
                const EsmBooleanLiteralIr(false),
          ),
          EsmObjectLiteralPropertyIr.static(
            key: 'unicode',
            value:
                lowerNamedArgument(expression.arguments, 'unicode') ??
                const EsmBooleanLiteralIr(false),
          ),
          EsmObjectLiteralPropertyIr.static(
            key: 'dotAll',
            value:
                lowerNamedArgument(expression.arguments, 'dotAll') ??
                const EsmBooleanLiteralIr(false),
          ),
        ]),
      ],
    );
  }
  if (target == 'dart:core::RegExp::@methods::escape' &&
      positional.length == 1 &&
      expression.arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.regExpEscape);
    return EsmCallIr(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.regExpEscape),
      arguments: [lower(positional.single)],
    );
  }
  return null;
}

bool _hasOnlyNamedArguments(k.Arguments arguments, Set<String> names) {
  return arguments.named.every((argument) => names.contains(argument.name));
}
