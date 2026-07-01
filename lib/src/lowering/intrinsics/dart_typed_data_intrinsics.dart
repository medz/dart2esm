import 'package:kernel/kernel.dart' as k;

import '../../foundation/kernel/kernel_references.dart';
import '../../foundation/kernel/sdk_symbols.dart';
import '../../ast/esm_ast.dart';
import '../../transformer/helpers/runtime_helpers.dart';

EsmExpression? lowerDartTypedDataInstanceConstant(k.InstanceConstant constant) {
  final classPath = kernelReferencePath(constant.classReference);
  if (classPath != 'dart:typed_data::Endian') {
    return null;
  }
  for (final value in constant.fieldValues.values) {
    if (value is k.BoolConstant) {
      return EsmBooleanLiteral(value.value);
    }
  }
  return null;
}

EsmExpression? lowerByteDataInstanceInvocation({
  required k.Reference reference,
  required String name,
  required EsmExpression receiver,
  required List<k.Expression> positional,
  required EsmExpression Function(k.Expression argument) lower,
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

  final arguments = <EsmExpression>[];
  for (var index = 0; index < positional.length; index++) {
    final argument = lower(positional[index]);
    if (is64Bit && !isGetter && index == 1) {
      arguments.add(
        EsmCall(callee: const EsmIdentifier('BigInt'), arguments: [argument]),
      );
    } else {
      arguments.add(argument);
    }
  }
  final call = EsmCall(
    callee: EsmPropertyAccess(receiver: receiver, property: nativeMethod),
    arguments: arguments,
  );
  if (is64Bit && isGetter) {
    return EsmCall(callee: const EsmIdentifier('Number'), arguments: [call]);
  }
  return call;
}

EsmExpression? lowerByteBufferInstanceInvocation({
  required k.Reference reference,
  required String name,
  required EsmExpression Function() lowerReceiver,
  required List<k.Expression> positional,
  required EsmExpression Function(k.Expression argument) lower,
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
  final receiver = lowerReceiver();
  final arguments = <EsmExpression>[
    receiver,
    positional.isNotEmpty ? lower(positional[0]) : const EsmNumberLiteral(0),
  ];
  if (positional.length >= 2 && !_isNullLiteral(positional[1])) {
    arguments.add(lower(positional[1]));
  }
  return EsmNew(callee: EsmIdentifier(constructor), arguments: arguments);
}

EsmExpression? lowerTypedDataInstanceInvocation({
  required k.Reference reference,
  required String name,
  required k.Arguments arguments,
  required EsmRuntimeHelperUseSet helpers,
  required EsmExpression Function() lowerReceiver,
  required EsmExpression Function(k.Expression argument) lower,
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
  final byteBuffer = lowerByteBufferInstanceInvocation(
    reference: reference,
    name: name,
    lowerReceiver: lowerReceiver,
    positional: positional,
    lower: lower,
  );
  if (byteBuffer != null) {
    return byteBuffer;
  }
  return _lowerTypedDataListInstanceInvocation(
    name: name,
    positional: positional,
    helpers: helpers,
    lowerReceiver: lowerReceiver,
    lower: lower,
  );
}

EsmExpression? _lowerTypedDataListInstanceInvocation({
  required String name,
  required List<k.Expression> positional,
  required EsmRuntimeHelperUseSet helpers,
  required EsmExpression Function() lowerReceiver,
  required EsmExpression Function(k.Expression argument) lower,
}) {
  if (name == 'sublist' && positional.isNotEmpty && positional.length <= 2) {
    final receiver = lowerReceiver();
    return EsmCall(
      callee: EsmPropertyAccess(receiver: receiver, property: 'slice'),
      arguments: [for (final argument in positional) lower(argument)],
    );
  }
  if (name == 'getRange' && positional.length == 2) {
    final receiver = lowerReceiver();
    return EsmCall(
      callee: EsmPropertyAccess(receiver: receiver, property: 'slice'),
      arguments: [for (final argument in positional) lower(argument)],
    );
  }
  if (name == 'setAll' && positional.length == 2) {
    helpers.require(EsmRuntimeHelper.listMutation);
    final receiver = lowerReceiver();
    return EsmCall(
      callee: const EsmIdentifier('__dartListSetAll'),
      arguments: [receiver, lower(positional[0]), lower(positional[1])],
    );
  }
  if (name == 'setRange' && positional.length >= 3 && positional.length <= 4) {
    helpers.require(EsmRuntimeHelper.listRangeOps);
    final receiver = lowerReceiver();
    return EsmCall(
      callee: const EsmIdentifier('__dartListSetRange'),
      arguments: [receiver, for (final argument in positional) lower(argument)],
    );
  }
  if (name == 'fillRange' && positional.length >= 2 && positional.length <= 3) {
    helpers.require(EsmRuntimeHelper.listMutation);
    final receiver = lowerReceiver();
    return EsmCall(
      callee: const EsmIdentifier('__dartListFillRange'),
      arguments: [
        receiver,
        lower(positional[0]),
        lower(positional[1]),
        positional.length == 3
            ? lower(positional[2])
            : const EsmNumberLiteral(0),
      ],
    );
  }
  if (name == 'asMap' && positional.isEmpty) {
    helpers.require(EsmRuntimeHelper.listMutation);
    return EsmCall(
      callee: const EsmIdentifier('__dartListAsMap'),
      arguments: [lowerReceiver()],
    );
  }
  if ((name == 'indexOf' || name == 'lastIndexOf') &&
      positional.isNotEmpty &&
      positional.length <= 2) {
    final receiver = lowerReceiver();
    return EsmCall(
      callee: EsmPropertyAccess(receiver: receiver, property: name),
      arguments: [for (final argument in positional) lower(argument)],
    );
  }
  return null;
}

bool isByteDataInstanceInvocationIntrinsic(k.Reference reference, String name) {
  return isDartTypedDataClassMember(reference, 'ByteData', name) &&
      _byteDataNativeMethodName(name) != null;
}

EsmExpression? lowerTypedDataInstanceGet({
  required k.Reference reference,
  required String name,
  required EsmExpression Function() lowerReceiver,
}) {
  if (!isDartTypedDataMember(reference, name)) {
    return null;
  }
  final receiver = lowerReceiver();
  return switch (name) {
    'buffer' => EsmPropertyAccess(receiver: receiver, property: 'buffer'),
    'lengthInBytes' => EsmPropertyAccess(
      receiver: receiver,
      property: 'byteLength',
    ),
    'offsetInBytes' => EsmPropertyAccess(
      receiver: receiver,
      property: 'byteOffset',
    ),
    'elementSizeInBytes' => EsmConditional(
      condition: EsmBinary(
        left: receiver,
        operator: EsmBinaryOperator.instanceOf,
        right: const EsmIdentifier('DataView'),
      ),
      thenExpression: const EsmNumberLiteral(1),
      otherwiseExpression: EsmPropertyAccess(
        receiver: receiver,
        property: 'BYTES_PER_ELEMENT',
      ),
    ),
    _ => null,
  };
}

EsmExpression? lowerTypedDataStaticInvocation({
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
      return EsmNew(
        callee: const EsmIdentifier('DataView'),
        arguments: [
          EsmNew(
            callee: const EsmIdentifier('ArrayBuffer'),
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
    return EsmNew(
      callee: EsmIdentifier(constructor),
      arguments: [lower(positional.single)],
    );
  }
  if (factoryName == 'fromList' && positional.length == 1) {
    final arguments = <EsmExpression>[lower(positional.single)];
    if (constructor == 'BigInt64Array' || constructor == 'BigUint64Array') {
      arguments.add(
        const EsmArrowFunction(
          parameters: [EsmIdentifierParameter(name: 'value')],
          body: EsmCall(
            callee: EsmIdentifier('BigInt'),
            arguments: [EsmIdentifier('value')],
          ),
        ),
      );
    }
    return EsmCall(
      callee: EsmPropertyAccess(
        receiver: EsmIdentifier(constructor),
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

EsmExpression? _lowerTypedDataView(
  String constructor,
  List<k.Expression> positional,
  EsmExpression Function(k.Expression argument) lower,
) {
  if (positional.isEmpty || positional.length > 3) {
    return null;
  }
  final arguments = <EsmExpression>[lower(positional[0])];
  if (positional.length >= 2) {
    arguments.add(lower(positional[1]));
  }
  if (positional.length >= 3 && !_isNullLiteral(positional[2])) {
    arguments.add(lower(positional[2]));
  }
  return EsmNew(callee: EsmIdentifier(constructor), arguments: arguments);
}

EsmExpression? _lowerTypedDataSublistView(
  EsmRuntimeHelperUseSet helpers,
  EsmRuntimeHelperRegistry runtimeHelpers,
  String constructor, {
  required int bytesPerElement,
  required List<k.Expression> positional,
  required EsmExpression Function(k.Expression argument) lower,
}) {
  if (positional.isEmpty || positional.length > 3) {
    return null;
  }
  helpers.require(EsmRuntimeHelper.typedDataSublistView);
  return EsmCall(
    callee: helpers.reference(
      runtimeHelpers,
      EsmRuntimeHelper.typedDataSublistView,
    ),
    arguments: [
      lower(positional[0]),
      positional.length >= 2 ? lower(positional[1]) : const EsmNumberLiteral(0),
      positional.length >= 3 ? lower(positional[2]) : const EsmNullLiteral(),
      EsmIdentifier(constructor),
      EsmNumberLiteral(bytesPerElement),
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
