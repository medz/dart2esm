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
    expect(esmRuntimeHelperSource('__dartStreamMap'), isNull);
  });

  test('tracks helpers emitted by the legacy stream runtime block', () {
    expect(isEsmLegacyStreamRuntimeHelper('__dartStreamMap'), isTrue);
    expect(isEsmLegacyStreamRuntimeHelper('__dartStreamController'), isFalse);
  });
}
