import 'package:kernel/kernel.dart' as k;

import '../kernel/kernel_references.dart';
import '../kernel/sdk_symbols.dart';
import 'runtime_helpers.dart';

final class DartSdkTypedDataStaticInvocationEmitter {
  DartSdkTypedDataStaticInvocationEmitter({required this.helpers});

  final EsmRuntimeHelperUseSet helpers;

  String? emitStaticInvocation(
    k.StaticInvocation expression,
    List<String> positionalArgs,
  ) {
    final path = kernelReferencePath(expression.targetReference);
    if (!path.startsWith('dart:typed_data::')) {
      return null;
    }
    final parts = path.split('::');
    if (parts.length < 4 || parts[2] != '@factories') {
      return null;
    }
    if (parts[1] == 'Int32x4' && parts.last.isEmpty) {
      if (positionalArgs.length != 4) {
        return null;
      }
      return 'Object.freeze({ __dartType: "Int32x4", x: ${positionalArgs[0]}, y: ${positionalArgs[1]}, z: ${positionalArgs[2]}, w: ${positionalArgs[3]} })';
    }
    if (parts[1] == 'Float32x4') {
      if (parts.last == 'zero' && positionalArgs.isEmpty) {
        return 'Object.freeze({ __dartType: "Float32x4", x: 0, y: 0, z: 0, w: 0 })';
      }
      if (parts.last.isEmpty && positionalArgs.length == 4) {
        return 'Object.freeze({ __dartType: "Float32x4", x: ${positionalArgs[0]}, y: ${positionalArgs[1]}, z: ${positionalArgs[2]}, w: ${positionalArgs[3]} })';
      }
      return null;
    }
    if (parts[1] == 'ByteData') {
      final factoryName = parts.last;
      if (factoryName.isEmpty && positionalArgs.length == 1) {
        return 'new DataView(new ArrayBuffer(${positionalArgs.single}))';
      }
      if (factoryName == 'view') {
        return _emitTypedDataView('DataView', positionalArgs);
      }
      if (factoryName == 'sublistView') {
        helpers.add('__dartTypedDataSublistView');
        return _emitTypedDataSublistView(
          'DataView',
          bytesPerElement: 1,
          positionalArgs: positionalArgs,
        );
      }
      return null;
    }
    if (parts[1] == 'Int32x4List' || parts[1] == 'Float32x4List') {
      final factoryName = parts.last;
      if (factoryName == 'fromList' && positionalArgs.length == 1) {
        return 'Array.from(${positionalArgs.single})';
      }
      if (factoryName.isEmpty && positionalArgs.length == 1) {
        return 'new Array(${positionalArgs.single}).fill(null)';
      }
      return null;
    }
    final constructor = dartTypedDataArrayConstructorName(parts[1]);
    if (constructor == null) {
      return null;
    }
    final factoryName = parts.last;
    if (factoryName == 'fromList' && positionalArgs.length == 1) {
      if (constructor == 'BigInt64Array' || constructor == 'BigUint64Array') {
        final literal = _emitBigIntTypedDataListArgument(
          expression.arguments.positional.single,
        );
        if (literal != null) {
          return '$constructor.from($literal)';
        }
        return '$constructor.from(${positionalArgs.single}, (value) => BigInt(value))';
      }
      return '$constructor.from(${positionalArgs.single})';
    }
    if (factoryName == 'view') {
      return _emitTypedDataView(constructor, positionalArgs);
    }
    if (factoryName == 'sublistView') {
      final bytesPerElement = dartTypedDataArrayBytesPerElement(parts[1]);
      if (bytesPerElement == null) {
        return null;
      }
      helpers.add('__dartTypedDataSublistView');
      return _emitTypedDataSublistView(
        constructor,
        bytesPerElement: bytesPerElement,
        positionalArgs: positionalArgs,
      );
    }
    if (factoryName.isEmpty && positionalArgs.length == 1) {
      return 'new $constructor(${positionalArgs.single})';
    }
    return null;
  }
}

final class DartSdkTypedDataInstanceEmitter {
  DartSdkTypedDataInstanceEmitter({required this.helpers});

  final EsmRuntimeHelperUseSet helpers;

  String? emitInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
    k.Arguments arguments,
  ) {
    if (arguments.named.isNotEmpty) {
      return null;
    }
    return _emitByteDataInvocation(target, name, receiver, positionalArgs) ??
        _emitTypedDataInvocation(target, name, receiver, positionalArgs) ??
        _emitByteBufferViewInvocation(target, name, receiver, positionalArgs);
  }

  String? emitGet(k.Reference target, String name, String receiver) {
    if (!isDartTypedDataMember(target, name)) {
      return null;
    }
    return switch (name) {
      'lengthInBytes' => '$receiver.byteLength',
      'offsetInBytes' => '$receiver.byteOffset',
      'buffer' => '$receiver.buffer',
      'elementSizeInBytes' => _typedDataElementSizeExpression(receiver),
      _ => null,
    };
  }

  String? _emitByteDataInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
  ) {
    if (!isDartTypedDataClassMember(target, 'ByteData', name)) {
      return null;
    }
    if ((name == 'getInt64' || name == 'getUint64') &&
        positionalArgs.isNotEmpty &&
        positionalArgs.length <= 2) {
      final method = name == 'getInt64' ? 'getBigInt64' : 'getBigUint64';
      final endian = positionalArgs.length == 2 ? positionalArgs[1] : 'false';
      return 'Number($receiver.$method(${positionalArgs[0]}, $endian))';
    }
    if ((name == 'setInt64' || name == 'setUint64') &&
        positionalArgs.length >= 2 &&
        positionalArgs.length <= 3) {
      final method = name == 'setInt64' ? 'setBigInt64' : 'setBigUint64';
      final endian = positionalArgs.length == 3 ? positionalArgs[2] : 'false';
      return '($receiver.$method(${positionalArgs[0]}, BigInt(${positionalArgs[1]}), $endian), null)';
    }
    return null;
  }

  String? _emitTypedDataInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
  ) {
    if (!isDartTypedDataMember(target, name)) {
      return null;
    }
    if (name == 'setAll' && positionalArgs.length == 2) {
      return '($receiver.set(Array.from(${positionalArgs[1]}), ${positionalArgs[0]}), null)';
    }
    if (name == 'setRange' &&
        positionalArgs.length >= 3 &&
        positionalArgs.length <= 4) {
      helpers.add('__dartListSetRange');
      final skipCount = positionalArgs.length == 4 ? positionalArgs[3] : '0';
      return '__dartListSetRange($receiver, ${positionalArgs[0]}, ${positionalArgs[1]}, ${positionalArgs[2]}, $skipCount)';
    }
    if (name == 'sublist' &&
        positionalArgs.isNotEmpty &&
        positionalArgs.length <= 2) {
      if (positionalArgs.length == 1) {
        return '$receiver.slice(${positionalArgs.single})';
      }
      return '$receiver.slice(${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    if (name == 'getRange' && positionalArgs.length == 2) {
      return '$receiver.slice(${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    if (name == 'fillRange' &&
        positionalArgs.length >= 2 &&
        positionalArgs.length <= 3) {
      final fillValue = positionalArgs.length == 3 ? positionalArgs[2] : '0';
      return '($receiver.fill($fillValue, ${positionalArgs[0]}, ${positionalArgs[1]}), null)';
    }
    if (name == 'asMap' && positionalArgs.isEmpty) {
      helpers.add('__dartListAsMap');
      return '__dartListAsMap($receiver)';
    }
    if (name == 'indexOf' &&
        positionalArgs.isNotEmpty &&
        positionalArgs.length <= 2) {
      if (positionalArgs.length == 1) {
        return '$receiver.indexOf(${positionalArgs.single})';
      }
      return '$receiver.indexOf(${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    if (name == 'lastIndexOf' &&
        positionalArgs.isNotEmpty &&
        positionalArgs.length <= 2) {
      if (positionalArgs.length == 1) {
        return '$receiver.lastIndexOf(${positionalArgs.single})';
      }
      return '$receiver.lastIndexOf(${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    return null;
  }

  String? _emitByteBufferViewInvocation(
    k.Reference target,
    String name,
    String receiver,
    List<String> positionalArgs,
  ) {
    if (!isDartTypedDataByteBufferMember(target, name)) {
      return null;
    }
    final constructor = switch (name) {
      'asByteData' => 'DataView',
      'asInt8List' => 'Int8Array',
      'asUint8List' => 'Uint8Array',
      'asUint8ClampedList' => 'Uint8ClampedArray',
      'asInt16List' => 'Int16Array',
      'asUint16List' => 'Uint16Array',
      'asInt32List' => 'Int32Array',
      'asUint32List' => 'Uint32Array',
      'asFloat32List' => 'Float32Array',
      'asFloat64List' => 'Float64Array',
      _ => null,
    };
    if (constructor == null || positionalArgs.length > 2) {
      return null;
    }
    return _emitTypedDataView(constructor, [receiver, ...positionalArgs]);
  }

  String _typedDataElementSizeExpression(String value) {
    return '($value instanceof DataView ? 1 : $value.BYTES_PER_ELEMENT)';
  }
}

String? dartTypedDataArrayConstructorName(String dartTypeName) {
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

int? dartTypedDataArrayBytesPerElement(String dartTypeName) {
  return switch (dartTypeName) {
    'Int8List' || 'Uint8List' || 'Uint8ClampedList' => 1,
    'Int16List' || 'Uint16List' => 2,
    'Int32List' || 'Uint32List' || 'Float32List' => 4,
    'Int64List' || 'Uint64List' || 'Float64List' => 8,
    _ => null,
  };
}

String? _emitBigIntTypedDataListArgument(k.Expression expression) {
  switch (expression) {
    case k.ListLiteral(:final expressions):
      final values = <String>[];
      for (final expression in expressions) {
        final value = _emitBigIntTypedDataListElement(expression);
        if (value == null) {
          return null;
        }
        values.add(value);
      }
      return '[${values.join(', ')}]';
    case k.ConstantExpression(:final constant):
      if (constant is! k.ListConstant) {
        return null;
      }
      final values = <String>[];
      for (final entry in constant.entries) {
        if (entry is! k.IntConstant) {
          return null;
        }
        values.add(_emitBigIntLiteral(entry.value.toString()));
      }
      return '[${values.join(', ')}]';
    default:
      return null;
  }
}

String? _emitBigIntTypedDataListElement(k.Expression expression) {
  return switch (expression) {
    k.IntLiteral(:final value) => _emitBigIntLiteral(value.toString()),
    k.ConstantExpression(:final constant) when constant is k.IntConstant =>
      _emitBigIntLiteral(constant.value.toString()),
    _ => null,
  };
}

String _emitBigIntLiteral(String decimal) {
  if (decimal.startsWith('-')) {
    return '(-${decimal.substring(1)}n)';
  }
  return '${decimal}n';
}

String? _emitTypedDataView(String constructor, List<String> positionalArgs) {
  if (positionalArgs.isEmpty || positionalArgs.length > 3) {
    return null;
  }
  final args = <String>[positionalArgs[0]];
  if (positionalArgs.length >= 2) {
    args.add(positionalArgs[1]);
  }
  if (positionalArgs.length >= 3 && positionalArgs[2] != 'null') {
    args.add(positionalArgs[2]);
  }
  return 'new $constructor(${args.join(', ')})';
}

String? _emitTypedDataSublistView(
  String constructor, {
  required int bytesPerElement,
  required List<String> positionalArgs,
}) {
  if (positionalArgs.isEmpty || positionalArgs.length > 3) {
    return null;
  }
  final start = positionalArgs.length >= 2 ? positionalArgs[1] : '0';
  final end = positionalArgs.length >= 3 ? positionalArgs[2] : 'null';
  return '__dartTypedDataSublistView(${positionalArgs[0]}, $start, $end, $constructor, $bytesPerElement)';
}
