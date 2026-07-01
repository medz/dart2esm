import 'package:kernel/kernel.dart' as k;

import '../../foundation/kernel/kernel_references.dart';
import '../../foundation/kernel/sdk_symbols.dart';
import '../../ast/esm_ast.dart';
import '../../transformer/helpers/runtime_helpers.dart';

EsmExpression? lowerDartCoreTimeStaticInvocation({
  required k.StaticInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmExpression Function(k.Expression argument) lower,
}) {
  final target = kernelReferencePath(expression.targetReference);
  final positional = expression.arguments.positional;
  if ((target == 'dart:core::DateTime::@methods::parse' ||
          target == 'dart:core::DateTime::@methods::tryParse') &&
      positional.length == 1 &&
      expression.arguments.named.isEmpty &&
      expression.arguments.types.isEmpty) {
    helpers.require(EsmRuntimeHelper.dateTime);
    return EsmCall(
      callee: const EsmIdentifier('__dartDateTimeParse'),
      arguments: [
        lower(positional.single),
        EsmBooleanLiteral(target.endsWith('tryParse')),
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
    return EsmCall(
      callee: const EsmIdentifier('__dartDateTimeCopyWith'),
      arguments: [
        lower(positional.single),
        EsmObjectLiteral([
          for (final argument in expression.arguments.named)
            EsmObjectLiteralProperty.static(
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
