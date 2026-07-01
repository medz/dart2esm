import 'package:dart2esm/src/foundation/names/js_names.dart';
import 'package:test/test.dart';

void main() {
  test('recognizes JS identifier names and binding names', () {
    expect(isJsIdentifierName(r'$value_1'), isTrue);
    expect(isJsIdentifierName('1value'), isFalse);
    expect(isJsBindingIdentifier('class'), isFalse);
    expect(isJsBindingIdentifier('value'), isTrue);
  });

  test('sanitizes Dart names into JS identifiers', () {
    expect(sanitizeJsIdentifier(''), 'v');
    expect(sanitizeJsIdentifier('1-value'), '_1_value');
    expect(sanitizeJsIdentifier('dart:name'), 'dart_name');
  });

  test('allocates unique global names around reserved and generated names', () {
    final allocator = JsNameAllocator(
      generatedGlobalNames: const {'__dartHelper'},
    );

    expect(allocator.freshGlobal('value'), 'value');
    expect(allocator.freshGlobal('value'), 'value_1');
    expect(allocator.freshGlobal('class'), 'class_1');
    expect(allocator.freshGlobal('__dartHelper'), '__dartHelper_1');
  });

  test('allocates scoped names without colliding with globals', () {
    final allocator = JsNameAllocator();

    expect(allocator.freshGlobal('top'), 'top');
    allocator.withFunctionScope(() {
      expect(allocator.freshLocal('top'), 'top_1');
      expect(allocator.freshLocal('local'), 'local');
      expect(allocator.freshLocal('local'), 'local_1');
    });
  });

  test('reserves declared local names in the active scope', () {
    final allocator = JsNameAllocator();

    allocator.withFunctionScope(() {
      allocator.reserveLocal('taken');
      expect(allocator.freshLocal('taken'), 'taken_1');
    });
  });
}
