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

  test('matches kernel member path segments', () {
    expect(
      kernelPathHasMember('dart:core::String::@methods::contains', 'contains'),
      isTrue,
    );
    expect(
      kernelPathHasMember('dart:core::Object::@getters::hashCode', 'hashCode'),
      isTrue,
    );
    expect(
      kernelPathHasMember(
        'dart:core::Object::@setters::debugName',
        'debugName',
      ),
      isTrue,
    );
    expect(
      kernelPathHasMember('dart:core::Object::@getters::hashCode', 'debugName'),
      isFalse,
    );
  });

  test('classifies sdk library class members', () {
    expect(
      isDartSdkLibraryClassMember(
        _reference('dart:html::Element::@getters::children'),
        'dart:html',
        'Element',
        'children',
      ),
      isTrue,
    );
    expect(
      isDartSdkLibraryClassMember(
        _reference('dart:html::Node::@getters::children'),
        'dart:html',
        'Element',
        'children',
      ),
      isFalse,
    );
  });

  test('classifies dart:core members', () {
    expect(
      isDartCoreMember(
        _reference('dart:core::String::@methods::contains'),
        'String',
        'contains',
      ),
      isTrue,
    );
    expect(
      isDartCoreNumberMember(
        _reference('dart:core::double::@methods::round'),
        'round',
      ),
      isTrue,
    );
    expect(
      isDartCoreUriMember(
        _reference('dart:core::_Uri::@getters::path'),
        'path',
      ),
      isTrue,
    );
    expect(
      isDartCoreUriMember(
        _reference('dart:async::Future::@getters::path'),
        'path',
      ),
      isFalse,
    );
  });

  test('classifies dart:async members', () {
    expect(
      isDartAsyncStreamMember(
        _reference('dart:async::Stream::@methods::listen'),
        'listen',
      ),
      isTrue,
    );
    expect(
      isDartAsyncStreamTransformerMember(
        _reference('dart:async::StreamTransformer::@methods::bind'),
        'bind',
      ),
      isTrue,
    );
    expect(
      isDartAsyncStreamConsumerMember(
        _reference('dart:async::StreamController::@getters::sink'),
        'sink',
      ),
      isTrue,
    );
    expect(
      isDartAsyncFutureMember(
        _reference('dart:async::Future::@methods::then'),
        'then',
      ),
      isTrue,
    );
    expect(
      isDartAsyncZoneMember(
        _reference('dart:async::Zone::@methods::run'),
        'run',
      ),
      isTrue,
    );
    expect(
      isDartAsyncZoneMember(
        _reference('dart:async::Future::@methods::run'),
        'run',
      ),
      isFalse,
    );
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
