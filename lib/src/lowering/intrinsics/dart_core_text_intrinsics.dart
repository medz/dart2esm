import 'package:kernel/kernel.dart' as k;

import '../../foundation/kernel/kernel_references.dart';
import '../../ast/esm_ast.dart';
import '../../transformer/helpers/runtime_helpers.dart';

EsmExpression? lowerDartCoreTextStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpression Function(k.Expression argument) lower,
  required EsmExpression? Function(k.Arguments arguments, String name)
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

EsmExpression? _lowerDartCoreStringStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpression Function(k.Expression argument) lower,
}) {
  if (expression.arguments.named.isNotEmpty ||
      expression.arguments.types.isNotEmpty) {
    return null;
  }
  final target = kernelReferencePath(expression.targetReference);
  final positional = expression.arguments.positional;
  if (target == 'dart:core::String::@factories::fromCharCode' &&
      positional.length == 1) {
    return EsmCall(
      callee: const EsmPropertyAccess(
        receiver: EsmIdentifier('String'),
        property: 'fromCodePoint',
      ),
      arguments: [lower(positional.single)],
    );
  }
  if (target == 'dart:core::String::@factories::fromCharCodes' &&
      positional.isNotEmpty &&
      positional.length <= 3) {
    helpers.require(EsmRuntimeHelper.stringFactory);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.stringFactory),
      arguments: [for (final argument in positional) lower(argument)],
    );
  }
  return null;
}

EsmExpression? _lowerDartCoreRegExpStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpression Function(k.Expression argument) lower,
  required EsmExpression? Function(k.Arguments arguments, String name)
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
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.regExp),
      arguments: [
        lower(positional.single),
        EsmObjectLiteral([
          EsmObjectLiteralProperty.static(
            key: 'caseSensitive',
            value:
                lowerNamedArgument(expression.arguments, 'caseSensitive') ??
                const EsmBooleanLiteral(true),
          ),
          EsmObjectLiteralProperty.static(
            key: 'multiLine',
            value:
                lowerNamedArgument(expression.arguments, 'multiLine') ??
                const EsmBooleanLiteral(false),
          ),
          EsmObjectLiteralProperty.static(
            key: 'unicode',
            value:
                lowerNamedArgument(expression.arguments, 'unicode') ??
                const EsmBooleanLiteral(false),
          ),
          EsmObjectLiteralProperty.static(
            key: 'dotAll',
            value:
                lowerNamedArgument(expression.arguments, 'dotAll') ??
                const EsmBooleanLiteral(false),
          ),
        ]),
      ],
    );
  }
  if (target == 'dart:core::RegExp::@methods::escape' &&
      positional.length == 1 &&
      expression.arguments.named.isEmpty) {
    helpers.require(EsmRuntimeHelper.regExpEscape);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.regExpEscape),
      arguments: [lower(positional.single)],
    );
  }
  return null;
}

bool _hasOnlyNamedArguments(k.Arguments arguments, Set<String> names) {
  return arguments.named.every((argument) => names.contains(argument.name));
}
