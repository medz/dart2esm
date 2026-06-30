import 'package:dart2esm/src/backend/runtime_helpers.dart';
import 'package:dart2esm/src/backend/sdk_collection_instances.dart';
import 'package:kernel/kernel.dart' as k;
import 'package:test/test.dart';

void main() {
  test('emits Iterable toSet through helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    final output = emitter.emitInvocation(
      _reference('dart:core::Iterable::@methods::toSet'),
      'toSet',
      'items',
      const [],
      k.Arguments.empty(),
      Object(),
      receiverCollectionKind: null,
    );

    expect(output, '__dartSetFrom(items)');
    expect(
      helpers,
      containsAll([
        '__dartSetFrom',
        '__dartSetAdd',
        '__dartIterableContains',
        '__dartEquals',
      ]),
    );
  });

  test('emits fixed List toList through backend callback', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    final output = emitter.emitInvocation(
      _reference('dart:core::Iterable::@methods::toList'),
      'toList',
      'items',
      const [],
      k.Arguments(
        const [],
        named: [k.NamedExpression('growable', k.BoolLiteral(false))],
      ),
      Object(),
      receiverCollectionKind: null,
    );

    expect(output, 'fixed(Array.from(items), false, true)');
    expect(helpers, isEmpty);
  });

  test('emits List and Queue mutations through native arrays', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitInvocation(
        _reference('dart:core::List::@methods::insert'),
        'insert',
        'items',
        ['index', 'value'],
        k.Arguments.empty(),
        Object(),
        receiverCollectionKind: null,
      ),
      '(items.splice(index, 0, value), null)',
    );
    expect(
      emitter.emitInvocation(
        _reference('dart:collection::Queue::@methods::addFirst'),
        'addFirst',
        'queue',
        ['value'],
        k.Arguments.empty(),
        Object(),
        receiverCollectionKind: null,
      ),
      '(queue.unshift(value), null)',
    );
    expect(helpers, isEmpty);
  });

  test('emits Set helpers and rejects named arguments', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitInvocation(
        _reference('dart:core::Set::@methods::add'),
        'add',
        'items',
        ['value'],
        k.Arguments.empty(),
        Object(),
        receiverCollectionKind: null,
      ),
      '__dartSetAdd(items, value)',
    );
    expect(
      emitter.emitInvocation(
        _reference('dart:core::Set::@methods::add'),
        'add',
        'items',
        ['value'],
        k.Arguments(
          const [],
          named: [k.NamedExpression('unexpected', k.BoolLiteral(true))],
        ),
        Object(),
        receiverCollectionKind: null,
      ),
      isNull,
    );
    expect(
      helpers,
      containsAll(['__dartSetAdd', '__dartIterableContains', '__dartEquals']),
    );
  });

  test('emits Map cast and update through helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    final cast = emitter.emitInvocation(
      _reference('dart:core::Map::@methods::cast'),
      'cast',
      'map',
      const [],
      k.Arguments.empty()
        ..types.add(const k.DynamicType())
        ..types.add(const k.DynamicType()),
      Object(),
      receiverCollectionKind: null,
    );
    final update = emitter.emitInvocation(
      _reference('dart:core::Map::@methods::update'),
      'update',
      'map',
      ['key', 'change'],
      k.Arguments(
        const [],
        named: [k.NamedExpression('ifAbsent', k.StringLiteral('missing'))],
      ),
      Object(),
      receiverCollectionKind: null,
    );

    expect(
      cast,
      'new Map(Array.from(map, ([key, value]) => [__dartAs(key, (key) => isDynamic(key), "DynamicType(dynamic)"), __dartAs(value, (value) => isDynamic(value), "DynamicType(dynamic)")]))',
    );
    expect(update, '__dartMapUpdate(map, key, change, "missing")');
    expect(
      helpers,
      containsAll([
        '__dartAs',
        '__dartMapUpdate',
        '__dartMapSet',
        '__dartMapKey',
        '__dartEquals',
      ]),
    );
  });

  test('emits collection getters and receiver-kind fallback', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitGet(
        _reference('dart:core::Iterable::@getters::first'),
        'first',
        'items',
        receiverCollectionKind: null,
      ),
      '__dartIterableFirst(items)',
    );
    expect(
      emitter.emitGet(
        _reference('package:app/main.dart::Local::@getters::length'),
        'length',
        'list',
        receiverCollectionKind: 'List',
      ),
      'list.length',
    );
    expect(
      emitter.emitGet(
        _reference('dart:core::Map::@getters::entries'),
        'entries',
        'map',
        receiverCollectionKind: null,
      ),
      'Array.from(map, ([key, value]) => ({ key, value }))',
    );
    expect(helpers, contains('__dartIterableFirst'));
  });

  test('returns null for non-collection members', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitInvocation(
        _reference('package:app/main.dart::Thing::@methods::toSet'),
        'toSet',
        'thing',
        const [],
        k.Arguments.empty(),
        Object(),
        receiverCollectionKind: null,
      ),
      isNull,
    );
    expect(
      emitter.emitGet(
        _reference('package:app/main.dart::Thing::@getters::entries'),
        'entries',
        'thing',
        receiverCollectionKind: null,
      ),
      isNull,
    );
    expect(helpers, isEmpty);
  });
}

DartSdkCollectionInstanceEmitter _emitter(EsmRuntimeHelperUseSet helpers) {
  return DartSdkCollectionInstanceEmitter(
    helpers: helpers,
    hasOnlyNamedArguments: _hasOnlyNamedArguments,
    namedArgument: _namedArgument,
    emitMaybeFixedList: (value, growable, {required defaultGrowable}) =>
        'fixed($value, $growable, $defaultGrowable)',
    emitTypeTest: (operand, _type, _node) => 'isDynamic($operand)',
  );
}

bool _hasOnlyNamedArguments(k.Arguments arguments, Set<String> names) {
  return arguments.named.every((argument) => names.contains(argument.name));
}

String? _namedArgument(k.Arguments arguments, String name) {
  for (final argument in arguments.named) {
    if (argument.name == name) {
      return switch (argument.value) {
        k.BoolLiteral(:final value) => value.toString(),
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
