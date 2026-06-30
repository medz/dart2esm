import 'package:dart2esm/src/backend/runtime_helpers.dart';
import 'package:dart2esm/src/backend/sdk_js_interop_invocations.dart';
import 'package:kernel/kernel.dart' as k;
import 'package:test/test.dart';

void main() {
  test('emits js_util property operations and operators', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitStaticInvocation(
        _staticInvocation(
          'dart:js_util::@methods::getProperty',
          k.Arguments.empty(),
        ),
        ['object', '"key"'],
      ),
      'object["key"]',
    );
    expect(
      emitter.emitStaticInvocation(
        _staticInvocation('dart:js_util::@methods::add', k.Arguments.empty()),
        ['left', 'right'],
      ),
      '(left + right)',
    );
    expect(
      emitter.emitStaticInvocation(
        _staticInvocation(
          'dart:js_util::@methods::instanceOfString',
          k.Arguments.empty(),
        ),
        ['value', '"Array"'],
      ),
      '__dartJsInstanceOfString(value, "Array")',
    );
    expect(helpers, contains('__dartJsInstanceOfString'));
  });

  test('emits modern JS interop constructors and conversions', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitStaticInvocation(
        _staticInvocation(
          'dart:js_interop::@methods::JSObject|constructor#',
          k.Arguments.empty(),
        ),
        const [],
      ),
      '({})',
    );
    expect(
      emitter.emitStaticInvocation(
        _staticInvocation(
          'dart:js_interop::@methods::importModule',
          k.Arguments.empty(),
        ),
        ['"pkg"'],
      ),
      'import("pkg")',
    );
    expect(
      emitter.emitStaticInvocation(
        _staticInvocation(
          'dart:js_interop::@methods::NullableObjectUtilExtension|isA',
          k.Arguments.empty()..types.add(const k.DynamicType()),
        ),
        ['value'],
      ),
      'isDynamic(value)',
    );
    expect(
      emitter.emitStaticInvocation(
        _staticInvocation(
          'dart:js_interop::@methods::JSNumberToNumber|get#toDartInt',
          k.Arguments.empty(),
        ),
        ['number'],
      ),
      '__dartJsNumberToDartInt(number)',
    );
    expect(helpers, contains('__dartJsNumberToDartInt'));
  });

  test('emits unsafe JS interop calls through helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitStaticInvocation(
        _staticInvocation(
          'dart:js_interop_unsafe::@methods::JSObjectUnsafeUtilExtension|callMethod',
          k.Arguments.empty(),
        ),
        ['object', '"method"', 'a', 'b'],
      ),
      '__dartJsCallMethodOptional(object, "method", [a, b])',
    );
    expect(
      emitter.emitStaticInvocation(
        _staticInvocation(
          'dart:js_interop_unsafe::@methods::JSFunctionUnsafeUtilExtension|callAsConstructor',
          k.Arguments.empty(),
        ),
        ['Constructor', 'arg'],
      ),
      '__dartJsConstructOptional(Constructor, [arg])',
    );
    expect(
      helpers,
      containsAll(['__dartJsCallMethodOptional', '__dartJsConstructOptional']),
    );
  });

  test('emits JS interop instance getters', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitInstanceGet(
        _reference('dart:js_interop::JSSymbol::@getters::description'),
        'description',
        'symbol',
      ),
      '(symbol.description ?? null)',
    );
    expect(
      emitter.emitInstanceGet(
        _reference('dart:js_interop::JSIterable::@getters::iterator'),
        'iterator',
        'iterable',
      ),
      'iterable[Symbol.iterator]()',
    );
    expect(
      emitter.emitInstanceGet(
        _reference('dart:js_interop::JSIteratorResult::@getters::isDone'),
        'isDone',
        'result',
      ),
      '(result.done === true)',
    );
    expect(helpers, isEmpty);
  });

  test('returns null for non-JS interop members', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitStaticInvocation(
        _staticInvocation(
          'package:app/main.dart::Thing::@methods::getProperty',
          k.Arguments.empty(),
        ),
        ['object', '"key"'],
      ),
      isNull,
    );
    expect(
      emitter.emitInstanceGet(
        _reference('package:app/main.dart::Thing::@getters::description'),
        'description',
        'thing',
      ),
      isNull,
    );
    expect(helpers, isEmpty);
  });
}

DartSdkJsInteropInvocationEmitter _emitter(EsmRuntimeHelperUseSet helpers) {
  return DartSdkJsInteropInvocationEmitter(
    helpers: helpers,
    emitTypeTest: (operand, _type, _node) => 'isDynamic($operand)',
  );
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
