import 'package:dart2esm/src/backend/runtime_helpers.dart';
import 'package:dart2esm/src/backend/sdk_typed_data_invocations.dart';
import 'package:kernel/kernel.dart' as k;
import 'package:test/test.dart';

void main() {
  test('emits typed-data static factories through typed-data lowering', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkTypedDataStaticInvocationEmitter(helpers: helpers);

    expect(
      emitter.emitStaticInvocation(
        _staticInvocation('dart:typed_data::ByteData::@factories::'),
        ['4'],
      ),
      'new DataView(new ArrayBuffer(4))',
    );
    expect(
      emitter.emitStaticInvocation(
        _staticInvocation(
          'dart:typed_data::Uint8List::@factories::sublistView',
        ),
        ['bytes', '1', '3'],
      ),
      '__dartTypedDataSublistView(bytes, 1, 3, Uint8Array, 1)',
    );
    expect(helpers, contains('__dartTypedDataSublistView'));
  });

  test('emits BigInt typed-data list literals without widening codegen', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkTypedDataStaticInvocationEmitter(helpers: helpers);

    final output = emitter.emitStaticInvocation(
      _staticInvocation(
        'dart:typed_data::Int64List::@factories::fromList',
        positional: [
          k.ListLiteral([k.IntLiteral(1), k.IntLiteral(-2)]),
        ],
      ),
      ['values'],
    );

    expect(output, 'BigInt64Array.from([1n, (-2n)])');
    expect(helpers, isEmpty);
  });

  test('emits ByteData 64-bit accessors as native DataView operations', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkTypedDataInstanceEmitter(helpers: helpers);

    expect(
      emitter.emitInvocation(
        _reference('dart:typed_data::ByteData::@methods::getInt64'),
        'getInt64',
        'data',
        ['offset', 'true'],
        k.Arguments.empty(),
      ),
      'Number(data.getBigInt64(offset, true))',
    );
    expect(
      emitter.emitInvocation(
        _reference('dart:typed_data::ByteData::@methods::setUint64'),
        'setUint64',
        'data',
        ['offset', 'value'],
        k.Arguments.empty(),
      ),
      '(data.setBigUint64(offset, BigInt(value), false), null)',
    );
    expect(helpers, isEmpty);
  });

  test('emits typed-data list operations before collection fallback', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkTypedDataInstanceEmitter(helpers: helpers);

    expect(
      emitter.emitInvocation(
        _reference('dart:typed_data::Uint8List::@methods::setRange'),
        'setRange',
        'bytes',
        ['start', 'end', 'values', 'skip'],
        k.Arguments.empty(),
      ),
      '__dartListSetRange(bytes, start, end, values, skip)',
    );
    expect(
      emitter.emitInvocation(
        _reference('dart:typed_data::Uint8List::@methods::fillRange'),
        'fillRange',
        'bytes',
        ['start', 'end'],
        k.Arguments.empty(),
      ),
      '(bytes.fill(0, start, end), null)',
    );
    expect(helpers, contains('__dartListSetRange'));
  });

  test('emits typed-data ByteBuffer views', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkTypedDataInstanceEmitter(helpers: helpers);

    expect(
      emitter.emitInvocation(
        _reference('dart:typed_data::ByteBuffer::@methods::asUint8List'),
        'asUint8List',
        'buffer',
        ['offset', 'length'],
        k.Arguments.empty(),
      ),
      'new Uint8Array(buffer, offset, length)',
    );
    expect(
      emitter.emitInvocation(
        _reference('dart:typed_data::ByteBuffer::@methods::asByteData'),
        'asByteData',
        'buffer',
        ['offset', 'null'],
        k.Arguments.empty(),
      ),
      'new DataView(buffer, offset)',
    );
    expect(helpers, isEmpty);
  });

  test('emits typed-data getters', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkTypedDataInstanceEmitter(helpers: helpers);

    expect(
      emitter.emitGet(
        _reference('dart:typed_data::Uint8List::@getters::lengthInBytes'),
        'lengthInBytes',
        'bytes',
      ),
      'bytes.byteLength',
    );
    expect(
      emitter.emitGet(
        _reference('dart:typed_data::ByteData::@getters::elementSizeInBytes'),
        'elementSizeInBytes',
        'data',
      ),
      '(data instanceof DataView ? 1 : data.BYTES_PER_ELEMENT)',
    );
    expect(helpers, isEmpty);
  });

  test('exposes typed-array constructor metadata for type tests', () {
    expect(dartTypedDataArrayConstructorName('Uint8List'), 'Uint8Array');
    expect(dartTypedDataArrayConstructorName('Float64List'), 'Float64Array');
    expect(dartTypedDataArrayConstructorName('ByteData'), isNull);
    expect(dartTypedDataArrayBytesPerElement('Uint8ClampedList'), 1);
    expect(dartTypedDataArrayBytesPerElement('Float64List'), 8);
    expect(dartTypedDataArrayBytesPerElement('ByteData'), isNull);
  });

  test('returns null for non-typed-data static factories', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkTypedDataStaticInvocationEmitter(helpers: helpers);

    expect(
      emitter.emitStaticInvocation(
        _staticInvocation('dart:core::List::@factories::'),
        const [],
      ),
      isNull,
    );
    expect(helpers, isEmpty);
  });

  test('returns null for non-typed-data members or named arguments', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkTypedDataInstanceEmitter(helpers: helpers);

    expect(
      emitter.emitInvocation(
        _reference('package:app/main.dart::Bytes::@methods::setRange'),
        'setRange',
        'bytes',
        ['start', 'end', 'values'],
        k.Arguments.empty(),
      ),
      isNull,
    );
    expect(
      emitter.emitInvocation(
        _reference('dart:typed_data::Uint8List::@methods::setRange'),
        'setRange',
        'bytes',
        ['start', 'end', 'values'],
        k.Arguments(
          const [],
          named: [k.NamedExpression('unexpected', k.BoolLiteral(true))],
        ),
      ),
      isNull,
    );
    expect(
      emitter.emitGet(
        _reference('package:app/main.dart::Bytes::@getters::lengthInBytes'),
        'lengthInBytes',
        'bytes',
      ),
      isNull,
    );
    expect(helpers, isEmpty);
  });
}

k.Reference _reference(String path) {
  final reference = k.Reference();
  reference.canonicalName = _FakeCanonicalName(path);
  return reference;
}

k.StaticInvocation _staticInvocation(
  String path, {
  List<k.Expression> positional = const [],
}) {
  return k.StaticInvocation.byReference(
    _reference(path),
    k.Arguments(positional),
  );
}

final class _FakeCanonicalName implements k.CanonicalName {
  _FakeCanonicalName(this.path);

  final String path;

  @override
  String toStringInternal() => path;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
