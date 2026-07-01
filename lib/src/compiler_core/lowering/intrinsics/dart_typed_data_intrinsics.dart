import 'package:kernel/kernel.dart' as k;

import '../../../kernel/kernel_references.dart';
import '../../../kernel/sdk_symbols.dart';
import '../../ir/esm_ir.dart';

EsmExpressionIr? lowerDartTypedDataInstanceConstant(
  k.InstanceConstant constant,
) {
  final classPath = kernelReferencePath(constant.classReference);
  if (classPath != 'dart:typed_data::Endian') {
    return null;
  }
  for (final value in constant.fieldValues.values) {
    if (value is k.BoolConstant) {
      return EsmBooleanLiteralIr(value.value);
    }
  }
  return null;
}

EsmExpressionIr? lowerByteDataInstanceInvocation({
  required k.Reference reference,
  required String name,
  required EsmExpressionIr receiver,
  required List<k.Expression> positional,
  required EsmExpressionIr Function(k.Expression argument) lower,
}) {
  if (!isDartTypedDataClassMember(reference, 'ByteData', name)) {
    return null;
  }
  final nativeMethod = _byteDataNativeMethodName(name);
  if (nativeMethod == null) {
    return null;
  }
  final isGetter = name.startsWith('get');
  final is64Bit =
      name == 'getInt64' ||
      name == 'getUint64' ||
      name == 'setInt64' ||
      name == 'setUint64';
  final arity = positional.length;
  if (isGetter) {
    if (arity < 1 || arity > 2 || (name.endsWith('8') && arity != 1)) {
      return null;
    }
  } else if (arity < 2 || arity > 3 || (name.endsWith('8') && arity != 2)) {
    return null;
  }

  final arguments = <EsmExpressionIr>[];
  for (var index = 0; index < positional.length; index++) {
    final argument = lower(positional[index]);
    if (is64Bit && !isGetter && index == 1) {
      arguments.add(
        EsmCallIr(
          callee: const EsmIdentifierIr('BigInt'),
          arguments: [argument],
        ),
      );
    } else {
      arguments.add(argument);
    }
  }
  final call = EsmCallIr(
    callee: EsmPropertyAccessIr(receiver: receiver, property: nativeMethod),
    arguments: arguments,
  );
  if (is64Bit && isGetter) {
    return EsmCallIr(
      callee: const EsmIdentifierIr('Number'),
      arguments: [call],
    );
  }
  return call;
}

String? _byteDataNativeMethodName(String dartMethodName) {
  return switch (dartMethodName) {
    'getInt8' ||
    'getUint8' ||
    'getInt16' ||
    'getUint16' ||
    'getInt32' ||
    'getUint32' ||
    'getFloat32' ||
    'getFloat64' ||
    'setInt8' ||
    'setUint8' ||
    'setInt16' ||
    'setUint16' ||
    'setInt32' ||
    'setUint32' ||
    'setFloat32' ||
    'setFloat64' => dartMethodName,
    'getInt64' => 'getBigInt64',
    'getUint64' => 'getBigUint64',
    'setInt64' => 'setBigInt64',
    'setUint64' => 'setBigUint64',
    _ => null,
  };
}
