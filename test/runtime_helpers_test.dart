import 'package:dart2esm/src/backend/runtime_helpers.dart';
import 'package:test/test.dart';

void main() {
  test('resolves transitive helper dependencies', () {
    final helpers = resolveEsmRuntimeHelperDependencies({
      '__dartStreamTransform',
    });

    expect(
      helpers,
      containsAll([
        '__dartStreamTransform',
        '__dartStreamTransformerBind',
        '__dartConverterBind',
      ]),
    );
  });

  test('resolves convert helper dependencies', () {
    final helpers = resolveEsmRuntimeHelperDependencies({
      '__dartJsonUtf8Encoder',
      '__dartByteConversionSinkFrom',
    });

    expect(
      helpers,
      containsAll([
        '__dartJsonUtf8Encoder',
        '__dartJsonEncode',
        '__dartToJson',
        '__dartUtf8Encode',
        '__dartConverterStartChunked',
        '__dartConverterConvert',
        '__dartByteConversionSinkFrom',
        '__dartSinkAdd',
        '__dartSinkClose',
      ]),
    );
  });

  test('exposes registered helper source definitions', () {
    expect(esmRuntimeHelperSource('__dartPrint'), contains('__dartStr(value)'));
    expect(esmRuntimeHelperSource('__dartStr'), contains('function __dartStr'));
    expect(
      esmRuntimeHelperSource('__dartMapForEach'),
      contains('function __dartMapForEach'),
    );
    expect(
      esmRuntimeHelperSource('__dartStringBuffer'),
      contains('function __dartStringBuffer'),
    );
    expect(esmRuntimeHelperSource('__dartFinalizer'), contains('detachTokens'));
    expect(esmRuntimeHelperSource('__dartStreamMap'), isNull);
  });

  test('tracks helpers emitted by the legacy stream runtime block', () {
    expect(isEsmLegacyStreamRuntimeHelper('__dartStreamMap'), isTrue);
    expect(isEsmLegacyStreamRuntimeHelper('__dartStreamController'), isFalse);
  });

  test('runtime helper use set owns closure and registry lookups', () {
    final helpers = EsmRuntimeHelperUseSet({
      '__dartJsonUtf8Encoder',
      '__dartStreamMap',
    });

    expect(helpers, isNot(contains('__dartJsonEncode')));
    helpers.closeDependencies();

    expect(helpers, contains('__dartJsonEncode'));
    expect(helpers, contains('__dartUtf8Encode'));
    expect(helpers.usesLegacyStreamRuntime, isTrue);
    expect(
      helpers.registeredSource('__dartPrint'),
      contains('function __dartPrint'),
    );
    expect(helpers.registeredSource('__dartStreamMap'), isNull);
  });
}
