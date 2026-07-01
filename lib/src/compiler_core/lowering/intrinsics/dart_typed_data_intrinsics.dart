import 'package:kernel/kernel.dart' as k;

import '../../../kernel/kernel_references.dart';
import '../../../kernel/sdk_symbols.dart';
import '../../ir/esm_ir.dart';
import '../../runtime/runtime_helpers.dart';

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

EsmExpressionIr? lowerByteBufferInstanceInvocation({
  required k.Reference reference,
  required String name,
  required EsmExpressionIr receiver,
  required List<k.Expression> positional,
  required EsmExpressionIr Function(k.Expression argument) lower,
}) {
  if (!isDartTypedDataClassMember(reference, 'ByteBuffer', name) ||
      positional.length > 2) {
    return null;
  }
  final constructor = name == 'asByteData'
      ? 'DataView'
      : _typedDataByteBufferViewConstructorName(name);
  if (constructor == null) {
    return null;
  }
  final arguments = <EsmExpressionIr>[
    receiver,
    positional.isNotEmpty ? lower(positional[0]) : const EsmNumberLiteralIr(0),
  ];
  if (positional.length >= 2 && !_isNullLiteral(positional[1])) {
    arguments.add(lower(positional[1]));
  }
  return EsmNewIr(callee: EsmIdentifierIr(constructor), arguments: arguments);
}

EsmExpressionIr? lowerTypedDataInstanceInvocation({
  required k.Reference reference,
  required String name,
  required k.Arguments arguments,
  required EsmExpressionIr Function() lowerReceiver,
  required EsmExpressionIr Function(k.Expression argument) lower,
}) {
  if (arguments.named.isNotEmpty || arguments.types.isNotEmpty) {
    return null;
  }
  if (!isDartTypedDataMember(reference, name)) {
    return null;
  }
  final positional = arguments.positional;
  if (isByteDataInstanceInvocationIntrinsic(reference, name)) {
    return lowerByteDataInstanceInvocation(
      reference: reference,
      name: name,
      receiver: lowerReceiver(),
      positional: positional,
      lower: lower,
    );
  }
  return lowerByteBufferInstanceInvocation(
    reference: reference,
    name: name,
    receiver: lowerReceiver(),
    positional: positional,
    lower: lower,
  );
}

bool isByteDataInstanceInvocationIntrinsic(k.Reference reference, String name) {
  return isDartTypedDataClassMember(reference, 'ByteData', name) &&
      _byteDataNativeMethodName(name) != null;
}

EsmExpressionIr? lowerTypedDataInstanceGet({
  required k.Reference reference,
  required String name,
  required EsmExpressionIr Function() lowerReceiver,
}) {
  if (!isDartTypedDataMember(reference, name)) {
    return null;
  }
  final receiver = lowerReceiver();
  return switch (name) {
    'buffer' => EsmPropertyAccessIr(receiver: receiver, property: 'buffer'),
    'lengthInBytes' => EsmPropertyAccessIr(
      receiver: receiver,
      property: 'byteLength',
    ),
    'offsetInBytes' => EsmPropertyAccessIr(
      receiver: receiver,
      property: 'byteOffset',
    ),
    'elementSizeInBytes' => EsmConditionalIr(
      condition: EsmBinaryIr(
        left: receiver,
        operator: EsmBinaryOperatorIr.instanceOf,
        right: const EsmIdentifierIr('DataView'),
      ),
      thenExpression: const EsmNumberLiteralIr(1),
      otherwiseExpression: EsmPropertyAccessIr(
        receiver: receiver,
        property: 'BYTES_PER_ELEMENT',
      ),
    ),
    _ => null,
  };
}

EsmExpressionIr? lowerTypedDataStaticInvocation({
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
  if (!target.startsWith('dart:typed_data::')) {
    return null;
  }
  final parts = target.split('::');
  if (parts.length < 4 || parts[2] != '@factories') {
    return null;
  }
  final className = parts[1];
  final factoryName = parts.last;
  final positional = expression.arguments.positional;

  if (className == 'ByteData') {
    if (factoryName.isEmpty && positional.length == 1) {
      return EsmNewIr(
        callee: const EsmIdentifierIr('DataView'),
        arguments: [
          EsmNewIr(
            callee: const EsmIdentifierIr('ArrayBuffer'),
            arguments: [lower(positional.single)],
          ),
        ],
      );
    }
    if (factoryName == 'view') {
      return _lowerTypedDataView('DataView', positional, lower);
    }
    if (factoryName == 'sublistView') {
      return _lowerTypedDataSublistView(
        helpers,
        runtimeHelpers,
        'DataView',
        bytesPerElement: 1,
        positional: positional,
        lower: lower,
      );
    }
    return null;
  }

  final constructor = _typedDataArrayConstructorName(className);
  if (constructor == null) {
    return null;
  }
  if (factoryName.isEmpty && positional.length == 1) {
    return EsmNewIr(
      callee: EsmIdentifierIr(constructor),
      arguments: [lower(positional.single)],
    );
  }
  if (factoryName == 'fromList' && positional.length == 1) {
    final arguments = <EsmExpressionIr>[lower(positional.single)];
    if (constructor == 'BigInt64Array' || constructor == 'BigUint64Array') {
      arguments.add(
        const EsmArrowFunctionIr(
          parameters: [EsmIdentifierParameterIr(name: 'value')],
          body: EsmCallIr(
            callee: EsmIdentifierIr('BigInt'),
            arguments: [EsmIdentifierIr('value')],
          ),
        ),
      );
    }
    return EsmCallIr(
      callee: EsmPropertyAccessIr(
        receiver: EsmIdentifierIr(constructor),
        property: 'from',
      ),
      arguments: arguments,
    );
  }
  if (factoryName == 'view') {
    return _lowerTypedDataView(constructor, positional, lower);
  }
  if (factoryName == 'sublistView') {
    final bytesPerElement = _typedDataArrayBytesPerElement(className);
    if (bytesPerElement == null) {
      return null;
    }
    return _lowerTypedDataSublistView(
      helpers,
      runtimeHelpers,
      constructor,
      bytesPerElement: bytesPerElement,
      positional: positional,
      lower: lower,
    );
  }
  return null;
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

EsmExpressionIr? _lowerTypedDataView(
  String constructor,
  List<k.Expression> positional,
  EsmExpressionIr Function(k.Expression argument) lower,
) {
  if (positional.isEmpty || positional.length > 3) {
    return null;
  }
  final arguments = <EsmExpressionIr>[lower(positional[0])];
  if (positional.length >= 2) {
    arguments.add(lower(positional[1]));
  }
  if (positional.length >= 3 && !_isNullLiteral(positional[2])) {
    arguments.add(lower(positional[2]));
  }
  return EsmNewIr(callee: EsmIdentifierIr(constructor), arguments: arguments);
}

EsmExpressionIr? _lowerTypedDataSublistView(
  EsmRuntimeHelperUseSet helpers,
  EsmRuntimeHelperRegistry runtimeHelpers,
  String constructor, {
  required int bytesPerElement,
  required List<k.Expression> positional,
  required EsmExpressionIr Function(k.Expression argument) lower,
}) {
  if (positional.isEmpty || positional.length > 3) {
    return null;
  }
  helpers.require(EsmRuntimeHelper.typedDataSublistView);
  return EsmCallIr(
    callee: helpers.reference(
      runtimeHelpers,
      EsmRuntimeHelper.typedDataSublistView,
    ),
    arguments: [
      lower(positional[0]),
      positional.length >= 2
          ? lower(positional[1])
          : const EsmNumberLiteralIr(0),
      positional.length >= 3 ? lower(positional[2]) : const EsmNullLiteralIr(),
      EsmIdentifierIr(constructor),
      EsmNumberLiteralIr(bytesPerElement),
    ],
  );
}

String? _typedDataArrayConstructorName(String dartTypeName) {
  return switch (dartTypeName) {
    'Int8List' => 'Int8Array',
    'Uint8List' => 'Uint8Array',
    'Uint8ClampedList' => 'Uint8ClampedArray',
    'Int16List' => 'Int16Array',
    'Uint16List' => 'Uint16Array',
    'Int32List' => 'Int32Array',
    'Uint32List' => 'Uint32Array',
    'Int64List' => 'BigInt64Array',
    'Uint64List' => 'BigUint64Array',
    'Float32List' => 'Float32Array',
    'Float64List' => 'Float64Array',
    _ => null,
  };
}

String? _typedDataByteBufferViewConstructorName(String methodName) {
  return switch (methodName) {
    'asInt8List' => 'Int8Array',
    'asUint8List' => 'Uint8Array',
    'asUint8ClampedList' => 'Uint8ClampedArray',
    'asInt16List' => 'Int16Array',
    'asUint16List' => 'Uint16Array',
    'asInt32List' => 'Int32Array',
    'asUint32List' => 'Uint32Array',
    'asInt64List' => 'BigInt64Array',
    'asUint64List' => 'BigUint64Array',
    'asFloat32List' => 'Float32Array',
    'asFloat64List' => 'Float64Array',
    _ => null,
  };
}

int? _typedDataArrayBytesPerElement(String dartTypeName) {
  return switch (dartTypeName) {
    'Int8List' || 'Uint8List' || 'Uint8ClampedList' => 1,
    'Int16List' || 'Uint16List' => 2,
    'Int32List' || 'Uint32List' || 'Float32List' => 4,
    'Int64List' || 'Uint64List' || 'Float64List' => 8,
    _ => null,
  };
}

bool _isNullLiteral(k.Expression expression) {
  return switch (expression) {
    k.NullLiteral() => true,
    k.ConstantExpression(:final constant) when constant is k.NullConstant =>
      true,
    _ => false,
  };
}
