import 'package:dart2esm/src/backend/runtime_helpers.dart';
import 'package:dart2esm/src/backend/sdk_legacy_js_invocations.dart';
import 'package:kernel/kernel.dart' as k;
import 'package:test/test.dart';

void main() {
  test('emits legacy dart:js factories', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitFactory(_procedure('dart:js::JsObject::@factories::'), [
        'Constructor',
        'args',
      ]),
      'new Constructor(...Array.from(args ?? []))',
    );
    expect(
      emitter.emitFactory(_procedure('dart:js::JsObject::@factories::jsify'), [
        'value',
      ]),
      '__dartJsify(value)',
    );
    expect(
      emitter.emitFactory(_procedure('dart:js::JsArray::@factories::from'), [
        'items',
      ]),
      'Array.from(items)',
    );
    expect(helpers, contains('__dartJsify'));
  });

  test('emits legacy dynamic invocations for dart:js context receivers', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitDynamicInvocation(
        k.StaticGet.byReference(_reference('dart:js::@getters::context')),
        'callMethod',
        'context',
        ['"max"', 'args'],
        k.Arguments.empty(),
      ),
      'context["max"](...Array.from(args ?? []))',
    );
    expect(
      emitter.emitDynamicInvocation(
        k.StaticGet.byReference(_reference('dart:js::@getters::context')),
        'apply',
        'fn',
        ['args'],
        k.Arguments(
          const [],
          named: [k.NamedExpression('thisArg', k.StringLiteral('self'))],
        ),
      ),
      'fn.apply("self", Array.from(args))',
    );
    expect(helpers, isEmpty);
  });

  test('emits legacy JsObject and JsFunction instance invocations', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitInstanceInvocation(
        _reference('dart:js::JsObject::@methods::[]'),
        '[]',
        'object',
        ['"key"'],
        k.Arguments.empty(),
      ),
      'object["key"]',
    );
    expect(
      emitter.emitInstanceInvocation(
        _reference('dart:js::JsFunction::@methods::apply'),
        'apply',
        'fn',
        ['args'],
        k.Arguments(
          const [],
          named: [k.NamedExpression('thisArg', k.StringLiteral('self'))],
        ),
      ),
      'fn.apply("self", Array.from(args))',
    );
    expect(helpers, isEmpty);
  });

  test('emits legacy JsArray mutations as native array operations', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitInstanceInvocation(
        _reference('dart:js::JsArray::@methods::add'),
        'add',
        'array',
        ['value'],
        k.Arguments.empty(),
      ),
      '(array.push(value), null)',
    );
    expect(
      emitter.emitInstanceInvocation(
        _reference('dart:js::JsArray::@methods::setRange'),
        'setRange',
        'array',
        ['start', 'end', 'items', 'skip'],
        k.Arguments.empty(),
      ),
      '(array.splice(start, end - start, ...Array.from(items).slice(skip, skip + (end - start))), null)',
    );
    expect(helpers, isEmpty);
  });

  test('returns null for non legacy dart:js members', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitFactory(
        _procedure('package:app/main.dart::Thing::@factories::'),
        const [],
      ),
      isNull,
    );
    expect(
      emitter.emitDynamicInvocation(
        k.StaticGet.byReference(
          _reference('package:app/main.dart::@getters::context'),
        ),
        'callMethod',
        'context',
        ['"max"'],
        k.Arguments.empty(),
      ),
      isNull,
    );
    expect(
      emitter.emitInstanceInvocation(
        _reference('package:app/main.dart::Thing::@methods::[]'),
        '[]',
        'thing',
        ['key'],
        k.Arguments.empty(),
      ),
      isNull,
    );
    expect(helpers, isEmpty);
  });
}

DartSdkLegacyJsInvocationEmitter _emitter(EsmRuntimeHelperUseSet helpers) {
  return DartSdkLegacyJsInvocationEmitter(
    helpers: helpers,
    namedArgument: _namedArgument,
    hasOnlyNamedArguments: _hasOnlyNamedArguments,
  );
}

k.Procedure _procedure(String path) {
  final procedure = k.Procedure(
    k.Name('factory'),
    k.ProcedureKind.Factory,
    k.FunctionNode(k.Block([])),
    fileUri: Uri.parse('memory:legacy_js.dart'),
  );
  procedure.reference.canonicalName = _FakeCanonicalName(path);
  return procedure;
}

k.Reference _reference(String path) {
  final reference = k.Reference();
  reference.canonicalName = _FakeCanonicalName(path);
  return reference;
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

bool _hasOnlyNamedArguments(k.Arguments arguments, Set<String> names) {
  return arguments.named.every((argument) => names.contains(argument.name));
}

final class _FakeCanonicalName implements k.CanonicalName {
  _FakeCanonicalName(this.path);

  final String path;

  @override
  String toStringInternal() => path;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
