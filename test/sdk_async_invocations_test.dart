import 'package:dart2esm/src/backend/runtime_helpers.dart';
import 'package:dart2esm/src/backend/sdk_async_invocations.dart';
import 'package:kernel/kernel.dart' as k;
import 'package:test/test.dart';

void main() {
  test('emits Future static helpers with named options', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    final output = emitter.emitStaticInvocation(
      _staticInvocation(
        'dart:async::Future::@methods::wait',
        k.Arguments(
          const [],
          named: [
            k.NamedExpression('eagerError', k.BoolLiteral(true)),
            k.NamedExpression('cleanUp', k.StringLiteral('clean')),
          ],
        ),
      ),
      ['futures'],
    );

    expect(output, '__dartFutureWait(futures, true, "clean")');
    expect(helpers, contains('__dartFutureWait'));
  });

  test('emits async controller and stream factories', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitStaticInvocation(
        _staticInvocation(
          'dart:async::StreamController::@factories::broadcast',
          k.Arguments(
            const [],
            named: [
              k.NamedExpression('onListen', k.StringLiteral('listen')),
              k.NamedExpression('onCancel', k.StringLiteral('cancel')),
            ],
          ),
        ),
        const [],
      ),
      '__dartStreamController(true, { onListen: "listen", onPause: null, onResume: null, onCancel: "cancel" })',
    );
    expect(
      emitter.emitStaticInvocation(
        _staticInvocation(
          'dart:async::Stream::@factories::fromIterable',
          k.Arguments.empty(),
        ),
        ['items'],
      ),
      '__dartStreamFromIterable(items)',
    );
    expect(
      helpers,
      containsAll(['__dartStreamController', '__dartStreamFromIterable']),
    );
  });

  test('returns null for non-async static invocations', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitStaticInvocation(
        _staticInvocation(
          'package:app/main.dart::Thing::@methods::wait',
          k.Arguments.empty(),
        ),
        ['value'],
      ),
      isNull,
    );
    expect(helpers, isEmpty);
  });

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

DartSdkAsyncInvocationEmitter _emitter(EsmRuntimeHelperUseSet helpers) {
  return DartSdkAsyncInvocationEmitter(
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

k.StaticInvocation _staticInvocation(String path, k.Arguments arguments) {
  return k.StaticInvocation.byReference(_reference(path), arguments);
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
