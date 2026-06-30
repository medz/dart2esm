import 'package:kernel/kernel.dart' as k;

import 'kernel_references.dart';

enum LegacyJsFactorySymbol {
  jsObject,
  jsObjectFromBrowserObject,
  jsObjectJsify,
  jsArray,
  jsArrayFrom,
  jsFunctionWithThis,
}

enum JsInteropStaticGetSymbol { globalThis, objectPrototype }

LegacyJsFactorySymbol? legacyJsFactorySymbol(k.Reference reference) {
  return switch (kernelReferencePath(reference)) {
    'dart:js::JsObject::@factories::' => LegacyJsFactorySymbol.jsObject,
    'dart:js::JsObject::@factories::fromBrowserObject' =>
      LegacyJsFactorySymbol.jsObjectFromBrowserObject,
    'dart:js::JsObject::@factories::jsify' =>
      LegacyJsFactorySymbol.jsObjectJsify,
    'dart:js::JsArray::@factories::' => LegacyJsFactorySymbol.jsArray,
    'dart:js::JsArray::@factories::from' => LegacyJsFactorySymbol.jsArrayFrom,
    'dart:js::JsFunction::@factories::withThis' =>
      LegacyJsFactorySymbol.jsFunctionWithThis,
    _ => null,
  };
}

JsInteropStaticGetSymbol? jsInteropStaticGetSymbol(k.Reference reference) {
  return switch (kernelReferencePath(reference)) {
    'dart:_js_helper::@getters::staticInteropGlobalContext' ||
    'dart:js_interop::@getters::globalContext' ||
    'dart:js_util::@getters::globalThis' ||
    'dart:js::@getters::context' => JsInteropStaticGetSymbol.globalThis,
    'dart:js_util::@getters::objectPrototype' =>
      JsInteropStaticGetSymbol.objectPrototype,
    _ => null,
  };
}

String? jsSymbolStaticGetterName(k.Reference reference) {
  const prefix = 'dart:js_interop::JSSymbol::@getters::';
  final path = kernelReferencePath(reference);
  if (!path.startsWith(prefix)) {
    return null;
  }
  return path.substring(prefix.length);
}
