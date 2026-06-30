import 'package:dart2esm/src/backend/runtime_helpers.dart';
import 'package:dart2esm/src/backend/sdk_constructor_invocations.dart';
import 'package:kernel/kernel.dart' as k;
import 'package:test/test.dart';

void main() {
  test('emits Duration constructor through helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    final output = emitter.emit(
      _constructor(
        'dart:core::Duration::@constructors::',
        named: [
          k.NamedExpression('seconds', k.IntLiteral(2)),
          k.NamedExpression('milliseconds', k.IntLiteral(3)),
        ],
      ),
      const [],
      '',
    );

    expect(
      output,
      '__dartDuration({ days: 0, hours: 0, minutes: 0, seconds: 2, milliseconds: 3, microseconds: 0 })',
    );
    expect(helpers, contains('__dartDuration'));
  });

  test('emits internal WhereTypeIterable constructor with type callback', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    final output = emitter.emit(
      _constructor(
        'dart:_internal::WhereTypeIterable::@constructors::',
        types: [const k.DynamicType()],
      ),
      ['items'],
      'items',
    );

    expect(output, 'Array.from(items).filter((value) => isDynamic(value))');
    expect(helpers, isEmpty);
  });

  test('emits stream subscription transformer constructors', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    final output = emitter.emit(
      _constructor(
        'dart:async::_StreamSubscriptionTransformer::@constructors::',
      ),
      ['onListen'],
      'onListen',
    );

    expect(
      output,
      'Object.freeze({ bind(stream) { return __dartBoundSubscriptionStream(stream, onListen); } })',
    );
    expect(helpers, contains('__dartBoundSubscriptionStream'));
  });

  test('emits dart:io exception constructors through helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    final output = emitter.emit(
      _constructor('dart:io::OSError::@constructors::'),
      ['"disk"', '5'],
      '"disk", 5',
    );

    expect(output, '__dartIoOSError("disk", 5)');
    expect(helpers, contains('__dartIoOSError'));
  });

  test('emits JS interop and math constructors as native ESM', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emit(
        _constructor('dart:js_interop::JSArray::@constructors::withLength'),
        ['3'],
        '3',
      ),
      'new Array(3)',
    );
    expect(
      emitter.emit(
        _constructor('dart:math::Rectangle::@constructors::'),
        ['x', 'y', 'width', 'height'],
        'x, y, width, height',
      ),
      '__dartRectangle(x, y, width, height)',
    );
    expect(helpers, contains('__dartRectangle'));
  });

  test('emits core error constructors through helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    final output = emitter.emit(
      _constructor('dart:core::StateError::@constructors::'),
      ['"bad"'],
      '"bad"',
    );

    expect(output, '__dartCoreError("StateError", "bad")');
    expect(helpers, contains('__dartCoreError'));
  });

  test('returns null for non-SDK constructors', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emit(
        _constructor('package:app/main.dart::Thing::@constructors::'),
        const [],
        '',
      ),
      isNull,
    );
    expect(helpers, isEmpty);
  });
}

DartSdkConstructorInvocationEmitter _emitter(EsmRuntimeHelperUseSet helpers) {
  return DartSdkConstructorInvocationEmitter(
    helpers: helpers,
    namedArgument: _namedArgument,
    emitTypeTest: (operand, _type, _node) => 'isDynamic($operand)',
  );
}

k.ConstructorInvocation _constructor(
  String path, {
  List<k.Expression> positional = const [],
  List<k.NamedExpression> named = const [],
  List<k.DartType> types = const [],
}) {
  final reference = k.Reference();
  reference.canonicalName = _FakeCanonicalName(path);
  return k.ConstructorInvocation.byReference(
    reference,
    k.Arguments(positional, named: named, types: types),
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

final class _FakeCanonicalName implements k.CanonicalName {
  _FakeCanonicalName(this.path);

  final String path;

  @override
  String toStringInternal() => path;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
