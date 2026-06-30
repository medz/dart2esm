import 'package:dart2esm/src/backend/runtime_helpers.dart';
import 'package:dart2esm/src/backend/sdk_web_invocations.dart';
import 'package:kernel/kernel.dart' as k;
import 'package:test/test.dart';

void main() {
  test('emits HTML and SVG static factories', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitStaticInvocation(
        _staticInvocation(
          'dart:html::Element::@factories::tag',
          k.Arguments.empty(),
        ),
        ['"div"'],
      ),
      'globalThis.document.createElement("div")',
    );
    expect(
      emitter.emitStaticInvocation(
        _staticInvocation(
          'dart:html::CanvasElement::@factories::',
          k.Arguments(
            const [],
            named: [
              k.NamedExpression('width', k.IntLiteral(320)),
              k.NamedExpression('height', k.IntLiteral(200)),
            ],
          ),
        ),
        const [],
      ),
      '__dartCanvasElement(320, 200)',
    );
    expect(
      emitter.emitStaticInvocation(
        _staticInvocation(
          'dart:svg::SvgElement::@factories::tag',
          k.Arguments.empty(),
        ),
        ['"svg"'],
      ),
      'globalThis.document.createElementNS("http://www.w3.org/2000/svg", "svg")',
    );
    expect(helpers, contains('__dartCanvasElement'));
  });

  test('emits DOM text get set and null-aware property names', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitGet(
        _reference('dart:html::Node::@getters::text'),
        'text',
        'node',
      ),
      'node.textContent',
    );
    expect(
      emitter.emitSet(
        _reference('dart:svg::Node::@setters::text'),
        'text',
        'title',
        'value',
      ),
      'title.textContent = value',
    );
    expect(
      emitter.nullAwareInstancePropertyName(
        _reference('dart:html::Node::@getters::text'),
        'text',
      ),
      'textContent',
    );
    expect(helpers, isEmpty);
  });

  test('emits HTML canvas node and storage instance operations', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitInstanceInvocation(
        _reference('dart:html::CanvasElement::@methods::getContext3d'),
        'getContext3d',
        'canvas',
        const [],
        k.Arguments(
          const [],
          named: [k.NamedExpression('stencil', k.BoolLiteral(true))],
        ),
      ),
      '__dartCanvasGetContext3d(canvas, { alpha: true, depth: true, stencil: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: false })',
    );
    expect(
      emitter.emitInstanceInvocation(
        _reference('dart:html::Node::@methods::append'),
        'append',
        'parent',
        ['child'],
        k.Arguments.empty(),
      ),
      'parent.appendChild(child)',
    );
    expect(
      emitter.emitInstanceInvocation(
        _reference('dart:html::Storage::@methods::[]='),
        '[]=',
        'storage',
        ['"key"', '"value"'],
        k.Arguments.empty(),
      ),
      '(typeof storage.setItem === "function" ? (storage.setItem("key", "value"), null) : (storage["key"] = "value", null))',
    );
    expect(helpers, contains('__dartCanvasGetContext3d'));
  });

  test('emits WebAudio and IndexedDB operations', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitStaticInvocation(
        _staticInvocation(
          'dart:web_audio::AudioContext::@factories::',
          k.Arguments.empty(),
        ),
        const [],
      ),
      'new (globalThis.window?.AudioContext ?? globalThis.window?.webkitAudioContext ?? globalThis.AudioContext ?? globalThis.webkitAudioContext)()',
    );
    expect(
      emitter.emitInstanceInvocation(
        _reference('dart:web_audio::AudioNode::@methods::connectNode'),
        'connectNode',
        'source',
        ['destination'],
        k.Arguments.empty(),
      ),
      '(source.connect(destination, 0, 0), null)',
    );
    expect(
      emitter.emitStaticInvocation(
        _staticInvocation(
          'dart:indexed_db::KeyRange::@factories::only',
          k.Arguments.empty(),
        ),
        ['key'],
      ),
      '(globalThis.window?.IDBKeyRange ?? globalThis.IDBKeyRange).only(key)',
    );
    expect(
      emitter.emitInstanceInvocation(
        _reference('dart:indexed_db::IdbFactory::@methods::open'),
        'open',
        'factory',
        ['"db"'],
        k.Arguments(
          const [],
          named: [k.NamedExpression('version', k.IntLiteral(2))],
        ),
      ),
      '__dartIdbOpen(factory, "db", 2, null, null)',
    );
    expect(
      emitter.emitInstanceInvocation(
        _reference('dart:indexed_db::ObjectStore::@methods::put'),
        'put',
        'store',
        ['value', 'key'],
        k.Arguments.empty(),
      ),
      '__dartIdbStorePut(store, "put", value, key)',
    );
    expect(helpers, containsAll(['__dartIdbOpen', '__dartIdbStorePut']));
  });

  test('returns null for non-web members', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitStaticInvocation(
        _staticInvocation(
          'package:app/main.dart::Thing::@methods::open',
          k.Arguments.empty(),
        ),
        ['value'],
      ),
      isNull,
    );
    expect(
      emitter.emitInstanceInvocation(
        _reference('package:app/main.dart::Thing::@methods::append'),
        'append',
        'thing',
        ['value'],
        k.Arguments.empty(),
      ),
      isNull,
    );
    expect(
      emitter.emitGet(
        _reference('package:app/main.dart::Thing::@getters::text'),
        'text',
        'thing',
      ),
      isNull,
    );
    expect(helpers, isEmpty);
  });
}

DartSdkWebInvocationEmitter _emitter(EsmRuntimeHelperUseSet helpers) {
  return DartSdkWebInvocationEmitter(
    helpers: helpers,
    namedArgument: _namedArgument,
    hasOnlyNamedArguments: _hasOnlyNamedArguments,
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
