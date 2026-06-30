import 'dart:convert';

import 'package:kernel/kernel.dart' as k;

import '../kernel/kernel_references.dart';
import '../kernel/sdk_symbols.dart';
import 'runtime_helpers.dart';

final class DartSdkConstructorInvocationEmitter {
  DartSdkConstructorInvocationEmitter({
    required this.helpers,
    required this.namedArgument,
    required this.emitTypeTest,
  });

  final EsmRuntimeHelperUseSet helpers;
  final String? Function(k.Arguments arguments, String name) namedArgument;
  final String Function(String operand, k.DartType type, Object node)
  emitTypeTest;

  String? emit(
    k.ConstructorInvocation expression,
    List<String> positionalArgs,
    String args,
  ) {
    final reference = expression.targetReference;
    return _emitCoreConstructor(
          reference,
          expression.arguments,
          positionalArgs,
        ) ??
        _emitCompactHashSetConstructor(reference) ??
        _emitStreamIteratorConstructor(reference, args) ??
        _emitStreamTransformerConstructor(reference, positionalArgs) ??
        _emitIoConstructor(reference, positionalArgs) ??
        _emitInternalIterableConstructor(expression, positionalArgs) ??
        _emitAsyncErrorConstructor(reference, positionalArgs) ??
        _emitExpandoConstructor(reference, positionalArgs) ??
        _emitSymbolConstructor(reference, positionalArgs) ??
        _emitInvocationMirrorConstructor(expression, positionalArgs) ??
        _emitJsInteropConstructor(reference, positionalArgs) ??
        _emitQueueConstructor(reference) ??
        _emitEmptyIterableConstructor(reference) ??
        _emitPointConstructor(reference, positionalArgs) ??
        _emitRectangleConstructor(reference, positionalArgs) ??
        _emitCoreErrorConstructor(reference, positionalArgs);
  }

  String? _emitCoreConstructor(
    k.Reference reference,
    k.Arguments arguments,
    List<String> positionalArgs,
  ) {
    final path = kernelReferencePath(reference);
    if (path.startsWith('dart:core::Object::@constructors::') &&
        positionalArgs.isEmpty) {
      return '({})';
    }
    if (isDartCoreWeakReferenceConstructorReference(reference) &&
        positionalArgs.length == 1) {
      helpers.add('__dartWeakReference');
      return '__dartWeakReference(${positionalArgs.single})';
    }
    if (isDartCoreFinalizerConstructorReference(reference) &&
        positionalArgs.length == 1) {
      helpers.add('__dartFinalizer');
      return '__dartFinalizer(${positionalArgs.single})';
    }
    if (path.startsWith('dart:core::MapEntry::@constructors::') &&
        positionalArgs.length == 2) {
      return 'Object.freeze({ key: ${positionalArgs[0]}, value: ${positionalArgs[1]} })';
    }
    if (path.startsWith(
          'dart:collection::UnmodifiableListView::@constructors::',
        ) &&
        positionalArgs.length == 1) {
      helpers.add('__dartUnmodifiableListView');
      return '__dartUnmodifiableListView(${positionalArgs.single})';
    }
    if (path.startsWith(
          'dart:collection::UnmodifiableMapView::@constructors::',
        ) &&
        positionalArgs.length == 1) {
      helpers.add('__dartUnmodifiableMapView');
      return '__dartUnmodifiableMapView(${positionalArgs.single})';
    }
    if (path.startsWith('dart:collection::SplayTreeSet::@constructors::') &&
        positionalArgs.length <= 2) {
      helpers.add('__dartSplayTreeSet');
      final compare = positionalArgs.isEmpty ? 'null' : positionalArgs[0];
      final isValidKey = positionalArgs.length >= 2
          ? positionalArgs[1]
          : 'null';
      return '__dartSplayTreeSet($compare, $isValidKey)';
    }
    if (path.startsWith('dart:collection::SplayTreeMap::@constructors::') &&
        positionalArgs.length <= 2) {
      helpers.add('__dartSplayTreeMap');
      final compare = positionalArgs.isEmpty ? 'null' : positionalArgs[0];
      final isValidKey = positionalArgs.length >= 2
          ? positionalArgs[1]
          : 'null';
      return '__dartSplayTreeMap($compare, $isValidKey)';
    }
    if (path.startsWith('dart:async::_EmptyStream::@constructors::') &&
        positionalArgs.isEmpty) {
      helpers.add('__dartStreamFromIterable');
      return '__dartStreamFromIterable([], true)';
    }
    if (path.startsWith(
          'dart:async::_StreamHandlerTransformer::@constructors::',
        ) &&
        positionalArgs.length <= 3) {
      helpers.add('__dartStreamTransformerFromHandlers');
      final handleData = positionalArgs.isNotEmpty
          ? positionalArgs[0]
          : namedArgument(arguments, 'handleData');
      final handleError = positionalArgs.length >= 2
          ? positionalArgs[1]
          : namedArgument(arguments, 'handleError');
      final handleDone = positionalArgs.length >= 3
          ? positionalArgs[2]
          : namedArgument(arguments, 'handleDone');
      return '__dartStreamTransformerFromHandlers({ handleData: ${handleData ?? 'null'}, handleError: ${handleError ?? 'null'}, handleDone: ${handleDone ?? 'null'} })';
    }
    if (path.startsWith(
          'dart:async::_StreamBindTransformer::@constructors::',
        ) &&
        positionalArgs.length == 1) {
      helpers.add('__dartStreamTransformerFromBind');
      return '__dartStreamTransformerFromBind(${positionalArgs.single})';
    }
    if (path.startsWith('dart:convert::Utf8Codec::@constructors::') &&
        positionalArgs.isEmpty) {
      helpers.add('__dartUtf8Codec');
      final allowMalformed =
          namedArgument(arguments, 'allowMalformed') ??
          namedArgument(arguments, '_allowMalformed') ??
          'false';
      return '__dartUtf8Codec($allowMalformed)';
    }
    if (path.startsWith('dart:convert::AsciiCodec::@constructors::') &&
        positionalArgs.isEmpty) {
      helpers.add('__dartAsciiCodec');
      final allowInvalid =
          namedArgument(arguments, 'allowInvalid') ??
          namedArgument(arguments, '_allowInvalid') ??
          'false';
      return '__dartAsciiCodec($allowInvalid)';
    }
    if (path.startsWith('dart:convert::Latin1Codec::@constructors::') &&
        positionalArgs.isEmpty) {
      helpers.add('__dartLatin1Codec');
      final allowInvalid =
          namedArgument(arguments, 'allowInvalid') ??
          namedArgument(arguments, '_allowInvalid') ??
          'false';
      return '__dartLatin1Codec($allowInvalid)';
    }
    if (path.startsWith('dart:convert::JsonCodec::@constructors::')) {
      helpers.add('__dartJsonCodec');
      final name = path.split('::').last;
      if (name == 'withReviver' && positionalArgs.length == 1) {
        return '__dartJsonCodec(${positionalArgs.single}, null)';
      }
      if (positionalArgs.isEmpty) {
        final reviver =
            namedArgument(arguments, 'reviver') ??
            namedArgument(arguments, '_reviver') ??
            'null';
        final toEncodable =
            namedArgument(arguments, 'toEncodable') ??
            namedArgument(arguments, '_toEncodable') ??
            'null';
        return '__dartJsonCodec($reviver, $toEncodable)';
      }
      return null;
    }
    if (path.startsWith('dart:convert::JsonEncoder::@constructors::')) {
      helpers.add('__dartJsonEncoder');
      final name = path.split('::').last;
      if (name == 'withIndent' &&
          positionalArgs.isNotEmpty &&
          positionalArgs.length <= 2) {
        final toEncodable = positionalArgs.length == 2
            ? positionalArgs[1]
            : 'null';
        return '__dartJsonEncoder($toEncodable, ${positionalArgs[0]})';
      }
      if (positionalArgs.length <= 1) {
        final toEncodable = positionalArgs.isEmpty
            ? 'null'
            : positionalArgs.single;
        return '__dartJsonEncoder($toEncodable, null)';
      }
      return null;
    }
    if (path.startsWith('dart:convert::JsonUtf8Encoder::@constructors::') &&
        positionalArgs.length <= 3) {
      helpers.add('__dartJsonUtf8Encoder');
      final indent = positionalArgs.isNotEmpty ? positionalArgs[0] : 'null';
      final toEncodable = positionalArgs.length >= 2
          ? positionalArgs[1]
          : 'null';
      final bufferSize = positionalArgs.length >= 3
          ? positionalArgs[2]
          : 'null';
      return '__dartJsonUtf8Encoder($indent, $toEncodable, $bufferSize)';
    }
    if (path.startsWith('dart:convert::JsonDecoder::@constructors::') &&
        positionalArgs.length <= 1) {
      helpers.add('__dartJsonDecoder');
      final reviver = positionalArgs.isEmpty ? 'null' : positionalArgs.single;
      return '__dartJsonDecoder($reviver)';
    }
    if (path.startsWith('dart:convert::Utf8Encoder::@constructors::') &&
        positionalArgs.isEmpty) {
      helpers.add('__dartUtf8Encoder');
      return '__dartUtf8Encoder()';
    }
    if (path.startsWith('dart:convert::Utf8Decoder::@constructors::') &&
        positionalArgs.isEmpty) {
      helpers.add('__dartUtf8Decoder');
      final allowMalformed =
          namedArgument(arguments, 'allowMalformed') ??
          namedArgument(arguments, '_allowMalformed') ??
          'false';
      return '__dartUtf8Decoder($allowMalformed)';
    }
    if (path.startsWith('dart:convert::AsciiEncoder::@constructors::') &&
        positionalArgs.isEmpty) {
      helpers.add('__dartAsciiEncoder');
      return '__dartAsciiEncoder()';
    }
    if (path.startsWith('dart:convert::AsciiDecoder::@constructors::') &&
        positionalArgs.isEmpty) {
      helpers.add('__dartAsciiDecoder');
      final allowInvalid =
          namedArgument(arguments, 'allowInvalid') ??
          namedArgument(arguments, '_allowInvalid') ??
          'false';
      return '__dartAsciiDecoder($allowInvalid)';
    }
    if (path.startsWith('dart:convert::Latin1Encoder::@constructors::') &&
        positionalArgs.isEmpty) {
      helpers.add('__dartLatin1Encoder');
      return '__dartLatin1Encoder()';
    }
    if (path.startsWith('dart:convert::Latin1Decoder::@constructors::') &&
        positionalArgs.isEmpty) {
      helpers.add('__dartLatin1Decoder');
      final allowInvalid =
          namedArgument(arguments, 'allowInvalid') ??
          namedArgument(arguments, '_allowInvalid') ??
          'false';
      return '__dartLatin1Decoder($allowInvalid)';
    }
    if (path.startsWith('dart:convert::Base64Codec::@constructors::') &&
        positionalArgs.isEmpty) {
      helpers.add('__dartBase64Codec');
      final name = path.split('::').last;
      return '__dartBase64Codec(${name == 'urlSafe' ? 'true' : 'false'})';
    }
    if (path.startsWith('dart:convert::Base64Encoder::@constructors::') &&
        positionalArgs.isEmpty) {
      helpers.add('__dartBase64Encoder');
      final name = path.split('::').last;
      return '__dartBase64Encoder(${name == 'urlSafe' ? 'true' : 'false'})';
    }
    if (path.startsWith('dart:convert::Base64Decoder::@constructors::') &&
        positionalArgs.isEmpty) {
      helpers.add('__dartBase64Decoder');
      return '__dartBase64Decoder()';
    }
    if (path.startsWith('dart:convert::HtmlEscapeMode::@constructors::') &&
        positionalArgs.isEmpty) {
      helpers.add('__dartHtmlEscapeMode');
      final name = namedArgument(arguments, 'name') ?? '"custom"';
      final escapeLtGt = namedArgument(arguments, 'escapeLtGt') ?? 'false';
      final escapeQuot = namedArgument(arguments, 'escapeQuot') ?? 'false';
      final escapeApos = namedArgument(arguments, 'escapeApos') ?? 'false';
      final escapeSlash = namedArgument(arguments, 'escapeSlash') ?? 'false';
      return '__dartHtmlEscapeMode($name, $escapeLtGt, $escapeQuot, $escapeApos, $escapeSlash)';
    }
    if (path.startsWith('dart:convert::HtmlEscape::@constructors::') &&
        positionalArgs.length <= 1) {
      helpers.add('__dartHtmlEscape');
      final mode = positionalArgs.isEmpty ? 'null' : positionalArgs.single;
      return '__dartHtmlEscape($mode)';
    }
    if (path.startsWith('dart:convert::_ByteCallbackSink::@constructors::') &&
        positionalArgs.length == 1) {
      helpers.add('__dartByteConversionSink');
      return '__dartByteConversionSink(${positionalArgs.single})';
    }
    if (path.startsWith('dart:convert::_ByteAdapterSink::@constructors::') &&
        positionalArgs.length == 1) {
      helpers.add('__dartByteConversionSinkFrom');
      return '__dartByteConversionSinkFrom(${positionalArgs.single})';
    }
    if (path.startsWith('dart:convert::_SimpleCallbackSink::@constructors::') &&
        positionalArgs.length == 1) {
      helpers.add('__dartChunkedConversionSink');
      return '__dartChunkedConversionSink(${positionalArgs.single})';
    }
    if (path.startsWith('dart:convert::_StringCallbackSink::@constructors::') &&
        positionalArgs.length == 1) {
      helpers.add('__dartStringConversionSink');
      return '__dartStringConversionSink(${positionalArgs.single})';
    }
    if (path.startsWith('dart:convert::_StringAdapterSink::@constructors::') &&
        positionalArgs.length == 1) {
      helpers.add('__dartStringConversionSinkFrom');
      return '__dartStringConversionSinkFrom(${positionalArgs.single})';
    }
    if (path.startsWith(
          'dart:convert::_StringSinkConversionSink::@constructors::',
        ) &&
        positionalArgs.length == 1) {
      helpers.add('__dartStringConversionSinkFromStringSink');
      return '__dartStringConversionSinkFromStringSink(${positionalArgs.single})';
    }
    if (path.startsWith('dart:core::StringBuffer::@constructors::')) {
      if (positionalArgs.length > 1) {
        return null;
      }
      helpers.add('__dartStringBuffer');
      final initial = positionalArgs.isEmpty ? '""' : positionalArgs.single;
      return '__dartStringBuffer($initial)';
    }
    if (path.startsWith('dart:core::Runes::@constructors::') &&
        positionalArgs.length == 1) {
      return 'Array.from(String(${positionalArgs.single}), (char) => char.codePointAt(0))';
    }
    if (path.startsWith('dart:core::Duration::@constructors::')) {
      if (positionalArgs.isNotEmpty) {
        return null;
      }
      helpers.add('__dartDuration');
      return '__dartDuration({ days: ${namedArgument(arguments, 'days') ?? '0'}, hours: ${namedArgument(arguments, 'hours') ?? '0'}, minutes: ${namedArgument(arguments, 'minutes') ?? '0'}, seconds: ${namedArgument(arguments, 'seconds') ?? '0'}, milliseconds: ${namedArgument(arguments, 'milliseconds') ?? '0'}, microseconds: ${namedArgument(arguments, 'microseconds') ?? '0'} })';
    }
    if (path.startsWith('dart:core::DateTime::@constructors::')) {
      helpers.add('__dartDateTime');
      final constructorName = path.split('::').last;
      if (constructorName == 'now' && positionalArgs.isEmpty) {
        return '__dartDateTime(Date.now(), false)';
      }
      if (constructorName == 'timestamp' && positionalArgs.isEmpty) {
        return '__dartDateTime(Date.now(), true)';
      }
      if (constructorName == 'fromMillisecondsSinceEpoch') {
        if (positionalArgs.length != 1) {
          return null;
        }
        final isUtc = namedArgument(arguments, 'isUtc') ?? 'false';
        return '__dartDateTime(${positionalArgs.single}, $isUtc)';
      }
      if (constructorName == 'fromMicrosecondsSinceEpoch') {
        if (positionalArgs.length != 1) {
          return null;
        }
        final isUtc = namedArgument(arguments, 'isUtc') ?? 'false';
        return '__dartDateTimeFromMicros(${positionalArgs.single}, $isUtc)';
      }
      final isUtc = constructorName == 'utc';
      final defaults = ['0', '1', '1', '0', '0', '0', '0', '0'];
      final values = <String>[
        for (var i = 0; i < defaults.length; i++)
          i < positionalArgs.length ? positionalArgs[i] : defaults[i],
      ];
      return '__dartDateTimeFromParts(${isUtc ? 'true' : 'false'}, ${values.join(', ')})';
    }
    if (path.startsWith('dart:core::Stopwatch::@constructors::') &&
        positionalArgs.isEmpty) {
      helpers.add('__dartDuration');
      helpers.add('__dartStopwatch');
      return '__dartStopwatch()';
    }
    return null;
  }

  String? _emitCompactHashSetConstructor(k.Reference reference) {
    if (isDartCompactHashSetConstructorReference(reference)) {
      return 'new Set()';
    }
    return null;
  }

  String? _emitStreamIteratorConstructor(k.Reference reference, String args) {
    if (isDartAsyncStreamIteratorConstructorReference(reference)) {
      helpers.add('__dartStreamIterator');
      return '__dartStreamIterator($args)';
    }
    return null;
  }

  String? _emitStreamTransformerConstructor(
    k.Reference reference,
    List<String> positionalArgs,
  ) {
    final path = kernelReferencePath(reference);
    if (path.startsWith(
          'dart:async::_StreamSubscriptionTransformer::@constructors::',
        ) &&
        positionalArgs.length == 1) {
      helpers.add('__dartBoundSubscriptionStream');
      return 'Object.freeze({ bind(stream) { return __dartBoundSubscriptionStream(stream, ${positionalArgs.single}); } })';
    }
    if (path.startsWith(
          'dart:async::_BoundSubscriptionStream::@constructors::',
        ) &&
        positionalArgs.length == 2) {
      helpers.add('__dartBoundSubscriptionStream');
      return '__dartBoundSubscriptionStream(${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    return null;
  }

  String? _emitIoConstructor(
    k.Reference reference,
    List<String> positionalArgs,
  ) {
    final path = kernelReferencePath(reference);
    if (path == 'dart:io::OSError::@constructors::' &&
        positionalArgs.length <= 2) {
      helpers.add('__dartIoOSError');
      final message = positionalArgs.isEmpty ? '""' : positionalArgs[0];
      final errorCode = positionalArgs.length < 2 ? '0' : positionalArgs[1];
      return '__dartIoOSError($message, $errorCode)';
    }
    if (path == 'dart:io::FileSystemException::@constructors::' &&
        positionalArgs.length <= 3) {
      helpers.add('__dartIoFileSystemException');
      final message = positionalArgs.isEmpty ? '""' : positionalArgs[0];
      final filePath = positionalArgs.length < 2 ? 'null' : positionalArgs[1];
      final osError = positionalArgs.length < 3 ? 'null' : positionalArgs[2];
      return '__dartIoFileSystemException($message, $filePath, $osError)';
    }
    return null;
  }

  String? _emitInternalIterableConstructor(
    k.ConstructorInvocation expression,
    List<String> positionalArgs,
  ) {
    final path = kernelReferencePath(expression.targetReference);
    if (isDartListIteratorConstructorReference(expression.targetReference) &&
        positionalArgs.length == 1) {
      helpers.add('__dartIterator');
      return '__dartIterator(${positionalArgs.single})';
    }
    if (isDartFollowedByIterableConstructorReference(
          expression.targetReference,
        ) &&
        positionalArgs.length == 2) {
      return 'Array.from(${positionalArgs[0]}).concat(Array.from(${positionalArgs[1]}))';
    }
    if (isDartMappedIterableConstructorPath(path) &&
        positionalArgs.length == 2) {
      return 'Array.from(${positionalArgs[0]}, (value) => ${positionalArgs[1]}(value))';
    }
    if (isDartWhereIterableConstructorPath(path) &&
        positionalArgs.length == 2) {
      return 'Array.from(${positionalArgs[0]}).filter((value) => ${positionalArgs[1]}(value))';
    }
    if (isDartExpandIterableConstructorPath(path) &&
        positionalArgs.length == 2) {
      return 'Array.from(${positionalArgs[0]}).flatMap((value) => Array.from(${positionalArgs[1]}(value)))';
    }
    if (isDartTakeIterableConstructorPath(path) && positionalArgs.length == 2) {
      return 'Array.from(${positionalArgs[0]}).slice(0, ${positionalArgs[1]})';
    }
    if (isDartSkipIterableConstructorPath(path) && positionalArgs.length == 2) {
      return 'Array.from(${positionalArgs[0]}).slice(${positionalArgs[1]})';
    }
    if (isDartSubListIterableConstructorPath(path) &&
        positionalArgs.length == 3) {
      return 'Array.from(${positionalArgs[0]}).slice(${positionalArgs[1]}, ${positionalArgs[2]} ?? undefined)';
    }
    if (isDartTakeWhileIterableConstructorPath(path) &&
        positionalArgs.length == 2) {
      helpers.add('__dartIterableTakeWhile');
      return '__dartIterableTakeWhile(${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    if (isDartSkipWhileIterableConstructorPath(path) &&
        positionalArgs.length == 2) {
      helpers.add('__dartIterableSkipWhile');
      return '__dartIterableSkipWhile(${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    if (isDartWhereTypeIterableConstructorPath(path) &&
        positionalArgs.length == 1 &&
        expression.arguments.types.length == 1) {
      final typeTest = emitTypeTest(
        'value',
        expression.arguments.types.single,
        expression,
      );
      return 'Array.from(${positionalArgs.single}).filter((value) => $typeTest)';
    }
    if (isDartNonNullsIterableConstructorPath(path) &&
        positionalArgs.length == 1) {
      return 'Array.from(${positionalArgs.single}).filter((value) => value != null)';
    }
    if (isDartIndexedIterableConstructorPath(path) &&
        positionalArgs.length == 2) {
      helpers.add('__dartRecord');
      return 'Array.from(${positionalArgs[0]}, (value, index) => __dartRecord([index + ${positionalArgs[1]}, value], {}))';
    }
    if (isDartListMapViewConstructorPath(path) && positionalArgs.length == 1) {
      return 'new Map(Array.from(${positionalArgs.single}, (value, index) => [index, value]))';
    }
    if (path.startsWith(
          'dart:collection::_MapBaseValueIterable::@constructors::',
        ) &&
        positionalArgs.length == 1) {
      helpers.add('__dartMapBaseValues');
      helpers.add('__dartMapGet');
      helpers.add('__dartMapKey');
      helpers.add('__dartEquals');
      return '__dartMapBaseValues(${positionalArgs.single})';
    }
    if (isDartListIndicesIterableConstructorPath(path) &&
        positionalArgs.length == 1) {
      return 'Array.from(${positionalArgs.single}, (_value, index) => index)';
    }
    if (isDartReversedListIterableConstructorPath(path) &&
        positionalArgs.length == 1) {
      return 'Array.from(${positionalArgs.single}).reverse()';
    }
    return null;
  }

  String? _emitAsyncErrorConstructor(
    k.Reference reference,
    List<String> positionalArgs,
  ) {
    if (kernelReferencePath(reference) ==
            'dart:async::AsyncError::@constructors::' &&
        positionalArgs.length == 2) {
      helpers.add('__dartAsyncError');
      return '__dartAsyncError(${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    return null;
  }

  String? _emitExpandoConstructor(
    k.Reference reference,
    List<String> positionalArgs,
  ) {
    if (isDartCoreExpandoConstructorReference(reference) &&
        positionalArgs.length <= 1) {
      helpers.add('__dartExpando');
      final name = positionalArgs.isEmpty ? 'null' : positionalArgs.single;
      return '__dartExpando($name)';
    }
    return null;
  }

  String? _emitSymbolConstructor(
    k.Reference reference,
    List<String> positionalArgs,
  ) {
    if (isDartInternalSymbolConstructorReference(reference) &&
        positionalArgs.length == 1) {
      helpers.add('__dartSymbol');
      return '__dartSymbol(${positionalArgs.single}, ${positionalArgs.single})';
    }
    return null;
  }

  String? _emitInvocationMirrorConstructor(
    k.ConstructorInvocation expression,
    List<String> positionalArgs,
  ) {
    final path = kernelReferencePath(expression.targetReference);
    if (path ==
            'dart:core::_InvocationMirror::@constructors::dart:core::_withType' &&
        positionalArgs.length == 5) {
      helpers.add('__dartInvocation');
      helpers.add('__dartSymbol');
      return '__dartInvocation("method", ${positionalArgs[0]}, ${positionalArgs[3]}, ${positionalArgs[4]})';
    }
    if (path ==
            'dart:core::_InvocationMirror::@constructors::dart:core::_withoutType' &&
        positionalArgs.length >= 4) {
      helpers.add('__dartInvocation');
      helpers.add('__dartSymbol');
      return '__dartInvocation("method", ${positionalArgs[0]}, ${positionalArgs[2]}, ${positionalArgs[3]})';
    }
    return null;
  }

  String? _emitJsInteropConstructor(
    k.Reference reference,
    List<String> positionalArgs,
  ) {
    final path = kernelReferencePath(reference);
    if (path == 'dart:js_interop::JSObject::@constructors::' &&
        positionalArgs.isEmpty) {
      return '({})';
    }
    if (path == 'dart:js_interop::JSArray::@constructors::' &&
        positionalArgs.isEmpty) {
      return '[]';
    }
    if (path == 'dart:js_interop::JSArray::@constructors::withLength' &&
        positionalArgs.length == 1) {
      return 'new Array(${positionalArgs.single})';
    }
    return null;
  }

  String? _emitQueueConstructor(k.Reference reference) {
    if (isDartCollectionQueueConstructorReference(reference)) {
      return '[]';
    }
    return null;
  }

  String? _emitEmptyIterableConstructor(k.Reference reference) {
    if (isDartEmptyIterableConstructorReference(reference)) {
      return '[]';
    }
    return null;
  }

  String? _emitPointConstructor(
    k.Reference reference,
    List<String> positionalArgs,
  ) {
    if (isDartMathPointConstructorReference(reference) &&
        positionalArgs.length == 2) {
      helpers.add('__dartPoint');
      return '__dartPoint(${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    return null;
  }

  String? _emitRectangleConstructor(
    k.Reference reference,
    List<String> positionalArgs,
  ) {
    final path = kernelReferencePath(reference);
    if (!path.startsWith('dart:math::Rectangle::@constructors::')) {
      return null;
    }
    if (path.endsWith('::fromPoints') && positionalArgs.length == 2) {
      helpers.add('__dartRectangle');
      return '__dartRectangleFromPoints(${positionalArgs[0]}, ${positionalArgs[1]})';
    }
    if (positionalArgs.length == 4) {
      helpers.add('__dartRectangle');
      return '__dartRectangle(${positionalArgs[0]}, ${positionalArgs[1]}, ${positionalArgs[2]}, ${positionalArgs[3]})';
    }
    return null;
  }

  String? _emitCoreErrorConstructor(
    k.Reference reference,
    List<String> positionalArgs,
  ) {
    final coreErrorName = dartCoreErrorConstructorName(reference);
    if (coreErrorName == null) {
      return null;
    }
    helpers.add('__dartCoreError');
    final message = positionalArgs.isEmpty ? 'null' : positionalArgs.first;
    return '__dartCoreError(${jsonEncode(coreErrorName)}, $message)';
  }
}
