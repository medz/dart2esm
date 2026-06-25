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

  test('tracks helpers emitted by the legacy stream runtime block', () {
    expect(isEsmLegacyStreamRuntimeHelper('__dartStreamMap'), isTrue);
    expect(isEsmLegacyStreamRuntimeHelper('__dartStreamController'), isFalse);
  });
}
