import 'package:dart2esm/src/backend/runtime_helpers.dart';
import 'package:dart2esm/src/backend/sdk_async_instances.dart';
import 'package:kernel/kernel.dart' as k;
import 'package:test/test.dart';

void main() {
  test('emits Stream map through helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    final output = emitter.emitInvocation(
      _reference('dart:async::Stream::@methods::map'),
      'map',
      'stream',
      ['convert'],
      k.Arguments.empty(),
      Object(),
    );

    expect(output, '__dartStreamMap(stream, convert)');
    expect(helpers, contains('__dartStreamMap'));
  });

  test('emits Stream asBroadcastStream named callbacks', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    final output = emitter.emitInvocation(
      _reference('dart:async::Stream::@methods::asBroadcastStream'),
      'asBroadcastStream',
      'stream',
      const [],
      k.Arguments(
        const [],
        named: [
          k.NamedExpression('onListen', k.StringLiteral('listen')),
          k.NamedExpression('onCancel', k.StringLiteral('cancel')),
        ],
      ),
      Object(),
    );

    expect(output, '__dartStreamAsBroadcastStream(stream, "listen", "cancel")');
    expect(helpers, contains('__dartStreamAsBroadcastStream'));
  });

  test('emits Stream cast with type-test callback', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    final output = emitter.emitInvocation(
      _reference('dart:async::Stream::@methods::cast'),
      'cast',
      'stream',
      const [],
      k.Arguments.empty()..types.add(const k.DynamicType()),
      Object(),
    );

    expect(
      output,
      '__dartStreamCast(stream, (value) => isDynamic(value), "DynamicType(dynamic)")',
    );
    expect(helpers, contains('__dartStreamCast'));
  });

  test('emits Future catchError with test callback', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    final output = emitter.emitInvocation(
      _reference('dart:async::Future::@methods::catchError'),
      'catchError',
      'future',
      ['handle'],
      k.Arguments(
        const [],
        named: [k.NamedExpression('test', k.StringLiteral('canHandle'))],
      ),
      Object(),
    );

    expect(
      output,
      'future.catch((error) => ("canHandle")(error) ? (handle)(error) : Promise.reject(error))',
    );
    expect(helpers, isEmpty);
  });

  test('emits async Stream getters through helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitGet(
        _reference('dart:async::Stream::@getters::first'),
        'first',
        'stream',
      ),
      '__dartStreamFirst(stream)',
    );
    expect(helpers, contains('__dartStreamFirst'));
  });

  test('emits Zone and converter instance helpers', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitInvocation(
        _reference('dart:async::Zone::@methods::scheduleMicrotask'),
        'scheduleMicrotask',
        'zone',
        ['task'],
        k.Arguments.empty(),
        Object(),
      ),
      'zone.scheduleMicrotask(task)',
    );
    expect(
      emitter.emitInvocation(
        _reference('dart:convert::Converter::@methods::bind'),
        'bind',
        'converter',
        ['stream'],
        k.Arguments.empty(),
        Object(),
      ),
      '__dartConverterBind(converter, stream)',
    );
    expect(
      helpers,
      containsAll([
        '__dartZone',
        '__dartScheduleMicrotask',
        '__dartConverterBind',
      ]),
    );
  });

  test('returns null for non-async instance members', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitInvocation(
        _reference('package:app/main.dart::Thing::@methods::map'),
        'map',
        'thing',
        ['convert'],
        k.Arguments.empty(),
        Object(),
      ),
      isNull,
    );
    expect(
      emitter.emitGet(
        _reference('package:app/main.dart::Thing::@getters::first'),
        'first',
        'thing',
      ),
      isNull,
    );
    expect(helpers, isEmpty);
  });
}

DartSdkAsyncInstanceEmitter _emitter(EsmRuntimeHelperUseSet helpers) {
  return DartSdkAsyncInstanceEmitter(
    helpers: helpers,
    namedArgument: _namedArgument,
    emitTypeTest: (operand, _type, _node) => 'isDynamic($operand)',
  );
}

String? _namedArgument(k.Arguments arguments, String name) {
  for (final argument in arguments.named) {
    if (argument.name == name) {
      return switch (argument.value) {
        k.BoolLiteral(:final value) => value.toString(),
        k.IntLiteral(:final value) => value.toString(),
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
