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

bool kernelPathHasMember(String path, String name) {
  return path.contains('::@methods::$name') ||
      path.contains('::@getters::$name') ||
      path.contains('::@setters::$name') ||
      path.endsWith('::$name');
}

bool isDartSdkLibraryClassMember(
  k.Reference reference,
  String libraryUri,
  String className,
  String name,
) {
  final path = kernelReferencePath(reference);
  return path.startsWith('$libraryUri::$className::') &&
      kernelPathHasMember(path, name);
}

bool isDartCoreMember(k.Reference reference, String className, String name) {
  final path = kernelReferencePath(reference);
  return path == 'dart:core::$className::@methods::$name' ||
      path == 'dart:core::$className::@getters::$name' ||
      path == 'dart:core::$className::@setters::$name' ||
      path == 'dart:core::$className::$name' ||
      path.endsWith('dart:core::$className::$name');
}

bool isDartCoreNumberMember(k.Reference reference, String name) {
  return isDartCoreMember(reference, 'num', name) ||
      isDartCoreMember(reference, 'int', name) ||
      isDartCoreMember(reference, 'double', name);
}

bool isDartCoreUriMember(k.Reference reference, String name) {
  final path = kernelReferencePath(reference);
  if (!kernelPathHasMember(path, name)) {
    return false;
  }
  return path.contains('::Uri::') || path.contains('::_Uri::');
}

bool isDartAsyncStreamMember(k.Reference reference, String name) {
  final path = kernelReferencePath(reference);
  return path == 'dart:async::Stream::@methods::$name' ||
      path == 'dart:async::Stream::@getters::$name' ||
      path == 'dart:async::Stream::$name';
}

bool isDartAsyncStreamTransformerMember(k.Reference reference, String name) {
  final path = kernelReferencePath(reference);
  return path == 'dart:async::StreamTransformer::@methods::$name' ||
      path == 'dart:async::StreamTransformer::@getters::$name' ||
      path == 'dart:async::StreamTransformer::$name';
}

bool isDartAsyncStreamConsumerMember(k.Reference reference, String name) {
  final path = kernelReferencePath(reference);
  if (!kernelPathHasMember(path, name)) {
    return false;
  }
  return path.startsWith('dart:async::StreamConsumer::') ||
      path.startsWith('dart:async::StreamSink::') ||
      path.startsWith('dart:async::StreamController::') ||
      path.contains('::StreamConsumer') ||
      path.contains('::StreamSink') ||
      path.contains('::StreamController');
}

bool isDartAsyncFutureMember(k.Reference reference, String name) {
  final path = kernelReferencePath(reference);
  return path == 'dart:async::Future::@methods::$name' ||
      path == 'dart:async::Future::@getters::$name' ||
      path == 'dart:async::Future::$name';
}

bool isDartAsyncZoneMember(k.Reference reference, String name) {
  final path = kernelReferencePath(reference);
  return kernelPathHasMember(path, name) &&
      path.startsWith('dart:async::Zone::');
}

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
