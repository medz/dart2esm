enum EsmRuntimeHelperCategory {
  core,
  async,
  stream,
  convert,
  collection,
  jsInterop,
  sdk,
}

final class EsmRuntimeHelperSpec {
  const EsmRuntimeHelperSpec({
    required this.name,
    required this.category,
    this.dependencies = const [],
    this.description = '',
  });

  final String name;
  final EsmRuntimeHelperCategory category;
  final List<String> dependencies;
  final String description;
}

const _helperSpecs = <String, EsmRuntimeHelperSpec>{
  '__dartPrint': EsmRuntimeHelperSpec(
    name: '__dartPrint',
    category: EsmRuntimeHelperCategory.core,
    dependencies: ['__dartStr'],
    description: 'Dart print() sink backed by console.log.',
  ),
  '__dartScheduleMicrotask': EsmRuntimeHelperSpec(
    name: '__dartScheduleMicrotask',
    category: EsmRuntimeHelperCategory.async,
    dependencies: ['__dartZone'],
  ),
  '__dartFutureIterableWait': EsmRuntimeHelperSpec(
    name: '__dartFutureIterableWait',
    category: EsmRuntimeHelperCategory.async,
    dependencies: ['__dartAsyncError', '__dartFutureWaitAllSettled'],
  ),
  '__dartFutureRecordWait': EsmRuntimeHelperSpec(
    name: '__dartFutureRecordWait',
    category: EsmRuntimeHelperCategory.async,
    dependencies: [
      '__dartAsyncError',
      '__dartFutureWaitAllSettled',
      '__dartRecord',
    ],
  ),
  '__dartBoundSubscriptionStream': EsmRuntimeHelperSpec(
    name: '__dartBoundSubscriptionStream',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamController'],
  ),
  '__dartReceivePort': EsmRuntimeHelperSpec(
    name: '__dartReceivePort',
    category: EsmRuntimeHelperCategory.async,
    dependencies: [
      '__dartSendPort',
      '__dartStreamController',
      '__dartStreamListen',
    ],
  ),
  '__dartRawReceivePort': EsmRuntimeHelperSpec(
    name: '__dartRawReceivePort',
    category: EsmRuntimeHelperCategory.async,
    dependencies: ['__dartSendPort'],
  ),
  '__dartIsolateSpawn': EsmRuntimeHelperSpec(
    name: '__dartIsolateSpawn',
    category: EsmRuntimeHelperCategory.async,
    dependencies: ['__dartIsolate'],
  ),
  '__dartJsonCodec': EsmRuntimeHelperSpec(
    name: '__dartJsonCodec',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartJsonEncode',
      '__dartJsonDecode',
      '__dartJsonEncoder',
      '__dartJsonDecoder',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartJsonEncoder': EsmRuntimeHelperSpec(
    name: '__dartJsonEncoder',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartJsonEncode',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartJsonUtf8Encoder': EsmRuntimeHelperSpec(
    name: '__dartJsonUtf8Encoder',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartJsonEncode',
      '__dartUtf8Encode',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartJsonDecoder': EsmRuntimeHelperSpec(
    name: '__dartJsonDecoder',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartJsonDecode',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartJsonEncode': EsmRuntimeHelperSpec(
    name: '__dartJsonEncode',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: ['__dartToJson'],
  ),
  '__dartJsonDecode': EsmRuntimeHelperSpec(
    name: '__dartJsonDecode',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: ['__dartFromJson', '__dartJsonRevive'],
  ),
  '__dartToJson': EsmRuntimeHelperSpec(
    name: '__dartToJson',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartFromJson': EsmRuntimeHelperSpec(
    name: '__dartFromJson',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartJsonRevive': EsmRuntimeHelperSpec(
    name: '__dartJsonRevive',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartUtf8Codec': EsmRuntimeHelperSpec(
    name: '__dartUtf8Codec',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartUtf8Encode',
      '__dartUtf8Decode',
      '__dartUtf8Encoder',
      '__dartUtf8Decoder',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartUtf8Encoder': EsmRuntimeHelperSpec(
    name: '__dartUtf8Encoder',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartUtf8Encode',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartUtf8Decoder': EsmRuntimeHelperSpec(
    name: '__dartUtf8Decoder',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartUtf8Decode',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartUtf8Encode': EsmRuntimeHelperSpec(
    name: '__dartUtf8Encode',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartUtf8Decode': EsmRuntimeHelperSpec(
    name: '__dartUtf8Decode',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartAsciiCodec': EsmRuntimeHelperSpec(
    name: '__dartAsciiCodec',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartAsciiEncode',
      '__dartAsciiDecode',
      '__dartAsciiEncoder',
      '__dartAsciiDecoder',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartAsciiEncoder': EsmRuntimeHelperSpec(
    name: '__dartAsciiEncoder',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartAsciiEncode',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartAsciiDecoder': EsmRuntimeHelperSpec(
    name: '__dartAsciiDecoder',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartAsciiDecode',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartAsciiEncode': EsmRuntimeHelperSpec(
    name: '__dartAsciiEncode',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartAsciiDecode': EsmRuntimeHelperSpec(
    name: '__dartAsciiDecode',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartLatin1Codec': EsmRuntimeHelperSpec(
    name: '__dartLatin1Codec',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartLatin1Encode',
      '__dartLatin1Decode',
      '__dartLatin1Encoder',
      '__dartLatin1Decoder',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartLatin1Encoder': EsmRuntimeHelperSpec(
    name: '__dartLatin1Encoder',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartLatin1Encode',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartLatin1Decoder': EsmRuntimeHelperSpec(
    name: '__dartLatin1Decoder',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartLatin1Decode',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartLatin1Encode': EsmRuntimeHelperSpec(
    name: '__dartLatin1Encode',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartLatin1Decode': EsmRuntimeHelperSpec(
    name: '__dartLatin1Decode',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartBase64Codec': EsmRuntimeHelperSpec(
    name: '__dartBase64Codec',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartBase64Encode',
      '__dartBase64Decode',
      '__dartBase64Normalize',
      '__dartBase64Encoder',
      '__dartBase64Decoder',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartBase64Encoder': EsmRuntimeHelperSpec(
    name: '__dartBase64Encoder',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartBase64Encode',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartBase64Decoder': EsmRuntimeHelperSpec(
    name: '__dartBase64Decoder',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartBase64Decode',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartBase64Encode': EsmRuntimeHelperSpec(
    name: '__dartBase64Encode',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartBase64Decode': EsmRuntimeHelperSpec(
    name: '__dartBase64Decode',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartBase64Normalize': EsmRuntimeHelperSpec(
    name: '__dartBase64Normalize',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartLineSplitter': EsmRuntimeHelperSpec(
    name: '__dartLineSplitter',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartLineSplit',
      '__dartLineSplitterSink',
      '__dartLineSplitterBind',
    ],
  ),
  '__dartLineSplit': EsmRuntimeHelperSpec(
    name: '__dartLineSplit',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartLineSplitterSink': EsmRuntimeHelperSpec(
    name: '__dartLineSplitterSink',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartLineSplitterBind': EsmRuntimeHelperSpec(
    name: '__dartLineSplitterBind',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartHtmlEscape': EsmRuntimeHelperSpec(
    name: '__dartHtmlEscape',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartHtmlEscapeMode',
      '__dartHtmlEscapeChar',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartHtmlEscapeMode': EsmRuntimeHelperSpec(
    name: '__dartHtmlEscapeMode',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartHtmlEscapeChar': EsmRuntimeHelperSpec(
    name: '__dartHtmlEscapeChar',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartSinkAdd': EsmRuntimeHelperSpec(
    name: '__dartSinkAdd',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartSinkClose': EsmRuntimeHelperSpec(
    name: '__dartSinkClose',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartConverterConvert': EsmRuntimeHelperSpec(
    name: '__dartConverterConvert',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartConverterBind': EsmRuntimeHelperSpec(
    name: '__dartConverterBind',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: ['__dartConverterConvert'],
  ),
  '__dartConverterFuse': EsmRuntimeHelperSpec(
    name: '__dartConverterFuse',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartConverterConvert',
      '__dartConverterStartChunked',
      '__dartConverterBind',
    ],
  ),
  '__dartConverterStartChunked': EsmRuntimeHelperSpec(
    name: '__dartConverterStartChunked',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: ['__dartConverterConvert'],
  ),
  '__dartChunkedConversionSink': EsmRuntimeHelperSpec(
    name: '__dartChunkedConversionSink',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartByteConversionSink': EsmRuntimeHelperSpec(
    name: '__dartByteConversionSink',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartByteConversionSinkFrom': EsmRuntimeHelperSpec(
    name: '__dartByteConversionSinkFrom',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: ['__dartSinkAdd', '__dartSinkClose'],
  ),
  '__dartStringConversionSinkAsUtf8Sink': EsmRuntimeHelperSpec(
    name: '__dartStringConversionSinkAsUtf8Sink',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: ['__dartUtf8Decode'],
  ),
  '__dartStringConversionSink': EsmRuntimeHelperSpec(
    name: '__dartStringConversionSink',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: ['__dartStringConversionSinkAsUtf8Sink'],
  ),
  '__dartStringConversionSinkFrom': EsmRuntimeHelperSpec(
    name: '__dartStringConversionSinkFrom',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartSinkAdd',
      '__dartSinkClose',
      '__dartStringConversionSinkAsUtf8Sink',
    ],
  ),
  '__dartStringConversionSinkFromStringSink': EsmRuntimeHelperSpec(
    name: '__dartStringConversionSinkFromStringSink',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: ['__dartSinkAdd', '__dartStringConversionSinkAsUtf8Sink'],
  ),
  '__dartStreamFromFutures': EsmRuntimeHelperSpec(
    name: '__dartStreamFromFutures',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamController'],
  ),
  '__dartStreamFromIterable': EsmRuntimeHelperSpec(
    name: '__dartStreamFromIterable',
    category: EsmRuntimeHelperCategory.stream,
  ),
  '__dartStreamFromFuture': EsmRuntimeHelperSpec(
    name: '__dartStreamFromFuture',
    category: EsmRuntimeHelperCategory.stream,
  ),
  '__dartStreamMulti': EsmRuntimeHelperSpec(
    name: '__dartStreamMulti',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamController'],
  ),
  '__dartStreamError': EsmRuntimeHelperSpec(
    name: '__dartStreamError',
    category: EsmRuntimeHelperCategory.stream,
  ),
  '__dartStreamPeriodic': EsmRuntimeHelperSpec(
    name: '__dartStreamPeriodic',
    category: EsmRuntimeHelperCategory.stream,
  ),
  '__dartStreamAsBroadcastStream': EsmRuntimeHelperSpec(
    name: '__dartStreamAsBroadcastStream',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamController', '__dartStreamIterable'],
  ),
  '__dartStreamMap': EsmRuntimeHelperSpec(
    name: '__dartStreamMap',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamWhere': EsmRuntimeHelperSpec(
    name: '__dartStreamWhere',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamAsyncMap': EsmRuntimeHelperSpec(
    name: '__dartStreamAsyncMap',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamAsyncExpand': EsmRuntimeHelperSpec(
    name: '__dartStreamAsyncExpand',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamExpand': EsmRuntimeHelperSpec(
    name: '__dartStreamExpand',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamTransformerFromHandlers': EsmRuntimeHelperSpec(
    name: '__dartStreamTransformerFromHandlers',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamController', '__dartStreamIterable'],
  ),
  '__dartStreamTransformerFromBind': EsmRuntimeHelperSpec(
    name: '__dartStreamTransformerFromBind',
    category: EsmRuntimeHelperCategory.stream,
  ),
  '__dartStreamTransformerBind': EsmRuntimeHelperSpec(
    name: '__dartStreamTransformerBind',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartConverterBind'],
  ),
  '__dartStreamTransform': EsmRuntimeHelperSpec(
    name: '__dartStreamTransform',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamTransformerBind'],
  ),
  '__dartStreamEventTransformed': EsmRuntimeHelperSpec(
    name: '__dartStreamEventTransformed',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamController', '__dartStreamIterable'],
  ),
  '__dartStreamDistinct': EsmRuntimeHelperSpec(
    name: '__dartStreamDistinct',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartEquals', '__dartStreamIterable'],
  ),
  '__dartStreamHandleError': EsmRuntimeHelperSpec(
    name: '__dartStreamHandleError',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamTake': EsmRuntimeHelperSpec(
    name: '__dartStreamTake',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamSkip': EsmRuntimeHelperSpec(
    name: '__dartStreamSkip',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamTimeout': EsmRuntimeHelperSpec(
    name: '__dartStreamTimeout',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamController', '__dartStreamIterable'],
  ),
  '__dartStreamTakeWhile': EsmRuntimeHelperSpec(
    name: '__dartStreamTakeWhile',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamSkipWhile': EsmRuntimeHelperSpec(
    name: '__dartStreamSkipWhile',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamToList': EsmRuntimeHelperSpec(
    name: '__dartStreamToList',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamToSet': EsmRuntimeHelperSpec(
    name: '__dartStreamToSet',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartSetAdd', '__dartStreamIterable'],
  ),
  '__dartStreamFold': EsmRuntimeHelperSpec(
    name: '__dartStreamFold',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamReduce': EsmRuntimeHelperSpec(
    name: '__dartStreamReduce',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamForEach': EsmRuntimeHelperSpec(
    name: '__dartStreamForEach',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamCast': EsmRuntimeHelperSpec(
    name: '__dartStreamCast',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartAs', '__dartStreamIterable'],
  ),
  '__dartStreamFirst': EsmRuntimeHelperSpec(
    name: '__dartStreamFirst',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamLast': EsmRuntimeHelperSpec(
    name: '__dartStreamLast',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamSingle': EsmRuntimeHelperSpec(
    name: '__dartStreamSingle',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamLength': EsmRuntimeHelperSpec(
    name: '__dartStreamLength',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamIsEmpty': EsmRuntimeHelperSpec(
    name: '__dartStreamIsEmpty',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamAny': EsmRuntimeHelperSpec(
    name: '__dartStreamAny',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamEvery': EsmRuntimeHelperSpec(
    name: '__dartStreamEvery',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamFirstWhere': EsmRuntimeHelperSpec(
    name: '__dartStreamFirstWhere',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamLastWhere': EsmRuntimeHelperSpec(
    name: '__dartStreamLastWhere',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamSingleWhere': EsmRuntimeHelperSpec(
    name: '__dartStreamSingleWhere',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamContains': EsmRuntimeHelperSpec(
    name: '__dartStreamContains',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartEquals', '__dartStreamIterable'],
  ),
  '__dartStreamJoin': EsmRuntimeHelperSpec(
    name: '__dartStreamJoin',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStr', '__dartStreamIterable'],
  ),
  '__dartStreamDrain': EsmRuntimeHelperSpec(
    name: '__dartStreamDrain',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamPipe': EsmRuntimeHelperSpec(
    name: '__dartStreamPipe',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamListen': EsmRuntimeHelperSpec(
    name: '__dartStreamListen',
    category: EsmRuntimeHelperCategory.stream,
  ),
};

const _legacyStreamRuntimeHelpers = {
  '__dartStreamFromIterable',
  '__dartStreamFromFuture',
  '__dartStreamIterable',
  '__dartStreamFromFutures',
  '__dartStreamMulti',
  '__dartStreamError',
  '__dartStreamPeriodic',
  '__dartStreamAsBroadcastStream',
  '__dartStreamMap',
  '__dartStreamWhere',
  '__dartStreamAsyncMap',
  '__dartStreamAsyncExpand',
  '__dartStreamExpand',
  '__dartStreamTransformerFromBind',
  '__dartStreamTransformerFromHandlers',
  '__dartStreamTransformerBind',
  '__dartStreamTransform',
  '__dartStreamEventTransformed',
  '__dartStreamDistinct',
  '__dartStreamHandleError',
  '__dartStreamTake',
  '__dartStreamSkip',
  '__dartStreamTimeout',
  '__dartStreamTakeWhile',
  '__dartStreamSkipWhile',
  '__dartStreamToList',
  '__dartStreamToSet',
  '__dartStreamFold',
  '__dartStreamReduce',
  '__dartStreamForEach',
  '__dartStreamCast',
  '__dartStreamFirst',
  '__dartStreamLast',
  '__dartStreamSingle',
  '__dartStreamLength',
  '__dartStreamIsEmpty',
  '__dartStreamAny',
  '__dartStreamEvery',
  '__dartStreamFirstWhere',
  '__dartStreamLastWhere',
  '__dartStreamSingleWhere',
  '__dartStreamContains',
  '__dartStreamJoin',
  '__dartStreamDrain',
  '__dartStreamPipe',
  '__dartStreamListen',
};

Set<String> resolveEsmRuntimeHelperDependencies(Iterable<String> helpers) {
  final resolved = <String>{};

  void visit(String name) {
    if (!resolved.add(name)) {
      return;
    }
    final spec = _helperSpecs[name];
    if (spec == null) {
      return;
    }
    for (final dependency in spec.dependencies) {
      visit(dependency);
    }
  }

  for (final helper in helpers) {
    visit(helper);
  }
  return resolved;
}

bool isEsmLegacyStreamRuntimeHelper(String name) =>
    _legacyStreamRuntimeHelpers.contains(name);
