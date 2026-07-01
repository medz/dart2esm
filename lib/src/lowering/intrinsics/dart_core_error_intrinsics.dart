import 'package:kernel/kernel.dart' as k;

import '../../foundation/kernel/kernel_references.dart';
import '../../ast/esm_ast.dart';
import '../../runtime/runtime_helpers.dart';

EsmExpression? lowerDartCoreErrorStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpression Function(k.Expression argument) lower,
}) {
  final target = kernelReferencePath(expression.targetReference);
  return _lowerArgumentErrorStaticInvocation(
        expression: expression,
        target: target,
        helpers: helpers,
        runtimeHelpers: runtimeHelpers,
        lower: lower,
      ) ??
      _lowerErrorStaticInvocation(
        expression: expression,
        target: target,
        helpers: helpers,
        runtimeHelpers: runtimeHelpers,
        lower: lower,
      ) ??
      _lowerRangeErrorStaticInvocation(
        expression: expression,
        target: target,
        helpers: helpers,
        lower: lower,
      );
}

EsmExpression? _lowerErrorStaticInvocation({
  required k.StaticInvocation expression,
  required String target,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpression Function(k.Expression argument) lower,
}) {
  if (expression.arguments.named.isNotEmpty ||
      expression.arguments.types.isNotEmpty) {
    return null;
  }
  final positional = expression.arguments.positional;
  if (target == 'dart:core::Error::@methods::safeToString' &&
      positional.length == 1) {
    helpers.require(EsmRuntimeHelper.safeToString);
    return EsmCall(
      callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.safeToString),
      arguments: [lower(positional.single)],
    );
  }
  if (target == 'dart:core::Error::@methods::throwWithStackTrace' &&
      positional.length == 2) {
    helpers.require(EsmRuntimeHelper.throwWithStackTrace);
    return EsmCall(
      callee: helpers.reference(
        runtimeHelpers,
        EsmRuntimeHelper.throwWithStackTrace,
      ),
      arguments: [for (final argument in positional) lower(argument)],
    );
  }
  return null;
}

EsmExpression? _lowerArgumentErrorStaticInvocation({
  required k.StaticInvocation expression,
  required String target,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpression Function(k.Expression argument) lower,
}) {
  final arguments = expression.arguments;
  if (target != 'dart:core::ArgumentError::@methods::checkNotNull' ||
      arguments.named.isNotEmpty ||
      arguments.types.length > 1 ||
      arguments.positional.isEmpty ||
      arguments.positional.length > 2) {
    return null;
  }
  helpers.require(EsmRuntimeHelper.argumentChecks);
  return EsmCall(
    callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.argumentChecks),
    arguments: [
      for (var i = 0; i < 2; i++)
        if (i < arguments.positional.length)
          lower(arguments.positional[i])
        else
          const EsmNullLiteral(),
    ],
  );
}

EsmExpression? _lowerRangeErrorStaticInvocation({
  required k.StaticInvocation expression,
  required String target,
  required EsmRuntimeHelperUseSet helpers,
  required EsmExpression Function(k.Expression argument) lower,
}) {
  final positional = expression.arguments.positional;
  final helperName = switch (target) {
    'dart:core::RangeError::@methods::checkValueInInterval'
        when positional.length >= 3 && positional.length <= 5 =>
      '__dartCheckValueInInterval',
    'dart:core::RangeError::@methods::checkValidIndex'
        when positional.length >= 2 && positional.length <= 5 =>
      '__dartCheckValidIndex',
    'dart:core::RangeError::@methods::checkValidRange'
        when positional.length >= 3 && positional.length <= 6 =>
      '__dartCheckValidRange',
    'dart:core::RangeError::@methods::checkNotNegative'
        when positional.isNotEmpty && positional.length <= 3 =>
      '__dartCheckNotNegative',
    _ => null,
  };
  if (helperName == null) {
    return null;
  }
  helpers.require(EsmRuntimeHelper.rangeChecks);
  final expectedArity = switch (helperName) {
    '__dartCheckValueInInterval' => 5,
    '__dartCheckValidIndex' => 5,
    '__dartCheckValidRange' => 6,
    '__dartCheckNotNegative' => 3,
    _ => throw StateError('unreachable range check helper'),
  };
  return EsmCall(
    callee: EsmIdentifier(helperName),
    arguments: [
      for (var i = 0; i < expectedArity; i++)
        if (i < positional.length)
          lower(positional[i])
        else
          const EsmNullLiteral(),
    ],
  );
}
