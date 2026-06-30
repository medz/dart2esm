import 'package:dart2esm/src/backend/runtime_helpers.dart';
import 'package:dart2esm/src/backend/sdk_static_gets.dart';
import 'package:kernel/kernel.dart' as k;
import 'package:test/test.dart';

void main() {
  test('emits async Zone static getters through helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkStaticGetEmitter(helpers: helpers);

    final output = emitter.emit(_staticGet('dart:async::Zone::@getters::root'));

    expect(output, '__dartRootZone');
    expect(helpers, contains('__dartZone'));
  });

  test('emits JS interop static getters as native globals', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkStaticGetEmitter(helpers: helpers);

    expect(
      emitter.emit(_staticGet('dart:js_util::@getters::globalThis')),
      'globalThis',
    );
    expect(
      emitter.emit(_staticGet('dart:js_interop::JSSymbol::@getters::iterator')),
      'Symbol.iterator',
    );
    expect(helpers, isEmpty);
  });

  test('emits core Uri base through helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkStaticGetEmitter(helpers: helpers);

    final output = emitter.emit(_staticGet('dart:core::Uri::@getters::base'));

    expect(
      output,
      '__dartUriParse((globalThis.location?.href ?? import.meta.url), false)',
    );
    expect(helpers, contains('__dartUriParse'));
  });

  test('emits convert codecs through helper runtime', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkStaticGetEmitter(helpers: helpers);

    final output = emitter.emit(_staticGet('dart:convert::@getters::utf8'));

    expect(output, '__dartUtf8Codec()');
    expect(helpers, contains('__dartUtf8Codec'));
  });

  test('emits typed data Endian static getters as native expressions', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkStaticGetEmitter(helpers: helpers);

    expect(
      emitter.emit(_staticGet('dart:typed_data::Endian::@getters::host')),
      '(new Uint8Array(new Uint16Array([1]).buffer)[0] === 1)',
    );
    expect(helpers, isEmpty);
  });

  test('emits platform and developer static getters', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkStaticGetEmitter(helpers: helpers);

    expect(
      emitter.emit(_staticGet('dart:io::Platform::@getters::isLinux')),
      '(((globalThis.process?.platform === "win32") ? "windows" : (globalThis.process?.platform === "darwin") ? "macos" : (globalThis.process?.platform === "linux") ? "linux" : "browser") === "linux")',
    );
    expect(
      emitter.emit(_staticGet('dart:developer::UserTag::@getters::defaultTag')),
      '__dartDeveloperUserTag("Default")',
    );
    expect(helpers, contains('__dartDeveloperUserTag'));
  });

  test('returns null for non-SDK static getters', () {
    final helpers = EsmRuntimeHelperUseSet();
    final emitter = DartSdkStaticGetEmitter(helpers: helpers);

    expect(
      emitter.emit(_staticGet('package:app/main.dart::@getters::value')),
      isNull,
    );
    expect(helpers, isEmpty);
  });
}

k.StaticGet _staticGet(String path) {
  final reference = k.Reference();
  reference.canonicalName = _FakeCanonicalName(path);
  return k.StaticGet.byReference(reference);
}

final class _FakeCanonicalName implements k.CanonicalName {
  _FakeCanonicalName(this.path);

  final String path;

  @override
  String toStringInternal() => path;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
