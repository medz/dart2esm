import 'package:dart2esm/src/backend/runtime_helpers.dart';
import 'package:dart2esm/src/backend/sdk_instance_invocations.dart';
import 'package:kernel/kernel.dart' as k;
import 'package:test/test.dart';

void main() {
  test('emits number instance methods through helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkInstanceInvocationEmitter(helpers: helpers);

    expect(
      emitter.emitInvocation(
        _reference('dart:core::num::@methods::round'),
        'round',
        'value',
        const [],
        k.Arguments.empty(),
      ),
      '__dartRoundToInt(value)',
    );
    expect(
      emitter.emitInvocation(
        _reference('dart:core::int::@methods::modPow'),
        'modPow',
        'base',
        ['exp', 'mod'],
        k.Arguments.empty(),
      ),
      '__dartIntModPow(base, exp, mod)',
    );
    expect(
      helpers,
      containsAll(['__dartRoundToInt', '__dartCoreError', '__dartIntModPow']),
    );
  });

  test('emits BigInt instance methods as native BigInt operations', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkInstanceInvocationEmitter(helpers: helpers);

    expect(
      emitter.emitInvocation(
        _reference('dart:core::BigInt::@methods::remainder'),
        'remainder',
        'left',
        ['right'],
        k.Arguments.empty(),
      ),
      '(left % right)',
    );
    expect(helpers, isEmpty);
  });

  test('emits Duration operators through helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkInstanceInvocationEmitter(helpers: helpers);

    final output = emitter.emitInvocation(
      _reference('dart:core::Duration::@methods::*'),
      '*',
      'duration',
      ['factor'],
      k.Arguments.empty(),
    );

    expect(
      output,
      '__dartDuration({ microseconds: __dartRoundToInt(duration.inMicroseconds * factor) })',
    );
    expect(helpers, containsAll(['__dartDuration', '__dartRoundToInt']));
  });

  test('emits Comparable compareTo through helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkInstanceInvocationEmitter(helpers: helpers);

    final output = emitter.emitInvocation(
      _reference('dart:core::Comparable::@methods::compareTo'),
      'compareTo',
      'left',
      ['right'],
      k.Arguments.empty(),
    );

    expect(output, '__dartCompare(left, right)');
    expect(helpers, contains('__dartCompare'));
  });

  test('emits number instance getters', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkInstanceInvocationEmitter(helpers: helpers);

    expect(
      emitter.emitGet(
        _reference('dart:core::double::@getters::isNegative'),
        'isNegative',
        'value',
      ),
      '(Number(value) < 0 || Object.is(Number(value), -0))',
    );
    expect(helpers, isEmpty);
  });

  test('returns null for non-SDK instance members', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkInstanceInvocationEmitter(helpers: helpers);

    expect(
      emitter.emitInvocation(
        _reference('package:app/main.dart::Thing::@methods::round'),
        'round',
        'thing',
        const [],
        k.Arguments.empty(),
      ),
      isNull,
    );
    expect(
      emitter.emitGet(
        _reference('package:app/main.dart::Thing::@getters::isNegative'),
        'isNegative',
        'thing',
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

final class _FakeCanonicalName implements k.CanonicalName {
  _FakeCanonicalName(this.path);

  final String path;

  @override
  String toStringInternal() => path;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
