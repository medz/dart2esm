import 'package:dart2esm/src/backend/runtime_helpers.dart';
import 'package:dart2esm/src/backend/sdk_instance_invocations.dart';
import 'package:kernel/kernel.dart' as k;
import 'package:test/test.dart';

void main() {
  test('emits Expando index operations', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkInstanceInvocationEmitter(helpers: helpers);

    expect(
      emitter.emitInvocation(
        _reference('dart:core::Expando::@methods::[]'),
        '[]',
        'expando',
        ['target'],
        k.Arguments.empty(),
      ),
      'expando.get(target)',
    );
    expect(
      emitter.emitInvocation(
        _reference('dart:core::Expando::@methods::[]='),
        '[]=',
        'expando',
        ['target', 'value'],
        k.Arguments.empty(),
      ),
      'expando.set(target, value)',
    );
    expect(helpers, isEmpty);
  });

  test('emits Finalizer attach and detach calls', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkInstanceInvocationEmitter(
      helpers: helpers,
      namedArgument: _namedArgument,
    );

    expect(
      emitter.emitInvocation(
        _reference('dart:core::Finalizer::@methods::attach'),
        'attach',
        'finalizer',
        ['target', 'token'],
        k.Arguments(
          const [],
          named: [k.NamedExpression('detach', k.StringLiteral('key'))],
        ),
      ),
      'finalizer.attach(target, token, { detach: "key" })',
    );
    expect(
      emitter.emitInvocation(
        _reference('dart:core::Finalizer::@methods::detach'),
        'detach',
        'finalizer',
        ['target'],
        k.Arguments.empty(),
      ),
      'finalizer.detach(target)',
    );
    expect(helpers, isEmpty);
  });

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

  test('emits Object toString through helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkInstanceInvocationEmitter(helpers: helpers);

    expect(
      emitter.emitInvocation(
        _reference('dart:core::Object::@methods::toString'),
        'toString',
        'value',
        const [],
        k.Arguments.empty(),
      ),
      '__dartObjectToString(value)',
    );
    expect(helpers, contains('__dartObjectToString'));
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

  test('emits core object and primitive instance getters', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkInstanceInvocationEmitter(helpers: helpers);

    expect(
      emitter.emitGet(
        _reference('dart:core::WeakReference::@getters::target'),
        'target',
        'reference',
      ),
      'reference.target',
    );
    expect(
      emitter.emitGet(
        _reference('dart:core::int::@getters::isEven'),
        'isEven',
        'value',
      ),
      '(Math.trunc(value) % 2 === 0)',
    );
    expect(
      emitter.emitGet(
        _reference('dart:core::Object::@getters::runtimeType'),
        'runtimeType',
        'value',
      ),
      '__dartRuntimeType(value)',
    );
    expect(
      emitter.emitGet(
        _reference('dart:core::BigInt::@getters::bitLength'),
        'bitLength',
        'big',
      ),
      '__dartBigIntBitLength(big)',
    );
    expect(
      helpers,
      containsAll(['__dartRuntimeType', '__dartType', '__dartBigIntBitLength']),
    );
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

String? _namedArgument(k.Arguments arguments, String name) {
  for (final argument in arguments.named) {
    if (argument.name == name) {
      return switch (argument.value) {
        k.StringLiteral(:final value) => '"$value"',
        _ => '<expr>',
      };
    }
  }
  return null;
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
