import 'package:kernel/kernel.dart' as k;

import '../../../kernel/kernel_references.dart';
import '../../ir/esm_ir.dart';
import '../../runtime/runtime_helpers.dart';

EsmExpressionIr? lowerDartCoreNumberStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpressionIr Function(k.Expression argument) lower,
}) {
  if (expression.arguments.types.isNotEmpty) {
    return null;
  }
  final target = kernelReferencePath(expression.targetReference);
  final bigIntStatic = _lowerDartCoreBigIntStaticInvocation(
    expression: expression,
    target: target,
    helpers: helpers,
    runtimeHelpers: runtimeHelpers,
    lower: lower,
  );
  if (bigIntStatic != null) {
    return bigIntStatic;
  }
  final isTryParse = switch (target) {
    'dart:core::int::@methods::parse' => false,
    'dart:core::int::@methods::tryParse' => true,
    _ => null,
  };
  if (isTryParse == null) {
    return _lowerDartCoreDoubleStaticInvocation(
      expression: expression,
      target: target,
      helpers: helpers,
      runtimeHelpers: runtimeHelpers,
      lower: lower,
    );
  }
  final positional = expression.arguments.positional;
  if (positional.length != 1 ||
      expression.arguments.named.any((argument) => argument.name != 'radix')) {
    return null;
  }
  final radixArguments = [
    for (final argument in expression.arguments.named)
      if (argument.name == 'radix') argument.value,
  ];
  if (radixArguments.length > 1) {
    return null;
  }
  final radix = radixArguments.isEmpty ? null : radixArguments.single;
  helpers.require(EsmRuntimeHelper.intParse);
  return EsmCallIr(
    callee: isTryParse
        ? const EsmIdentifierIr('__dartIntTryParse')
        : helpers.reference(runtimeHelpers, EsmRuntimeHelper.intParse),
    arguments: [lower(positional.single), if (radix != null) lower(radix)],
  );
}

EsmExpressionIr? _lowerDartCoreDoubleStaticInvocation({
  required k.StaticInvocation expression,
  required String target,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpressionIr Function(k.Expression argument) lower,
}) {
  final callee = switch (target) {
    'dart:core::double::@methods::parse' => helpers.reference(
      runtimeHelpers,
      EsmRuntimeHelper.doubleParse,
    ),
    'dart:core::double::@methods::tryParse' => const EsmIdentifierIr(
      '__dartDoubleTryParse',
    ),
    'dart:core::num::@methods::parse' => const EsmIdentifierIr(
      '__dartNumParse',
    ),
    'dart:core::num::@methods::tryParse' => const EsmIdentifierIr(
      '__dartNumTryParse',
    ),
    _ => null,
  };
  if (callee == null) {
    return null;
  }
  final positional = expression.arguments.positional;
  if (positional.length != 1 || expression.arguments.named.isNotEmpty) {
    return null;
  }
  helpers.require(EsmRuntimeHelper.doubleParse);
  return EsmCallIr(callee: callee, arguments: [lower(positional.single)]);
}

EsmExpressionIr? _lowerDartCoreBigIntStaticInvocation({
  required k.StaticInvocation expression,
  required String target,
  required EsmRuntimeHelperUseSet helpers,
  required EsmRuntimeHelperRegistry runtimeHelpers,
  required EsmExpressionIr Function(k.Expression argument) lower,
}) {
  if (target == 'dart:core::BigInt::@factories::from' ||
      target == 'dart:core::BigInt::@methods::from') {
    if (expression.arguments.positional.length != 1 ||
        expression.arguments.named.isNotEmpty) {
      return null;
    }
    return EsmCallIr(
      callee: const EsmIdentifierIr('BigInt'),
      arguments: [
        EsmCallIr(
          callee: const EsmPropertyAccessIr(
            receiver: EsmIdentifierIr('Math'),
            property: 'trunc',
          ),
          arguments: [lower(expression.arguments.positional.single)],
        ),
      ],
    );
  }
  final tryParse = switch (target) {
    'dart:core::BigInt::@methods::parse' => false,
    'dart:core::BigInt::@methods::tryParse' => true,
    _ => null,
  };
  if (tryParse == null) {
    return null;
  }
  final positional = expression.arguments.positional;
  if (positional.length != 1 ||
      expression.arguments.named.any((argument) => argument.name != 'radix')) {
    return null;
  }
  final radixArguments = [
    for (final argument in expression.arguments.named)
      if (argument.name == 'radix') argument.value,
  ];
  if (radixArguments.length > 1) {
    return null;
  }
  final radix = radixArguments.isEmpty ? null : radixArguments.single;
  helpers.require(EsmRuntimeHelper.bigIntParse);
  return EsmCallIr(
    callee: helpers.reference(runtimeHelpers, EsmRuntimeHelper.bigIntParse),
    arguments: [
      lower(positional.single),
      if (radix == null) const EsmNullLiteralIr() else lower(radix),
      EsmBooleanLiteralIr(tryParse),
    ],
  );
}
