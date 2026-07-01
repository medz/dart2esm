import 'package:kernel/kernel.dart' as k;

import '../../foundation/kernel/kernel_references.dart';
import '../../ast/esm_ast.dart';
import '../../runtime/runtime_helpers.dart';

EsmExpression? lowerDartConvertConstructorInvocation({
  required k.ConstructorInvocation expression,
  required EsmRuntimeHelperUseSet helpers,
  required EsmExpression Function(k.Expression argument) lower,
}) {
  if (expression.arguments.named.isNotEmpty ||
      expression.arguments.types.isNotEmpty ||
      expression.arguments.positional.length != 1) {
    return null;
  }
  final path = kernelReferencePath(expression.targetReference);
  if (!path.startsWith('dart:convert::_Byte')) {
    return null;
  }
  final helperName = switch (path) {
    final value
        when value.startsWith(
          'dart:convert::_ByteAdapterSink::@constructors::',
        ) =>
      '__dartByteConversionSinkFrom',
    final value
        when value.startsWith(
          'dart:convert::_ByteCallbackSink::@constructors::',
        ) =>
      '__dartByteConversionSink',
    _ => null,
  };
  if (helperName == null) {
    return null;
  }
  helpers.require(EsmRuntimeHelper.byteConversionSink);
  return EsmCall(
    callee: EsmIdentifier(helperName),
    arguments: [lower(expression.arguments.positional.single)],
  );
}
