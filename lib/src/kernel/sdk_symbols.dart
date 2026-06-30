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

bool isDartCoreWeakReferenceMember(k.Reference reference, String name) {
  final path = kernelReferencePath(reference);
  return (path.startsWith('dart:core::WeakReference::') ||
          path.startsWith('dart:core::_WeakReference::')) &&
      kernelPathHasMember(path, name);
}

bool isDartCoreFinalizerMember(k.Reference reference, String name) {
  final path = kernelReferencePath(reference);
  return (path.startsWith('dart:core::Finalizer::') ||
          path.startsWith('dart:core::_FinalizerImpl::')) &&
      kernelPathHasMember(path, name);
}

bool isDartCoreCollectionMember(k.Reference reference, String name) {
  final path = kernelReferencePath(reference);
  if (!path.startsWith('dart:core::') &&
      !path.startsWith('dart:_') &&
      !path.startsWith('dart:collection::') &&
      !path.startsWith('package:collection/')) {
    return false;
  }
  if (!kernelPathHasMember(path, name)) {
    return false;
  }
  return path.contains('::Iterable::') ||
      path.contains('::ListIterable::') ||
      path.contains('::List::') ||
      path.contains('::ListBase::') ||
      path.contains('::ListMixin::') ||
      path.contains('::_List::') ||
      path.contains('::_GrowableList::') ||
      path.contains('::Runes::') ||
      path.contains('::Set::') ||
      path.contains('::_Set::') ||
      path.contains('::Map::') ||
      path.contains('::_Map::') ||
      path.startsWith('dart:_compact_hash::') ||
      path.contains('::SplayTreeSet::') ||
      path.contains('::_SplayTreeSet::') ||
      path.contains('::SplayTreeMap::') ||
      path.contains('::_SplayTreeMap::') ||
      path.contains('::_SplayTree::') ||
      path.startsWith('dart:collection::Queue::') ||
      path.startsWith('dart:collection::ListQueue::') ||
      path.startsWith('dart:collection::DoubleLinkedQueue::');
}

bool isDartCoreListMember(k.Reference reference, String name) {
  final path = kernelReferencePath(reference);
  return isDartCoreMember(reference, 'List', name) ||
      path.contains('::ListBase::') ||
      path.contains('::ListMixin::') ||
      path.contains('::_List::') ||
      path.contains('::_GrowableList::');
}

bool isDartCoreSetMember(k.Reference reference, String name) {
  final path = kernelReferencePath(reference);
  return isDartCoreMember(reference, 'Set', name) ||
      path.contains('::_Set::') ||
      path.startsWith('dart:_compact_hash::') ||
      path.contains('::SplayTreeSet::') ||
      path.contains('::_SplayTreeSet::');
}

bool isDartCoreMapMember(k.Reference reference, String name) {
  final path = kernelReferencePath(reference);
  return isDartCoreMember(reference, 'Map', name) ||
      path.contains('::_Map::') ||
      path.contains('::SplayTreeMap::') ||
      path.contains('::_SplayTreeMap::');
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

bool isDartConvertStringConversionSinkMember(
  k.Reference reference,
  String name,
) {
  final path = kernelReferencePath(reference);
  final hasMember =
      path.contains('::@methods::$name') ||
      path.contains('::@getters::$name') ||
      path.endsWith('::$name');
  if (!hasMember) {
    return false;
  }
  return path.startsWith('dart:convert::StringConversionSink::') ||
      path.contains('::StringConversionSink') ||
      path.contains('::_StringAdapterSink') ||
      path.contains('::_StringCallbackSink') ||
      path.contains('::_StringSinkConversionSink');
}

bool isDartConvertConverterMember(k.Reference reference, String name) {
  final path = kernelReferencePath(reference);
  final hasMember =
      path.contains('::@methods::$name') ||
      path.contains('::@getters::$name') ||
      path.endsWith('::$name');
  if (!hasMember || !path.startsWith('dart:convert::')) {
    return false;
  }
  return path.contains('::Converter') ||
      path.contains('::Codec') ||
      path.contains('::Encoding') ||
      path.contains('::Utf8') ||
      path.contains('::Ascii') ||
      path.contains('::Latin1') ||
      path.contains('::Base64') ||
      path.contains('::Json') ||
      path.contains('::LineSplitter') ||
      path.contains('::HtmlEscape') ||
      path.contains('::_FusedConverter');
}

bool isDartConvertLineSplitterMember(k.Reference reference, String name) {
  final path = kernelReferencePath(reference);
  final hasMember =
      path.contains('::@methods::$name') ||
      path.contains('::@getters::$name') ||
      path.endsWith('::$name');
  return hasMember && path.contains('::LineSplitter');
}

bool isDartCollectionQueueMember(k.Reference reference, String name) {
  final path = kernelReferencePath(reference);
  final hasMember =
      path.contains('::@methods::$name') ||
      path.contains('::@getters::$name') ||
      path.endsWith('::$name');
  if (!hasMember) {
    return false;
  }
  return path.startsWith('dart:collection::Queue::') ||
      path.startsWith('dart:collection::ListQueue::') ||
      path.startsWith('dart:collection::DoubleLinkedQueue::');
}

bool isDartTypedDataMember(k.Reference reference, String name) {
  final path = kernelReferencePath(reference);
  return path.startsWith('dart:typed_data::') &&
      (path.contains('::@methods::$name') ||
          path.contains('::@getters::$name') ||
          path.endsWith('::$name'));
}

bool isDartTypedDataClassMember(
  k.Reference reference,
  String className,
  String name,
) {
  final path = kernelReferencePath(reference);
  return path.startsWith('dart:typed_data::$className::') &&
      (path.contains('::@methods::$name') ||
          path.contains('::@getters::$name') ||
          path.endsWith('::$name'));
}

bool isDartTypedDataByteBufferMember(k.Reference reference, String name) {
  final path = kernelReferencePath(reference);
  return path.startsWith('dart:typed_data::ByteBuffer::') &&
      (path.contains('::@methods::$name') || path.endsWith('::$name'));
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
