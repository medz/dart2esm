import 'package:kernel/kernel.dart' as k;

import '../../../kernel/kernel_references.dart';
import '../../../kernel/sdk_symbols.dart';
import '../../ir/esm_ir.dart';
import '../../runtime/runtime_helpers.dart';

EsmExpressionIr? lowerDartCoreTimeStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmExpressionIr Function(k.Expression argument) lower,
}) {
  final target = kernelReferencePath(expression.targetReference);
  final positional = expression.arguments.positional;
  if ((target == 'dart:core::DateTime::@methods::parse' ||
          target == 'dart:core::DateTime::@methods::tryParse') &&
      positional.length == 1 &&
      expression.arguments.named.isEmpty &&
      expression.arguments.types.isEmpty) {
    helpers.require(EsmRuntimeHelper.dateTime);
    return EsmCallIr(
      callee: const EsmIdentifierIr('__dartDateTimeParse'),
      arguments: [
        lower(positional.single),
        EsmBooleanLiteralIr(target.endsWith('tryParse')),
      ],
    );
  }
  if (dartSdkStaticInvocationSymbol(expression.targetReference) ==
          DartSdkStaticInvocationSymbol.coreDateTimeCopyWith &&
      positional.length == 1 &&
      expression.arguments.types.isEmpty &&
      _hasOnlyNamedArguments(expression.arguments, {
        'year',
        'month',
        'day',
        'hour',
        'minute',
        'second',
        'millisecond',
        'microsecond',
        'isUtc',
      })) {
    helpers.require(EsmRuntimeHelper.dateTime);
    return EsmCallIr(
      callee: const EsmIdentifierIr('__dartDateTimeCopyWith'),
      arguments: [
        lower(positional.single),
        EsmObjectLiteralIr([
          for (final argument in expression.arguments.named)
            EsmObjectLiteralPropertyIr.static(
              key: argument.name,
              value: lower(argument.value),
            ),
        ]),
      ],
    );
  }
  return null;
}

bool _hasOnlyNamedArguments(k.Arguments arguments, Set<String> names) {
  for (final argument in arguments.named) {
    if (!names.contains(argument.name)) {
      return false;
    }
  }
  return true;
}
