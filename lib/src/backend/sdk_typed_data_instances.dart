import 'package:kernel/kernel.dart' as k;

import '../kernel/sdk_symbols.dart';
import 'runtime_helpers.dart';

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

  String _typedDataElementSizeExpression(String value) {
    return '($value instanceof DataView ? 1 : $value.BYTES_PER_ELEMENT)';
  }
}
