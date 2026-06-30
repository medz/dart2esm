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

enum DartSdkStaticInvocationSymbol {
  coreEnumName,
  coreEnumByName,
  coreEnumAsNameMap,
  coreDateTimeCopyWith,
  corePrint,
  coreIdentical,
  coreIdentityHashCode,
  coreFunctionApply,
  collectionNonNulls,
  collectionIndexed,
  collectionFirstOrNull,
  collectionLastOrNull,
  collectionSingleOrNull,
  collectionElementAtOrNull,
}

const dartCoreExceptionTypeNames = {
  'Exception',
  'FormatException',
  'ArgumentError',
  'RangeError',
  'IndexError',
  'StateError',
  'UnsupportedError',
  'UnimplementedError',
  'Error',
  'TypeError',
  'NoSuchMethodError',
  'ConcurrentModificationError',
};

const dartCoreErrorTypeNames = {
  'Exception',
  'FormatException',
  'ArgumentError',
  'RangeError',
  'IndexError',
  'StateError',
  'UnsupportedError',
  'UnimplementedError',
  'Error',
  'AssertionError',
  'ReachabilityError',
  'NoSuchMethodError',
  'ConcurrentModificationError',
  'TypeError',
};

bool kernelPathHasMember(String path, String name) {
  return path.contains('::@methods::$name') ||
      path.contains('::@getters::$name') ||
      path.contains('::@setters::$name') ||
      path.endsWith('::$name');
}

bool isDartCoreReference(k.Reference reference, String namespace, String name) {
  return kernelReferencePath(reference) == 'dart:core::$namespace::$name';
}

DartSdkStaticInvocationSymbol? dartSdkStaticInvocationSymbol(
  k.Reference reference,
) {
  return switch (kernelReferencePath(reference)) {
    'dart:core::@methods::EnumName|get#name' =>
      DartSdkStaticInvocationSymbol.coreEnumName,
    'dart:core::@methods::EnumByName|byName' =>
      DartSdkStaticInvocationSymbol.coreEnumByName,
    'dart:core::@methods::EnumByName|asNameMap' =>
      DartSdkStaticInvocationSymbol.coreEnumAsNameMap,
    'dart:core::@methods::DateTimeCopyWith|copyWith' =>
      DartSdkStaticInvocationSymbol.coreDateTimeCopyWith,
    'dart:core::@methods::print' => DartSdkStaticInvocationSymbol.corePrint,
    'dart:core::@methods::identical' =>
      DartSdkStaticInvocationSymbol.coreIdentical,
    'dart:core::@methods::identityHashCode' =>
      DartSdkStaticInvocationSymbol.coreIdentityHashCode,
    'dart:core::Function::@methods::apply' =>
      DartSdkStaticInvocationSymbol.coreFunctionApply,
    'dart:collection::@methods::NullableIterableExtensions|get#nonNulls' =>
      DartSdkStaticInvocationSymbol.collectionNonNulls,
    'dart:collection::@methods::IterableExtensions|get#indexed' =>
      DartSdkStaticInvocationSymbol.collectionIndexed,
    'dart:collection::@methods::IterableExtensions|get#firstOrNull' =>
      DartSdkStaticInvocationSymbol.collectionFirstOrNull,
    'dart:collection::@methods::IterableExtensions|get#lastOrNull' =>
      DartSdkStaticInvocationSymbol.collectionLastOrNull,
    'dart:collection::@methods::IterableExtensions|get#singleOrNull' =>
      DartSdkStaticInvocationSymbol.collectionSingleOrNull,
    'dart:collection::@methods::IterableExtensions|elementAtOrNull' =>
      DartSdkStaticInvocationSymbol.collectionElementAtOrNull,
    _ => null,
  };
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

bool isDartCoreGrowableListLiteral(k.Reference reference) {
  return kernelReferencePath(
    reference,
  ).startsWith('dart:core::_GrowableList::@factories::dart:core::_literal');
}

bool isDartCoreGrowableListFactory(k.Reference reference) {
  return kernelReferencePath(
    reference,
  ).startsWith('dart:core::_GrowableList::@factories::');
}

bool isDartCoreObjectConstructorReference(k.Reference reference) {
  return kernelReferencePath(
    reference,
  ).startsWith('dart:core::Object::@constructors::');
}

String? dartCoreExceptionReferenceName(k.Reference reference) {
  final path = kernelReferencePath(reference);
  for (final name in dartCoreExceptionTypeNames) {
    if (path == 'dart:core::$name') {
      return name;
    }
  }
  return null;
}

String? dartCoreExceptionConstructorTypeName(k.Reference reference) {
  final path = kernelReferencePath(reference);
  for (final name in dartCoreExceptionTypeNames) {
    if (path.startsWith('dart:core::$name::@constructors::')) {
      return name;
    }
  }
  return null;
}

String? dartCoreErrorConstructorName(k.Reference reference) {
  final path = kernelReferencePath(reference);
  if (path.startsWith('dart:_internal::ReachabilityError::@constructors::')) {
    return 'ReachabilityError';
  }
  for (final name in dartCoreErrorTypeNames) {
    if (path.startsWith('dart:core::$name::@constructors::')) {
      return name;
    }
  }
  return null;
}

String? dartCoreErrorFactoryName(k.Reference reference) {
  final path = kernelReferencePath(reference);
  for (final name in dartCoreErrorTypeNames) {
    if (path.startsWith('dart:core::$name::@factories::')) {
      return name;
    }
  }
  return null;
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

bool isDartCompactHashSetConstructorReference(k.Reference reference) {
  return kernelReferencePath(
    reference,
  ).startsWith('dart:_compact_hash::_Set::@constructors::');
}

bool isDartAsyncStreamIteratorConstructorReference(k.Reference reference) {
  return kernelReferencePath(
    reference,
  ).startsWith('dart:async::_StreamIterator::@constructors::');
}

bool isDartListIteratorConstructorReference(k.Reference reference) {
  final path = kernelReferencePath(reference);
  return path.startsWith('dart:_internal::ListIterator::@constructors::') ||
      path.startsWith('dart:collection::ListIterator::@constructors::');
}

bool isDartFollowedByIterableConstructorReference(k.Reference reference) {
  final path = kernelReferencePath(reference);
  return path.startsWith(
        'dart:_internal::FollowedByIterable::@constructors::',
      ) ||
      path.startsWith(
        'dart:_internal::EfficientLengthFollowedByIterable::@constructors::',
      );
}

bool isDartMappedIterableConstructorPath(String path) {
  return path.startsWith('dart:_internal::MappedIterable::@constructors::') ||
      path.startsWith(
        'dart:_internal::EfficientLengthMappedIterable::@constructors::',
      ) ||
      path.startsWith('dart:_internal::MappedListIterable::@constructors::');
}

bool isDartWhereIterableConstructorPath(String path) {
  return path.startsWith('dart:_internal::WhereIterable::@constructors::');
}

bool isDartExpandIterableConstructorPath(String path) {
  return path.startsWith('dart:_internal::ExpandIterable::@constructors::');
}

bool isDartTakeIterableConstructorPath(String path) {
  return path.startsWith('dart:_internal::TakeIterable::@constructors::') ||
      path.startsWith(
        'dart:_internal::EfficientLengthTakeIterable::@constructors::',
      );
}

bool isDartSkipIterableConstructorPath(String path) {
  return path.startsWith('dart:_internal::SkipIterable::@constructors::') ||
      path.startsWith(
        'dart:_internal::EfficientLengthSkipIterable::@constructors::',
      );
}

bool isDartSubListIterableConstructorPath(String path) {
  return path.startsWith('dart:_internal::SubListIterable::@constructors::');
}

bool isDartTakeWhileIterableConstructorPath(String path) {
  return path.startsWith('dart:_internal::TakeWhileIterable::@constructors::');
}

bool isDartSkipWhileIterableConstructorPath(String path) {
  return path.startsWith('dart:_internal::SkipWhileIterable::@constructors::');
}

bool isDartWhereTypeIterableConstructorPath(String path) {
  return path.startsWith('dart:_internal::WhereTypeIterable::@constructors::');
}

bool isDartNonNullsIterableConstructorPath(String path) {
  return path.startsWith('dart:_internal::NonNullsIterable::@constructors::');
}

bool isDartIndexedIterableConstructorPath(String path) {
  return path.startsWith('dart:_internal::IndexedIterable::@constructors::') ||
      path.startsWith(
        'dart:_internal::EfficientLengthIndexedIterable::@constructors::',
      );
}

bool isDartListMapViewConstructorPath(String path) {
  return path.startsWith('dart:_internal::ListMapView::@constructors::');
}

bool isDartListIndicesIterableConstructorPath(String path) {
  return path.startsWith(
    'dart:_internal::_ListIndicesIterable::@constructors::',
  );
}

bool isDartReversedListIterableConstructorPath(String path) {
  return path.startsWith(
    'dart:_internal::ReversedListIterable::@constructors::',
  );
}

bool isDartCoreExpandoConstructorReference(k.Reference reference) {
  return kernelReferencePath(
    reference,
  ).startsWith('dart:core::Expando::@constructors::');
}

bool isDartCoreWeakReferenceConstructorReference(k.Reference reference) {
  final path = kernelReferencePath(reference);
  return path.startsWith('dart:core::WeakReference::@constructors::') ||
      path.startsWith('dart:core::_WeakReference::@constructors::');
}

bool isDartCoreFinalizerConstructorReference(k.Reference reference) {
  final path = kernelReferencePath(reference);
  return path.startsWith('dart:core::Finalizer::@constructors::') ||
      path.startsWith('dart:core::_FinalizerImpl::@constructors::');
}

bool isDartInternalSymbolConstructorReference(k.Reference reference) {
  return kernelReferencePath(
    reference,
  ).startsWith('dart:_internal::Symbol::@constructors::');
}

bool isDartMathPointConstructorReference(k.Reference reference) {
  return kernelReferencePath(
    reference,
  ).startsWith('dart:math::Point::@constructors::');
}

bool isDartCollectionQueueConstructorReference(k.Reference reference) {
  final path = kernelReferencePath(reference);
  return path.startsWith('dart:collection::Queue::@constructors::') ||
      path.startsWith('dart:collection::ListQueue::@constructors::') ||
      path.startsWith('dart:collection::DoubleLinkedQueue::@constructors::');
}

bool isDartEmptyIterableConstructorReference(k.Reference reference) {
  return kernelReferencePath(
    reference,
  ).startsWith('dart:_internal::EmptyIterable::@constructors::');
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
