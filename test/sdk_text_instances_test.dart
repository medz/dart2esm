import 'package:dart2esm/src/backend/runtime_helpers.dart';
import 'package:dart2esm/src/backend/sdk_text_instances.dart';
import 'package:kernel/kernel.dart' as k;
import 'package:test/test.dart';

void main() {
  test('emits string literal pattern calls as native JS methods', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    final output = emitter.emitInvocation(
      _reference('dart:core::String::@methods::contains'),
      'contains',
      'text',
      ['"needle"', '2'],
      k.Arguments([k.StringLiteral('needle'), k.IntLiteral(2)]),
    );

    expect(output, 'text.includes("needle", 2)');
    expect(helpers, isEmpty);
  });

  test('emits non-string pattern calls through helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    final output = emitter.emitInvocation(
      _reference('dart:core::String::@methods::replaceFirst'),
      'replaceFirst',
      'text',
      ['pattern', '"next"'],
      k.Arguments([k.NullLiteral(), k.StringLiteral('next')]),
    );

    expect(output, '__dartStringReplaceFirstPattern(text, pattern, "next", 0)');
    expect(
      helpers,
      containsAll([
        '__dartStringPattern',
        '__dartStringReplaceFirst',
        '__dartStringReplaceFirstPattern',
      ]),
    );
  });

  test('emits splitMapJoin named callbacks through text helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    final output = emitter.emitInvocation(
      _reference('dart:core::String::@methods::splitMapJoin'),
      'splitMapJoin',
      'text',
      ['pattern'],
      k.Arguments(
        [k.NullLiteral()],
        named: [
          k.NamedExpression('onMatch', k.StringLiteral('match')),
          k.NamedExpression('onNonMatch', k.StringLiteral('nonMatch')),
        ],
      ),
    );

    expect(
      output,
      '__dartStringSplitMapJoin(text, pattern, "match", "nonMatch")',
    );
    expect(helpers, contains('__dartStringPattern'));
  });

  test('emits Uri instance calls through helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    final output = emitter.emitInvocation(
      _reference('dart:core::Uri::@methods::replace'),
      'replace',
      'uri',
      const [],
      k.Arguments(
        const [],
        named: [k.NamedExpression('path', k.StringLiteral('/next'))],
      ),
    );

    expect(output, '__dartUriReplace(uri, { path: "/next" })');
    expect(helpers, containsAll(['__dartUriParse', '__dartUriReplace']));
  });

  test('emits string instance getters', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitGet(
        _reference('dart:core::String::@getters::codeUnits'),
        'codeUnits',
        'text',
      ),
      'Array.from({ length: text.length }, (_, index) => text.charCodeAt(index))',
    );
    expect(helpers, isEmpty);
  });

  test('returns null for non-text instance members', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = _emitter(helpers);

    expect(
      emitter.emitInvocation(
        _reference('package:app/main.dart::Thing::@methods::contains'),
        'contains',
        'thing',
        ['value'],
        k.Arguments([k.NullLiteral()]),
      ),
      isNull,
    );
    expect(
      emitter.emitGet(
        _reference('package:app/main.dart::Thing::@getters::codeUnits'),
        'codeUnits',
        'thing',
      ),
      isNull,
    );
    expect(helpers, isEmpty);
  });
}

DartSdkTextInstanceEmitter _emitter(EsmRuntimeHelperUseSet helpers) {
  return DartSdkTextInstanceEmitter(
    helpers: helpers,
    isStringLiteralArgument: _isStringLiteralArgument,
    namedArgument: _namedArgument,
    emitUriReplaceOptions: _emitUriReplaceOptions,
  );
}

bool _isStringLiteralArgument(k.Arguments arguments, int index) {
  return index < arguments.positional.length &&
      arguments.positional[index] is k.StringLiteral;
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

String _emitUriReplaceOptions(k.Arguments arguments) {
  if (arguments.named.isEmpty) {
    return '{}';
  }
  return '{ ${arguments.named.map((argument) => '${argument.name}: ${_namedArgument(arguments, argument.name)}').join(', ')} }';
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
