import 'package:dart2esm/src/backend/runtime_helpers.dart';
import 'package:dart2esm/src/backend/sdk_static_invocations.dart';
import 'package:kernel/kernel.dart' as k;
import 'package:test/test.dart';

void main() {
  test('emits core print through helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkStaticInvocationEmitter(
      helpers: helpers,
      emitNamedArgument: _emitNamedArgument,
    );

    final output = emitter.emit(_invocation('dart:core::@methods::print'), [
      'value',
    ], 'value');

    expect(output, '__dartPrint(value)');
    expect(helpers, containsAll(['__dartPrint', '__dartStr']));
  });

  test('emits DateTime copyWith named options', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkStaticInvocationEmitter(
      helpers: helpers,
      emitNamedArgument: _emitNamedArgument,
    );

    final output = emitter.emit(
      _invocation(
        'dart:core::@methods::DateTimeCopyWith|copyWith',
        named: [k.NamedExpression('year', k.IntLiteral(2026))],
      ),
      ['date'],
      'date',
    );

    expect(output, '__dartDateTimeCopyWith(date, { year: 2026 })');
    expect(helpers, contains('__dartDateTime'));
  });

  test('emits collection elementAtOrNull through helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkStaticInvocationEmitter(
      helpers: helpers,
      emitNamedArgument: _emitNamedArgument,
    );

    final output = emitter.emit(
      _invocation(
        'dart:collection::@methods::IterableExtensions|elementAtOrNull',
      ),
      ['items', 'index'],
      'items, index',
    );

    expect(output, '__dartIterableElementAtOrNull(items, index)');
    expect(helpers, contains('__dartIterableElementAtOrNull'));
  });
}

k.StaticInvocation _invocation(
  String path, {
  List<k.NamedExpression> named = const [],
}) {
  final reference = k.Reference();
  reference.canonicalName = _FakeCanonicalName(path);
  return k.StaticInvocation.byReference(
    reference,
    k.Arguments(const [], named: named),
  );
}

String _emitNamedArgument(k.NamedExpression argument) {
  final value = switch (argument.value) {
    k.IntLiteral(:final value) => value.toString(),
    _ => '<expr>',
  };
  return '${argument.name}: $value';
}

final class _FakeCanonicalName implements k.CanonicalName {
  _FakeCanonicalName(this.path);

  final String path;

  @override
  String toStringInternal() => path;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
