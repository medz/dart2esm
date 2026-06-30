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
      namedArgument: _namedArgument,
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
      namedArgument: _namedArgument,
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
      namedArgument: _namedArgument,
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

  test('emits internal BytesBuilder factory through helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkStaticInvocationEmitter(
      helpers: helpers,
      emitNamedArgument: _emitNamedArgument,
      namedArgument: _namedArgument,
    );

    final output = emitter.emit(
      _invocation(
        'dart:_internal::BytesBuilder::@factories::',
        named: [k.NamedExpression('copy', k.BoolLiteral(false))],
      ),
      const [],
      '',
    );

    expect(output, '__dartBytesBuilder(false)');
    expect(helpers, contains('__dartBytesBuilder'));
  });

  test('emits internal IterableElementError helpers', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkStaticInvocationEmitter(
      helpers: helpers,
      emitNamedArgument: _emitNamedArgument,
      namedArgument: _namedArgument,
    );

    final output = emitter.emit(
      _invocation('dart:_internal::IterableElementError::@methods::tooMany'),
      const [],
      '',
    );

    expect(output, '__dartCoreError("StateError", "Too many elements")');
    expect(helpers, contains('__dartCoreError'));
  });

  test('emits collection MapBase toString through helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkStaticInvocationEmitter(
      helpers: helpers,
      emitNamedArgument: _emitNamedArgument,
      namedArgument: _namedArgument,
    );

    final output = emitter.emit(
      _invocation('dart:collection::MapBase::@methods::mapToString'),
      ['map'],
      'map',
    );

    expect(
      output,
      '("{" + Array.from(map, ([key, value]) => __dartStr(key) + ": " + __dartStr(value)).join(", ") + "}")',
    );
    expect(helpers, contains('__dartStr'));
  });

  test('emits internal Sort range through helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkStaticInvocationEmitter(
      helpers: helpers,
      emitNamedArgument: _emitNamedArgument,
      namedArgument: _namedArgument,
    );

    final output = emitter.emit(
      _invocation('dart:_internal::Sort::@methods::sortRange'),
      ['list', 'start', 'end', 'compare'],
      'list, start, end, compare',
    );

    expect(output, '__dartListSortRange(list, start, end, compare)');
    expect(helpers, containsAll(['__dartCoreError', '__dartListSortRange']));
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
    k.BoolLiteral(:final value) => value.toString(),
    k.IntLiteral(:final value) => value.toString(),
    _ => '<expr>',
  };
  return '${argument.name}: $value';
}

String? _namedArgument(k.Arguments arguments, String name) {
  for (final argument in arguments.named) {
    if (argument.name == name) {
      return switch (argument.value) {
        k.BoolLiteral(:final value) => value.toString(),
        k.IntLiteral(:final value) => value.toString(),
        _ => '<expr>',
      };
    }
  }
  return null;
}

final class _FakeCanonicalName implements k.CanonicalName {
  _FakeCanonicalName(this.path);

  final String path;

  @override
  String toStringInternal() => path;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
