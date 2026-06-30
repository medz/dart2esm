import 'package:dart2esm/src/kernel/sdk_symbols.dart';
import 'package:kernel/kernel.dart' as k;
import 'package:test/test.dart';

void main() {
  test('classifies legacy dart:js factory symbols', () {
    expect(
      legacyJsFactorySymbol(_reference('dart:js::JsObject::@factories::')),
      LegacyJsFactorySymbol.jsObject,
    );
    expect(
      legacyJsFactorySymbol(
        _reference('dart:js::JsObject::@factories::fromBrowserObject'),
      ),
      LegacyJsFactorySymbol.jsObjectFromBrowserObject,
    );
    expect(
      legacyJsFactorySymbol(
        _reference('dart:js::JsFunction::@factories::withThis'),
      ),
      LegacyJsFactorySymbol.jsFunctionWithThis,
    );
    expect(legacyJsFactorySymbol(_reference('dart:core::Object')), isNull);
  });

  test('classifies JS interop static getters', () {
    expect(
      jsInteropStaticGetSymbol(
        _reference('dart:js_util::@getters::globalThis'),
      ),
      JsInteropStaticGetSymbol.globalThis,
    );
    expect(
      jsInteropStaticGetSymbol(
        _reference('dart:js_util::@getters::objectPrototype'),
      ),
      JsInteropStaticGetSymbol.objectPrototype,
    );
    expect(jsInteropStaticGetSymbol(_reference('dart:core::Object')), isNull);
  });

  test('extracts JSSymbol getter names', () {
    expect(
      jsSymbolStaticGetterName(
        _reference('dart:js_interop::JSSymbol::@getters::iterator'),
      ),
      'iterator',
    );
    expect(jsSymbolStaticGetterName(_reference('dart:core::Object')), isNull);
  });
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
